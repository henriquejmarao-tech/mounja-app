import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Leaf, Utensils, RefreshCw, X, Coffee, Sun, Moon, Cookie, Apple } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MealSuggestion {
  meal: string;
  items: string[];
  reason: string;
  calories_approx: number;
  protein_approx: number;
  tip: string;
  context_note: string;
}

const mealTypes = [
  { id: "cafe", label: "Café da manhã", icon: Coffee, color: "hsl(25 80% 52%)", emoji: "☕" },
  { id: "almoco", label: "Almoço", icon: Sun, color: "hsl(45 93% 47%)", emoji: "🍽️" },
  { id: "lanche", label: "Lanche da tarde", icon: Cookie, color: "hsl(174 42% 48%)", emoji: "🍎" },
  { id: "jantar", label: "Jantar", icon: Moon, color: "hsl(260 60% 55%)", emoji: "🌙" },
];

const Nutrition = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<MealSuggestion | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [userContext, setUserContext] = useState<any>({});
  const [loading, setLoading] = useState(true);

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

      const avg = (key: string) => {
        if (!logs.length) return 0;
        return logs.reduce((s: number, l: any) => s + (l[key] || 0), 0) / logs.length;
      };

      const latestWeight = logs.find((l: any) => l.weight)?.weight;
      const daysSinceInj = inj[0] ? Math.floor((Date.now() - new Date(inj[0].date + "T12:00:00").getTime()) / 86400000) : null;

      setUserContext({
        weight: latestWeight || profile?.current_weight,
        goal: profile?.goal,
        dose: profile?.current_dose,
        daysSinceInjection: daysSinceInj,
        nausea: avg("symptom_nausea"),
        fatigue: avg("symptom_fatigue"),
        constipation: avg("symptom_constipation"),
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

  const generateSuggestion = async (mealType: string) => {
    setSelectedMeal(mealType);
    setGenerating(true);
    setSuggestion(null);

    const mealLabel = mealTypes.find((m) => m.id === mealType)?.label || mealType;

    try {
      const { data, error } = await supabase.functions.invoke("diet-suggestion", {
        body: { userContext, mealType: mealLabel },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (data?.suggestion) setSuggestion(data.suggestion);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar sugestão.");
      setSelectedMeal(null);
    }
    setGenerating(false);
  };

  const selectedMealConfig = mealTypes.find((m) => m.id === selectedMeal);

  // If no meal selected yet, show picker
  const showPicker = !selectedMeal || (!generating && !suggestion);

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F6F8F7" }}>
      {/* Header */}
      <header className="sticky top-0 z-30">
        <div
          className="px-5 pb-14"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
            background: "linear-gradient(180deg, hsl(174, 42%, 48%) 0%, hsl(174, 42%, 48%) 50%, hsla(174, 42%, 48%, 0.65) 70%, hsla(174, 42%, 48%, 0.15) 85%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <button onClick={() => selectedMeal && suggestion ? (setSuggestion(null), setSelectedMeal(null)) : navigate(-1)} className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-base font-bold text-white">Alimentação</h1>
            <div className="w-10" />
          </div>
        </div>
      </header>

      <div className="px-5 -mt-6 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-[20px] p-5 animate-pulse h-24" style={{ boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }} />
            ))}
          </div>
        ) : !selectedMeal ? (
          /* ── Meal type picker ── */
          <>
            <div
              className="rounded-[20px] p-5 animate-fade-in-up"
              style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Utensils className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground/85">O que você quer comer?</h2>
              </div>
              <p className="text-xs text-muted-foreground/60 mb-5">Escolha o tipo de refeição e geramos uma sugestão personalizada 🌿</p>

              <div className="grid grid-cols-2 gap-3">
                {mealTypes.map((meal, i) => (
                  <button
                    key={meal.id}
                    onClick={() => generateSuggestion(meal.id)}
                    className="rounded-[16px] p-4 text-left active:scale-[0.96] transition-all duration-200 animate-fade-in-up"
                    style={{
                      animationDelay: `${i * 60}ms`,
                      background: `${meal.color}08`,
                      border: `1px solid ${meal.color}15`,
                      boxShadow: "0 2px 8px rgba(17,24,39,0.04)",
                    }}
                  >
                    <span className="text-2xl mb-2 block">{meal.emoji}</span>
                    <p className="text-sm font-semibold text-foreground/80">{meal.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ── Suggestion result ── */
          <div className="animate-fade-in-up">
            {/* Generating state */}
            {generating && (
              <div
                className="rounded-[20px] p-8 flex flex-col items-center justify-center gap-3"
                style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
              >
                <div className="w-10 h-10 border-3 rounded-full animate-spin" style={{ borderColor: `${selectedMealConfig?.color}30`, borderTopColor: selectedMealConfig?.color }} />
                <p className="text-sm text-muted-foreground">Pensando no melhor {selectedMealConfig?.label?.toLowerCase()}...</p>
                <p className="text-xs text-muted-foreground/50">Alguns segundos</p>
              </div>
            )}

            {/* Result */}
            {suggestion && !generating && (
              <div className="space-y-3">
                {/* Context note */}
                {suggestion.context_note && (
                  <div
                    className="rounded-[16px] px-4 py-3"
                    style={{ background: `${selectedMealConfig?.color}08`, border: `1px solid ${selectedMealConfig?.color}15` }}
                  >
                    <p className="text-xs font-medium" style={{ color: selectedMealConfig?.color }}>{suggestion.context_note}</p>
                  </div>
                )}

                {/* Main card */}
                <div
                  className="rounded-[20px] p-5"
                  style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
                >
                  {/* Meal name */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{selectedMealConfig?.emoji}</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">{selectedMealConfig?.label}</p>
                      <p className="text-base font-bold text-foreground/90">{suggestion.meal}</p>
                    </div>
                  </div>

                  {/* Items */}
                  {suggestion.items?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Utensils className="w-3 h-3" style={{ color: selectedMealConfig?.color }} />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Ingredientes</p>
                      </div>
                      <ul className="space-y-1.5">
                        {suggestion.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: `${selectedMealConfig?.color}50` }} />
                            <span className="text-[13px] text-foreground/75 leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Reason */}
                  {suggestion.reason && (
                    <p className="text-xs text-muted-foreground/70 leading-relaxed mb-4">{suggestion.reason}</p>
                  )}

                  {/* Macros */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-[12px] px-3 py-2.5 text-center" style={{ background: `${selectedMealConfig?.color}06` }}>
                      <p className="text-[10px] text-muted-foreground/50 font-medium mb-0.5">Calorias</p>
                      <p className="text-lg font-bold" style={{ color: selectedMealConfig?.color }}>{suggestion.calories_approx || "—"}</p>
                    </div>
                    <div className="rounded-[12px] px-3 py-2.5 text-center" style={{ background: `${selectedMealConfig?.color}06` }}>
                      <p className="text-[10px] text-muted-foreground/50 font-medium mb-0.5">Proteína</p>
                      <p className="text-lg font-bold" style={{ color: selectedMealConfig?.color }}>{suggestion.protein_approx ? `${suggestion.protein_approx}g` : "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Tip */}
                {suggestion.tip && (
                  <div
                    className="rounded-[16px] px-4 py-3"
                    style={{ background: "#FFFFFF", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}
                  >
                    <p className="text-xs text-foreground/70 leading-relaxed">💡 {suggestion.tip}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5 pt-1">
                  <button
                    onClick={() => generateSuggestion(selectedMeal!)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[16px] text-sm font-semibold active:scale-[0.97] transition-all"
                    style={{ background: `${selectedMealConfig?.color}10`, color: selectedMealConfig?.color }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Outra sugestão
                  </button>
                  <button
                    onClick={() => { setSuggestion(null); setSelectedMeal(null); }}
                    className="px-5 py-3.5 rounded-[16px] text-sm font-semibold text-muted-foreground/60 active:scale-[0.97] transition-all"
                    style={{ background: "rgba(17,24,39,0.04)" }}
                  >
                    Trocar refeição
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Nutrition;
