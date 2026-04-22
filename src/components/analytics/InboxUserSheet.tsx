import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Syringe, Camera, Utensils, Dumbbell, ClipboardList, Mail, Copy, Check, X,
} from "lucide-react";

interface Props {
  userId: string | null;
  onClose: () => void;
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

export const InboxUserSheet = ({ userId, onClose }: Props) => {
  const [data, setData] = useState<TimelineResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setData(null);
    setLoading(true);
    supabase.functions
      .invoke("admin-analytics", { body: { action: "user-timeline", userId } })
      .then(({ data, error }) => {
        if (!error) setData(data);
      })
      .finally(() => setLoading(false));
  }, [userId]);

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

  return (
    userId ? (
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
    ) : null
  );
};
