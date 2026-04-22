import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Syringe, Camera, Utensils, Dumbbell, ClipboardList, Mail, Copy, Check, X,
  Instagram, Phone, MessageCircle, StickyNote, Loader2,
} from "lucide-react";

interface Props {
  userId: string | null;
  onClose: () => void;
  onMetadataChanged?: () => void;
}

interface TimelineEvent {
  kind: "log" | "injection" | "meal" | "workout" | "photo";
  date: string;
  ts: string | null;
  label: string;
  meta: string | null;
}

interface TimelineResp {
  profile: any;
  email: string;
  events: TimelineEvent[];
}

interface FounderMeta {
  user_id: string;
  instagram_handle: string | null;
  whatsapp: string | null;
  notes: string | null;
  talked_at: string | null;
  contacted_by: string | null;
  created_at?: string;
  updated_at?: string;
}

const KIND_ICON: Record<string, React.ReactNode> = {
  log: <ClipboardList className="w-3.5 h-3.5 text-emerald-300" />,
  injection: <Syringe className="w-3.5 h-3.5 text-amber-300" />,
  meal: <Utensils className="w-3.5 h-3.5 text-cyan-300" />,
  workout: <Dumbbell className="w-3.5 h-3.5 text-purple-300" />,
  photo: <Camera className="w-3.5 h-3.5 text-rose-300" />,
};

const KIND_BG: Record<string, string> = {
  log: "bg-emerald-500/10 border-emerald-500/30",
  injection: "bg-amber-500/10 border-amber-500/30",
  meal: "bg-cyan-500/10 border-cyan-500/30",
  workout: "bg-purple-500/10 border-purple-500/30",
  photo: "bg-rose-500/10 border-rose-500/30",
};

function relativeFromNow(iso: string | null) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
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

export const InboxUserSheet = ({ userId, onClose, onMetadataChanged }: Props) => {
  const [data, setData] = useState<TimelineResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Founder metadata
  const [meta, setMeta] = useState<FounderMeta | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [markingTalked, setMarkingTalked] = useState(false);

  // Editable form fields
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [notes, setNotes] = useState("");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAdminEmail(data.user?.email || null);
    });
  }, []);

  // Fetch timeline + metadata when userId opens
  useEffect(() => {
    if (!userId) return;
    setData(null);
    setMeta(null);
    setInstagram("");
    setWhatsapp("");
    setNotes("");
    setLoading(true);
    setMetaLoading(true);

    supabase.functions
      .invoke("admin-analytics", { body: { action: "user-timeline", userId } })
      .then(({ data, error }) => {
        if (!error) setData(data);
      })
      .finally(() => setLoading(false));

    // GET admin-user-metadata?user_id=...
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-metadata?user_id=${userId}`;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const token = session?.access_token;
      fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      })
        .then((r) => r.json())
        .then((res) => {
          const m: FounderMeta | null = res?.metadata || null;
          setMeta(m);
          setInstagram(m?.instagram_handle || "");
          setWhatsapp(m?.whatsapp || "");
          setNotes(m?.notes || "");
        })
        .catch(() => { /* silent */ })
        .finally(() => setMetaLoading(false));
    });
  }, [userId]);

  const dirty = useMemo(() => {
    return (
      (meta?.instagram_handle || "") !== instagram ||
      (meta?.whatsapp || "") !== whatsapp ||
      (meta?.notes || "") !== notes
    );
  }, [meta, instagram, whatsapp, notes]);

  const saveMeta = async (extra: Partial<FounderMeta> = {}) => {
    if (!userId) return;
    setSavingMeta(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("admin-user-metadata", {
        body: {
          user_id: userId,
          instagram_handle: instagram,
          whatsapp,
          notes,
          ...extra,
        },
      });
      if (error) throw error;
      const m: FounderMeta | null = res?.metadata || null;
      setMeta(m);
      if (m) {
        setInstagram(m.instagram_handle || "");
        setWhatsapp(m.whatsapp || "");
        setNotes(m.notes || "");
      }
      toast.success("Contato salvo");
      onMetadataChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar");
    } finally {
      setSavingMeta(false);
    }
  };

  const markTalkedToday = async () => {
    if (!userId) return;
    setMarkingTalked(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("admin-user-metadata", {
        body: {
          user_id: userId,
          talked_at: new Date().toISOString(),
          contacted_by: adminEmail || "admin",
        },
      });
      if (error) throw error;
      const m: FounderMeta | null = res?.metadata || null;
      setMeta(m);
      toast.success("Marcado como contatado hoje");
      onMetadataChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao marcar contato");
    } finally {
      setMarkingTalked(false);
    }
  };

  const copyEmail = () => {
    if (!data?.email) return;
    navigator.clipboard.writeText(data.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Group events by day
  const groups: Record<string, TimelineEvent[]> = {};
  (data?.events || []).forEach((e) => {
    const k = e.date || "—";
    if (!groups[k]) groups[k] = [];
    groups[k].push(e);
  });
  const sortedDays = Object.keys(groups).sort((a, b) => (a < b ? 1 : -1));

  if (!userId) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-950 p-4 text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">{data?.profile?.name || "Sem nome"}</h2>
            <p className="mt-1 text-xs text-slate-500">Histórico operacional do usuário</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label="Fechar painel do usuário"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}

        {data && (
          <div className="mt-4 space-y-4">
            {/* Identity card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 truncate flex-1">{data.email}</span>
                <button
                  onClick={copyEmail}
                  className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors"
                  title="Copiar email"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                </button>
                <a
                  href={`mailto:${data.email}`}
                  className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 transition-colors"
                  title="Abrir email"
                >
                  <Mail className="w-3.5 h-3.5 text-white" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {data.profile?.created_at && (
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-normal">
                    Cadastro: {new Date(data.profile.created_at).toLocaleDateString("pt-BR")}
                  </Badge>
                )}
                {data.profile?.medication && (
                  <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-normal">
                    {data.profile.medication}{data.profile.current_dose ? ` · ${data.profile.current_dose}` : ""}
                  </Badge>
                )}
                {data.profile?.triage_completed && (
                  <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px] font-normal">
                    Triagem ✓
                  </Badge>
                )}
              </div>
            </div>

            {/* Contact / Founder metadata card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Contato</h3>
                {metaLoading && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1.5">
                    <Instagram className="w-3 h-3" /> Instagram
                  </label>
                  <Input
                    value={instagram}
                    disabled={metaLoading}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@usuario"
                    className="mt-1 h-8 text-xs bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> WhatsApp
                  </label>
                  <Input
                    value={whatsapp}
                    disabled={metaLoading}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+55 11 9XXXX-XXXX"
                    className="mt-1 h-8 text-xs bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1.5">
                    <StickyNote className="w-3 h-3" /> Notas
                  </label>
                  <Textarea
                    value={notes}
                    disabled={metaLoading}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contexto, próximos passos, lembretes…"
                    rows={3}
                    className="mt-1 text-xs bg-slate-800/60 border-slate-700/50 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>
              </div>

              {/* Talked at indicator */}
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex-1 text-[11px] text-slate-300">
                  {meta?.talked_at ? (
                    <>
                      Último contato: <span className="text-white font-medium">{relativeFromNow(meta.talked_at)}</span>
                      {meta.contacted_by && <span className="text-slate-500"> ({meta.contacted_by})</span>}
                    </>
                  ) : (
                    <span className="text-slate-500">Sem contato registrado</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={markTalkedToday}
                  disabled={markingTalked || metaLoading}
                  className="flex-1 h-8 text-[11px] rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {markingTalked && <Loader2 className="w-3 h-3 animate-spin" />}
                  Marcar como contatado hoje
                </button>
                {dirty && (
                  <button
                    onClick={() => saveMeta()}
                    disabled={savingMeta || metaLoading}
                    className="px-3 h-8 text-[11px] rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {savingMeta && <Loader2 className="w-3 h-3 animate-spin" />}
                    Salvar
                  </button>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="px-4 py-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200">
                  Timeline · {data.events.length} açõe{data.events.length === 1 ? "" : "s"}
                </h3>
              </div>

              {data.events.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8 px-4">
                  Nenhuma ação registrada ainda.
                </p>
              ) : (
                <div className="p-4 space-y-4">
                  {sortedDays.map((day) => (
                    <div key={day}>
                      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
                        {new Date(day + "T12:00:00").toLocaleDateString("pt-BR", {
                          weekday: "short", day: "2-digit", month: "short",
                        })}
                      </div>
                      <div className="space-y-1.5 border-l border-slate-800 pl-3 ml-1">
                        {groups[day].map((e, idx) => {
                          const time = e.ts ? new Date(e.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;
                          return (
                            <div
                              key={idx}
                              className={`rounded-lg border ${KIND_BG[e.kind]} px-2.5 py-1.5 text-[11px] flex items-start gap-2`}
                            >
                              <div className="mt-0.5">{KIND_ICON[e.kind]}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-slate-100">{e.label}</div>
                                {e.meta && (
                                  <div className="text-[10px] text-slate-400 truncate">{e.meta}</div>
                                )}
                              </div>
                              {time && <div className="text-[10px] text-slate-500 shrink-0">{time}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
