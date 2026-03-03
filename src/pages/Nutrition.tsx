import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Heart, Utensils, RefreshCw, Save, X, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ContextualHint from "@/components/tutorial/ContextualHint";
import FeaturedForYou from "@/components/FeaturedForYou";

interface TipCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  priority: number;
  tags: string[];
}

interface DietSuggestion {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
  calories_target: number;
  protein_target: number;
  tip: string;
  context_note: string;
}

const allTips: TipCard[] = [
  { id: "nausea", emoji: "🤢", title: "Lidando com náusea", description: "Prefira refeições frias ou em temperatura ambiente. Coma devagar, em pequenas porções ao longo do dia. Evite alimentos gordurosos ou muito condimentados. Gengibre (chá ou bala) pode ajudar.", priority: 1, tags: ["nausea"] },
  { id: "constipation", emoji: "😣", title: "Lidando com constipação", description: "Aumente a ingestão de fibras: frutas com casca, verduras e grãos integrais. Beba bastante água e tente se movimentar — até uma caminhada curta ajuda o intestino.", priority: 2, tags: ["constipation"] },
  { id: "hydration", emoji: "💧", title: "A importância da hidratação", description: "Beber pelo menos 2 litros de água por dia ajuda a reduzir efeitos colaterais e melhora a disposição. Use um copo grande como referência e vá completando ao longo do dia.", priority: 3, tags: ["always"] },
  { id: "portions", emoji: "🍽️", title: "Porções menores, mais vezes", description: "Em vez de 3 refeições grandes, tente 5-6 refeições pequenas. Isso ajuda na saciedade, reduz desconforto e mantém a energia estável ao longo do dia.", priority: 4, tags: ["always"] },
  { id: "protein", emoji: "💪", title: "Mantenha a proteína", description: "Durante a perda de peso, a proteína ajuda a preservar massa muscular. Inclua ovos, frango, peixe, iogurte ou leguminosas em cada refeição principal.", priority: 5, tags: ["always"] },
  { id: "fatigue-food", emoji: "😴", title: "Alimentação para dias cansados", description: "Se estiver sem energia, aposte em alimentos de fácil digestão: sopas, vitaminas de frutas, iogurte com granola. Não pule refeições — isso pode piorar a fadiga.", priority: 6, tags: ["fatigue"] },
  { id: "headache", emoji: "🤕", title: "Dor de cabeça frequente?", description: "Pode estar ligada à baixa ingestão de água ou comida. Tente manter uma rotina alimentar regular e beba água ao longo do dia. Evite longos períodos em jejum.", priority: 7, tags: ["headache"] },
];

const Nutrition = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [recentSymptoms, setRecentSymptoms] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState<DietSuggestion | null>(null);
  const [savedToday, setSavedToday] = useState(false);
  const [userContext, setUserContext] = useState<any>({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      const [logsRes, injRes, workoutsRes, savedRes] = await Promise.all([
        supabase.from("daily_logs").select("symptom_nausea, symptom_fatigue, symptom_headache, symptom_constipation, symptom_diarrhea, weight").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
        supabase.from("injections").select("date").eq("user_id", user.id).order("date", { ascending: false }).limit(1),
        supabase.from("workouts" as any).select("id").eq("user_id", user.id).gte("date", weekAgo),
        supabase.from("diet_suggestions" as any).select("*").eq("user_id", user.id).eq("date", today).limit(1),
      ]);

      const logs = (logsRes.data as any[]) || [];
      const inj = (injRes.data as any[]) || [];
      const workouts = (workoutsRes.data as any[]) || [];
      const saved = (savedRes.data as any[]) || [];

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

      if (saved.length > 0) {
        setSuggestion(saved[0]);
        setSavedToday(true);
      }

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

  const saveSuggestion = async () => {
    if (!user || !suggestion) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];

    // Delete existing today's suggestion first
    await supabase.from("diet_suggestions" as any).delete().eq("user_id", user.id).eq("date", today);

    const { error } = await supabase.from("diet_suggestions" as any).insert({
      user_id: user.id,
      date: today,
      breakfast: suggestion.breakfast,
      lunch: suggestion.lunch,
      dinner: suggestion.dinner,
      snack: suggestion.snack,
      calories_target: suggestion.calories_target,
      protein_target: suggestion.protein_target,
      tip: suggestion.tip,
      context_note: suggestion.context_note,
    } as any);

    if (error) toast.error("Erro ao salvar.");
    else {
      toast.success("Sugestão salva para hoje! 🥗");
      setSavedToday(true);
    }
    setSaving(false);
  };

  const sortedTips = [...allTips].sort((a, b) => {
    const aRelevant = a.tags.some((t) => t === "always" || (recentSymptoms[t] && recentSymptoms[t] >= 3));
    const bRelevant = b.tags.some((t) => t === "always" || (recentSymptoms[t] && recentSymptoms[t] >= 3));
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    return a.priority - b.priority;
  });

  const hasHighSymptoms = Object.values(recentSymptoms).some((v) => v >= 4);

  const mealIcons = [
    { key: "breakfast", label: "Café da manhã", Icon: Coffee },
    { key: "lunch", label: "Almoço", Icon: Sun },
    { key: "dinner", label: "Jantar", Icon: Moon },
    { key: "snack", label: "Lanche", Icon: Cookie },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Alimentação</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Cuidando do que nutre você</p>
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
            <FeaturedForYou context="nutrition" />
            <ContextualHint id="save-diet" message="Salve sua sugestão para acompanhar no histórico." className="mb-1" />
            {/* AI Diet suggestion button */}
            <button
              data-tutorial="diet-btn"
              onClick={generateSuggestion}
              disabled={generating}
              className="w-full bg-card rounded-2xl p-4 shadow-card border border-primary/20 flex items-center gap-3 hover:border-primary/40 transition-all animate-fade-in-up active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Sugestão de dieta de hoje</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {savedToday ? "Sugestão salva — toque para gerar outra" : "Adaptada ao seu momento"}
                </p>
              </div>
              <Utensils className="w-4 h-4 text-primary" />
            </button>

            {/* Personalized alert */}
            {hasHighSymptoms && (
              <div className="bg-warning/8 rounded-2xl p-4 border border-warning/15 flex items-start gap-3 animate-fade-in-up">
                <Sparkles className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Conteúdo personalizado para você</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Organizamos as dicas com base nos sintomas que você relatou recentemente.
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Estas são dicas educativas gerais. Não substituem orientação de nutricionista ou médico.
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              {sortedTips.map((tip, i) => {
                const isHighlighted = tip.tags.some((t) => t !== "always" && recentSymptoms[t] && recentSymptoms[t] >= 3);
                return (
                  <div
                    key={tip.id}
                    className={cn(
                      "rounded-2xl p-4 shadow-card border animate-fade-in-up",
                      isHighlighted ? "bg-primary/5 border-primary/15" : "bg-card border-border/50"
                    )}
                    style={{ animationDelay: `${(i + 1) * 60}ms` }}
                  >
                    {isHighlighted && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary mb-2 block">
                        Relevante para você
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{tip.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{tip.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* AI Suggestion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-elevated border border-border/50 max-h-[90vh] overflow-y-auto animate-fade-in-up">
            {/* Modal header */}
            <div className="sticky top-0 bg-card rounded-t-3xl sm:rounded-t-2xl px-5 pt-5 pb-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Sugestão de hoje</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {generating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Gerando sugestão personalizada...</p>
                </div>
              ) : suggestion ? (
                <>
                  {/* Context note */}
                  {suggestion.context_note && (
                    <div className="bg-primary/5 rounded-xl px-3.5 py-2.5 border border-primary/10">
                      <p className="text-xs text-primary font-medium">{suggestion.context_note}</p>
                    </div>
                  )}

                  {/* Meals */}
                  <div className="space-y-3">
                    {mealIcons.map(({ key, label, Icon }) => {
                      const value = (suggestion as any)[key];
                      if (!value) return null;
                      return (
                        <div key={key} className="bg-muted/50 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="w-3.5 h-3.5 text-primary" />
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                          </div>
                          <p className="text-sm leading-relaxed">{value}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Targets */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-medium mb-1">Calorias aprox.</p>
                      <p className="text-lg font-bold text-primary">{suggestion.calories_target || "—"}</p>
                    </div>
                    <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                      <p className="text-[10px] text-muted-foreground font-medium mb-1">Proteína aprox.</p>
                      <p className="text-lg font-bold text-primary">{suggestion.protein_target ? `${suggestion.protein_target}g` : "—"}</p>
                    </div>
                  </div>

                  {/* Tip */}
                  {suggestion.tip && (
                    <div className="bg-card rounded-xl px-4 py-3 border border-border/50">
                      <p className="text-xs font-semibold mb-1">💡 Dica do dia</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.tip}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 pb-6">
                    <button
                      onClick={generateSuggestion}
                      disabled={generating}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-background text-sm font-semibold hover:border-primary/30 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Outra sugestão
                    </button>
                    <button
                      onClick={saveSuggestion}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold shadow-sm"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      ) : (
                        <><Save className="w-4 h-4" /> Salvar</>
                      )}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Nutrition;
