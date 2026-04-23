// prompt 3 rebuild trigger
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Copy, Check, Inbox as InboxIcon, ChevronLeft, ChevronRight, Instagram, Phone, StickyNote, MessageCircle } from "lucide-react";
import { InboxUserSheet } from "./InboxUserSheet";

type Freshness = "today" | "yesterday" | "week" | "two_weeks" | "stale" | "never";
type Group = "power" | "courtesy" | "warm" | "ghost" | "zero" | "other";

interface InboxRow {
  id: string;
  name: string | null;
  email: string;
  createdAt: string | null;
  isPremium: boolean;
  premiumSource: string | null;
  premiumPromo: string | null;
  counts: { logs: number; injections: number; meals: number; workouts: number; photos: number };
  total: number;
  lastActivity: { date: string; ts: string; kind: string } | null;
  freshness: Freshness;
  group: Group;
  instagramHandle?: string | null;
  whatsapp?: string | null;
  talkedAt?: string | null;
  hasNotes?: boolean;
}

interface InboxResp {
  rows: InboxRow[];
  generatedAt: string;
}

const FRESHNESS_META: Record<Freshness, { label: string; emoji: string; cls: string; rank: number }> = {
  today:      { label: "Hoje",     emoji: "🟢", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30", rank: 6 },
  yesterday:  { label: "Ontem",    emoji: "🟡", cls: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",   rank: 5 },
  week:       { label: "2–7d",     emoji: "🟠", cls: "bg-orange-500/15 text-orange-300 border-orange-500/30",   rank: 4 },
  two_weeks:  { label: "7–14d",    emoji: "🔴", cls: "bg-rose-500/15 text-rose-300 border-rose-500/30",         rank: 3 },
  stale:      { label: "14+d",     emoji: "⚫", cls: "bg-slate-700/40 text-slate-300 border-slate-600/40",     rank: 2 },
  never:      { label: "Nunca",    emoji: "⚪", cls: "bg-slate-800/60 text-slate-400 border-slate-700/40",     rank: 1 },
};

const GROUP_META: Record<Group, { label: string; cls: string }> = {
  power:    { label: "Power",            cls: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  courtesy: { label: "Premium cortesia", cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  warm:     { label: "Morno",            cls: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  ghost:    { label: "Fantasma",         cls: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30" },
  zero:     { label: "Zero",             cls: "bg-slate-700/50 text-slate-300 border-slate-600/40" },
  other:    { label: "Outro",            cls: "bg-slate-800/60 text-slate-400 border-slate-700/40" },
};

const KIND_LABEL: Record<string, string> = {
  log: "check-in",
  injection: "aplicou caneta",
  meal: "registrou refeição",
  workout: "treinou",
  photo: "subiu foto",
};

const PAGE_SIZE = 100;

function formatDateBR(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function relativeFromNow(iso: string | null) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `há ${w} semana${w > 1 ? "s" : ""}`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `há ${m} ${m > 1 ? "meses" : "mês"}`;
  }
  const y = Math.floor(days / 365);
  return `há ${y} ano${y > 1 ? "s" : ""}`;
}

export const InboxTab = () => {
  const [data, setData] = useState<InboxResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [freshFilters, setFreshFilters] = useState<Set<Freshness>>(new Set());
  const [groupFilters, setGroupFilters] = useState<Set<Group>>(new Set());
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "premium">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInbox = useCallback(() => {
    setLoading(true);
    return supabase.functions
      .invoke("admin-analytics", { body: { action: "inbox" } })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setData(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.rows
      .filter((r) => {
        if (freshFilters.size > 0 && !freshFilters.has(r.freshness)) return false;
        if (groupFilters.size > 0 && !groupFilters.has(r.group)) return false;
        if (planFilter === "free" && r.isPremium) return false;
        if (planFilter === "premium" && !r.isPremium) return false;
        if (q) {
          const hay = `${r.name || ""} ${r.email || ""}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Frescor DESC (rank desc), tiebreak by total DESC
        const rA = FRESHNESS_META[a.freshness].rank;
        const rB = FRESHNESS_META[b.freshness].rank;
        if (rA !== rB) return rB - rA;
        return b.total - a.total;
      });
  }, [data, freshFilters, groupFilters, planFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [freshFilters, groupFilters, planFilter, search]);

  const toggleFresh = (f: Freshness) => {
    const next = new Set(freshFilters);
    next.has(f) ? next.delete(f) : next.add(f);
    setFreshFilters(next);
  };
  const toggleGroup = (g: Group) => {
    const next = new Set(groupFilters);
    next.has(g) ? next.delete(g) : next.add(g);
    setGroupFilters(next);
  };

  const copyEmail = (id: string, email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }
  if (error) return <div className="p-6 text-rose-400 text-sm text-center">{error}</div>;
  if (!data) return null;

  // Counts by bucket (for filter pills)
  const freshCounts: Record<Freshness, number> = { today: 0, yesterday: 0, week: 0, two_weeks: 0, stale: 0, never: 0 };
  const groupCounts: Record<Group, number> = { power: 0, courtesy: 0, warm: 0, ghost: 0, zero: 0, other: 0 };
  data.rows.forEach((r) => { freshCounts[r.freshness]++; groupCounts[r.group]++; });

  return (
    <div className="space-y-4">
      {/* Header summary */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <InboxIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">Inbox operacional</h3>
          <span className="ml-auto text-[10px] text-slate-500">
            {filtered.length} de {data.rows.length} usuários
          </span>
        </div>

        {/* Frescor filters */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Frescor</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(FRESHNESS_META) as Freshness[])
              .sort((a, b) => FRESHNESS_META[b].rank - FRESHNESS_META[a].rank)
              .map((f) => {
                const m = FRESHNESS_META[f];
                const active = freshFilters.has(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleFresh(f)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                      active ? m.cls + " ring-1 ring-white/30" : "bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800"
                    }`}
                  >
                    {m.emoji} {m.label} <span className="opacity-60">({freshCounts[f]})</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Group filters */}
        <div className="space-y-2 mt-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Grupo</div>
          <div className="flex flex-wrap gap-1.5">
            {(["power", "courtesy", "warm", "ghost", "zero"] as Group[]).map((g) => {
              const m = GROUP_META[g];
              const active = groupFilters.has(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGroup(g)}
                  className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                    active ? m.cls + " ring-1 ring-white/30" : "bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800"
                  }`}
                >
                  {m.label} <span className="opacity-60">({groupCounts[g]})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Plan + search */}
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="flex gap-1.5">
            {(["all", "free", "premium"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlanFilter(p)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${
                  planFilter === p
                    ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 ring-1 ring-white/20"
                    : "bg-slate-800/40 text-slate-400 border-slate-700/50 hover:bg-slate-800"
                }`}
              >
                {p === "all" ? "Todos" : p === "free" ? "Free" : "Premium"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome ou email…"
              className="h-8 text-xs pl-8 bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700/50 text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="px-3 py-2 font-medium">Frescor</th>
                <th className="px-3 py-2 font-medium">Usuário</th>
                <th className="px-3 py-2 font-medium">Plano</th>
                <th className="px-3 py-2 font-medium">Grupo</th>
                <th className="px-3 py-2 font-medium">Última ação</th>
                <th className="px-3 py-2 font-medium text-center">Total</th>
                <th className="px-3 py-2 font-medium">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => {
                const fm = FRESHNESS_META[r.freshness];
                const gm = GROUP_META[r.group];
                const lastTxt = r.lastActivity
                  ? `${KIND_LABEL[r.lastActivity.kind] || r.lastActivity.kind} · ${formatDateBR(r.lastActivity.date)}`
                  : r.createdAt
                    ? `— cadastrou-se em ${new Date(r.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`
                    : "—";

                return (
                  <tr
                    key={r.id}
                    onClick={() => setOpenUserId(r.id)}
                    className="border-b border-slate-800/40 hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2">
                      <Badge className={`${fm.cls} text-[10px] px-1.5 py-0 font-normal whitespace-nowrap`}>
                        {fm.emoji} {fm.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-white truncate max-w-[160px] flex items-center gap-1">
                            <span className="truncate">{r.name || "Sem nome"}</span>
                            {r.instagramHandle && (
                              <Instagram className="w-3 h-3 text-pink-300 shrink-0" aria-label="Tem Instagram" />
                            )}
                            {r.whatsapp && (
                              <Phone className="w-3 h-3 text-emerald-300 shrink-0" aria-label="Tem WhatsApp" />
                            )}
                            {r.hasNotes && (
                              <StickyNote className="w-3 h-3 text-amber-300 shrink-0" aria-label="Tem notas" />
                            )}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate max-w-[160px]">{r.email}</div>
                          {r.talkedAt && (() => {
                            const days = Math.floor((Date.now() - new Date(r.talkedAt).getTime()) / 86400000);
                            const recent = days <= 7;
                            return (
                              <div className="mt-0.5 flex items-center gap-1">
                                <MessageCircle className="w-2.5 h-2.5" />
                                <span
                                  className={`text-[9px] px-1.5 py-0 rounded-full border ${
                                    recent
                                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                                      : "bg-slate-700/50 text-slate-300 border-slate-600/40"
                                  }`}
                                >
                                  {recent ? "falei recente" : `falei há ${days}d`}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                        <button
                          onClick={(e) => copyEmail(r.id, r.email, e)}
                          className="p-1 rounded hover:bg-slate-700 transition-colors shrink-0"
                          title="Copiar email"
                        >
                          {copiedId === r.id
                            ? <Check className="w-3 h-3 text-emerald-400" />
                            : <Copy className="w-3 h-3 text-slate-500" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {r.isPremium ? (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] px-1.5 py-0 font-normal">
                          Premium {r.premiumSource ? `(${r.premiumSource === "stripe" || r.premiumSource === "paid" ? "pago" : r.premiumSource})` : ""}
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/30 text-[10px] px-1.5 py-0 font-normal">
                          Free
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={`${gm.cls} text-[10px] px-1.5 py-0 font-normal whitespace-nowrap`}>
                        {gm.label}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-300 whitespace-nowrap">{lastTxt}</td>
                    <td className="px-3 py-2 text-center text-[11px] text-white font-medium">{r.total}</td>
                    <td className="px-3 py-2 text-[11px] text-slate-400 whitespace-nowrap">{relativeFromNow(r.createdAt)}</td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">
                    Nenhum usuário corresponde aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700/50 text-[11px] text-slate-400">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <InboxUserSheet
        userId={openUserId}
        onClose={() => setOpenUserId(null)}
        onMetadataChanged={fetchInbox}
      />
    </div>
  );
};
