import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Leaf, Utensils, RefreshCw, Save, X, Coffee, Sun, Moon, Apple } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ContextualHint from "@/components/tutorial/ContextualHint";
import FeaturedForYou from "@/components/FeaturedForYou";

interface MealSuggestion {
  meal: string;
  items: string[];
  reason: string;
  calories_approx: number;
  protein_approx: number;
  tip: string;
  context_note: string;
}

const Nutrition = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [recentSymptoms, setRecentSymptoms] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null);
  const [userContext, setUserContext] = useState<any>({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

      const [logsRes, injRes, workoutsRes] = await Promise.all([
        supabase.from("daily_logs").select("symptom_nausea, symptom_fatigue, symptom_headache, symptom_constipation, symptom_diarrhea, weight").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
        supabase.from("injections").select("date").eq("user_id", user.id).order("date", { ascending: false }).limit(1),
        supabase.from("workouts" as any).select("id").eq("user_id", user.id).gte("date", weekAgo),
      ]);

      const logs = (logsRes.data as any[]) || [];
      const inj = (injRes.data as any[]) || [];
      const workouts = (workoutsRes.data as any[]) || [];

      if (logs.length > 0) {
        const avg = (key: string) => logs.reduce((s: number, l: any) => s + (l[key] || 0), 0) / logs.length;
        setRecentSymptoms({
          nausea: avg("symptom_nausea"),
          fatigue: avg("symptom_fatigue"),
          headache: avg("symptom_headache"),
          constipation: avg("symptom_constipation"),
        });
      }

      const latestWeight = logs.find((l: any) => l.weight)?.weight;
      const daysSinceInj = inj[0] ? Math.floor((Date.now() - new Date(inj[0].date + "T12:00:00").getTime()) / 86400000) : null;

      setUserContext({
        weight: latestWeight || profile?.current_weight,
        goal: profile?.goal,
        dose: profile?.current_dose,
        daysSinceInjection: daysSinceInj,
        nausea: recentSymptoms.nausea || 0,
        fatigue: recentSymptoms.fatigue || 0,
        constipation: recentSymptoms.constipation || 0,
        weeklyWorkouts: workouts.length,
        activityLevel: profile?.activity_level,
        dietaryRestrictions: (profile?.dietary_restrictions as string[])?.join(", "),
        sex: profile?.sex,
        age: profile?.age,
      });

      setLoading(false);
    };
    fetchData();
  }, [user, profile]);

  const generateSuggestion = async () => {
    setGenerating(true);
    setSuggestion(null);
    setShowModal(true);

    try {
      const { data, error } = await supabase.functions.invoke("diet-suggestion", {
        body: { userContext },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.suggestion) {
        setSuggestion(data.suggestion);
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar sugestão.");
      setShowModal(false);
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-30">
        <div
          className="px-5 pb-14"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
            background: "linear-gradient(180deg, hsl(174, 42%, 48%) 0%, hsl(174, 42%, 48%) 50%, hsla(174, 42%, 48%, 0.65) 70%, hsla(174, 42%, 48%, 0.15) 85%, transparent 100%)",
          }}
        >
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-white" />
            <h1 className="text-xl font-bold text-white">Alimentação</h1>
          </div>
        </div>
      </header>

      <div className="px-5 mt-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <>
            {/* Meal suggestion CTA */}
            <button
              data-tutorial="diet-btn"
              onClick={generateSuggestion}
              disabled={generating}
              className="w-full py-4 rounded-xl gradient-nutrition text-white shadow-sm active:scale-[0.97] transition-transform flex flex-col items-center justify-center gap-1 animate-fade-in-up disabled:opacity-60"
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-bold">Sugerir refeição</span>
                  </div>
                  <span className="text-[11px] text-white/70 font-medium">Baseado no seu tratamento, fome e energia</span>
                </>
              )}
            </button>

            <FeaturedForYou context="nutrition" />
          </>
        )}
      </div>

      {/* Meal Suggestion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-card flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-info" />
              <h2 className="font-bold text-base">Refeição sugerida</h2>
            </div>
            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {generating ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-10 h-10 border-3 border-info/30 border-t-info rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Pensando na melhor refeição...</p>
                <p className="text-xs text-muted-foreground/60">Isso pode levar alguns segundos</p>
              </div>
            ) : suggestion ? (
              <>
                {suggestion.context_note && (
                  <div className="bg-info/5 rounded-xl px-3.5 py-2.5 border border-info/10">
                    <p className="text-xs text-info font-medium">{suggestion.context_note}</p>
                  </div>
                )}

                {/* Meal name */}
                {suggestion.meal && (
                  <div className="bg-muted/50 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Sugestão</p>
                    <p className="text-base font-bold">{suggestion.meal}</p>
                  </div>
                )}

                {/* Items list */}
                {suggestion.items && suggestion.items.length > 0 && (
                  <div className="bg-muted/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Utensils className="w-3.5 h-3.5 text-info" />
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Ingredientes</p>
                    </div>
                    <ul className="space-y-1.5">
                      {suggestion.items.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-info/40 shrink-0 mt-[7px]" />
                          <span className="text-[13px] leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reason */}
                {suggestion.reason && (
                  <div className="bg-info/5 rounded-xl px-4 py-3 border border-info/10">
                    <p className="text-xs font-semibold mb-1">Motivo</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.reason}</p>
                  </div>
                )}

                {/* Macros */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">Calorias aprox.</p>
                    <p className="text-lg font-bold text-info">{suggestion.calories_approx || "—"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">Proteína aprox.</p>
                    <p className="text-lg font-bold text-info">{suggestion.protein_approx ? `${suggestion.protein_approx}g` : "—"}</p>
                  </div>
                </div>

                {suggestion.tip && (
                  <div className="bg-muted/30 rounded-xl px-4 py-3 border border-border/50">
                    <p className="text-xs font-semibold mb-1">💡 Dica</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.tip}</p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer actions */}
          {suggestion && !generating && (
            <div className="shrink-0 px-5 pt-3 border-t border-border/50 bg-card" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
              <button
                onClick={generateSuggestion}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-nutrition text-white text-sm font-semibold shadow-sm active:scale-[0.97]"
              >
                <RefreshCw className="w-4 h-4" />
                Outra sugestão
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Nutrition;