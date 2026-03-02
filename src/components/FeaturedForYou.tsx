import { useMemo, useState, useEffect, useCallback } from "react";
import { Sparkles, Wand2, Cpu } from "lucide-react";
import { useApplicationData, type RecentSymptoms } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface FeaturedTip {
  id: string;
  emoji: string;
  title: string;
  reason: string;
}

interface FeaturedForYouProps {
  context: "nutrition" | "movement";
}

// ─── Mode A: Deterministic ranking ──────────────────────────────────
function rankNutritionTips(symptoms: RecentSymptoms, daysSinceInjection: number | null): FeaturedTip[] {
  const tips: (FeaturedTip & { score: number })[] = [];

  if (symptoms.nausea >= 3) {
    tips.push({ id: "n-nausea", emoji: "🤢", title: "Refeições leves contra náusea", reason: "Sua náusea está alta — prefira alimentos frios, secos e em porções pequenas.", score: symptoms.nausea * 10 });
  }
  if (symptoms.constipation >= 3) {
    tips.push({ id: "n-constipation", emoji: "😣", title: "Fibras e hidratação", reason: "Constipação frequente — aumente fibras e beba mais água ao longo do dia.", score: symptoms.constipation * 9 });
  }
  if (symptoms.fatigue >= 3) {
    tips.push({ id: "n-fatigue", emoji: "😴", title: "Energia através da alimentação", reason: "Fadiga elevada — aposte em refeições leves e de fácil digestão.", score: symptoms.fatigue * 8 });
  }
  if (symptoms.headache >= 3) {
    tips.push({ id: "n-headache", emoji: "🤕", title: "Hidratação contra dor de cabeça", reason: "Dor de cabeça recorrente — mantenha hidratação regular e não pule refeições.", score: symptoms.headache * 7 });
  }
  if (daysSinceInjection !== null && daysSinceInjection <= 2) {
    tips.push({ id: "n-post-inj", emoji: "💉", title: "Pós-aplicação: coma leve", reason: "Está próximo da última aplicação — refeições menores ajudam a reduzir desconforto.", score: 25 });
  }

  tips.push({ id: "n-protein", emoji: "💪", title: "Priorize proteínas", reason: "Proteína ajuda a preservar músculo durante a perda de peso.", score: 5 });
  tips.push({ id: "n-hydration", emoji: "💧", title: "Beba mais água", reason: "Hidratação adequada reduz efeitos colaterais e melhora disposição.", score: 4 });
  tips.push({ id: "n-portions", emoji: "🍽️", title: "Porções menores, mais vezes", reason: "Refeições pequenas e frequentes mantêm energia estável ao longo do dia.", score: 3 });

  return tips.sort((a, b) => b.score - a.score).slice(0, 5);
}

function rankMovementTips(symptoms: RecentSymptoms, daysSinceInjection: number | null, weeklyWorkoutCount: number): FeaturedTip[] {
  const tips: (FeaturedTip & { score: number })[] = [];

  if (daysSinceInjection !== null && daysSinceInjection <= 2) {
    tips.push({ id: "m-post-inj", emoji: "💉", title: "Pegue leve hoje", reason: "Pós-aplicação recente — prefira caminhada leve ou alongamento.", score: 30 });
  }
  if (symptoms.fatigue >= 3) {
    tips.push({ id: "m-fatigue", emoji: "🔋", title: "Respeite o cansaço", reason: "Fadiga alta — um alongamento suave é suficiente hoje.", score: symptoms.fatigue * 9 });
  }
  if (symptoms.nausea >= 3) {
    tips.push({ id: "m-nausea", emoji: "🤢", title: "Atividade mais leve", reason: "Náusea elevada — evite exercícios intensos e prefira ar livre.", score: symptoms.nausea * 8 });
  }
  if (weeklyWorkoutCount === 0) {
    tips.push({ id: "m-start", emoji: "🚶", title: "Comece com 10 minutos", reason: "Nenhum treino esta semana — uma caminhada curta já faz diferença.", score: 20 });
  }
  if (weeklyWorkoutCount >= 3) {
    tips.push({ id: "m-variety", emoji: "🔄", title: "Varie os exercícios", reason: "Boa frequência! Misture tipos diferentes para trabalhar o corpo todo.", score: 15 });
  }

  tips.push({ id: "m-preserve", emoji: "💪", title: "Preserve seus músculos", reason: "Exercícios de força ajudam a manter massa muscular durante a perda de peso.", score: 5 });
  tips.push({ id: "m-routine", emoji: "📅", title: "Crie uma rotina", reason: "Dias fixos para treinar ajudam a criar o hábito com mais facilidade.", score: 4 });
  tips.push({ id: "m-progress", emoji: "📈", title: "Progressão gradual", reason: "Aumente duração ou intensidade aos poucos para resultados sustentáveis.", score: 3 });

  return tips.sort((a, b) => b.score - a.score).slice(0, 5);
}

const FeaturedForYou = ({ context }: FeaturedForYouProps) => {
  const { dose, recentSymptoms, weeklyWorkoutCount, latestWeight } = useApplicationData();
  const [mode, setMode] = useState<"A" | "B">("A");
  const [aiTips, setAiTips] = useState<FeaturedTip[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const daysSinceInjection = useMemo(() => {
    if (!dose.lastApplicationAt) return null;
    return Math.floor((Date.now() - new Date(dose.lastApplicationAt).getTime()) / 86400000);
  }, [dose.lastApplicationAt]);

  const deterministicTips = useMemo(() => {
    if (context === "nutrition") {
      return rankNutritionTips(recentSymptoms, daysSinceInjection);
    }
    return rankMovementTips(recentSymptoms, daysSinceInjection, weeklyWorkoutCount);
  }, [context, recentSymptoms, daysSinceInjection, weeklyWorkoutCount]);

  const fetchAiTips = useCallback(async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("featured-tips", {
        body: {
          context,
          userContext: {
            daysSinceInjection,
            nausea: recentSymptoms.nausea,
            fatigue: recentSymptoms.fatigue,
            headache: recentSymptoms.headache,
            constipation: recentSymptoms.constipation,
            diarrhea: recentSymptoms.diarrhea,
            weeklyWorkoutCount,
            weight: latestWeight,
            currentDose: dose.currentDose,
          },
        },
      });

      if (error) throw error;
      if (data?.tips && Array.isArray(data.tips)) {
        setAiTips(data.tips.slice(0, 3));
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error("AI tips error:", e);
      toast.error("Não foi possível gerar dicas com IA. Usando modo padrão.");
      setMode("A");
      setAiTips(null);
    } finally {
      setAiLoading(false);
    }
  }, [context, daysSinceInjection, recentSymptoms, weeklyWorkoutCount, latestWeight, dose.currentDose]);

  useEffect(() => {
    if (mode === "B" && !aiTips) {
      fetchAiTips();
    }
  }, [mode, aiTips, fetchAiTips]);

  // Reset AI tips when context changes
  useEffect(() => {
    setAiTips(null);
  }, [context]);

  const activeTips = mode === "B" && aiTips ? aiTips : deterministicTips.slice(0, 3);

  if (mode === "A" && activeTips.length === 0) return null;

  const toggleMode = () => {
    if (mode === "A") {
      setMode("B");
    } else {
      setMode("A");
      setAiTips(null);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <h2 className="font-bold text-sm">Em destaque para você</h2>
        </div>
        <div className="flex items-center gap-1 bg-muted/60 rounded-full p-0.5">
          <button
            onClick={() => { setMode("A"); setAiTips(null); }}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-200"
            style={{
              background: mode === "A" ? "hsl(var(--background))" : "transparent",
              color: mode === "A" ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: mode === "A" ? "0 1px 3px hsl(var(--foreground) / 0.1)" : "none",
            }}
          >
            <Cpu className="w-3 h-3" />
            Padrão
          </button>
          <button
            onClick={() => setMode("B")}
            className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-all duration-200"
            style={{
              background: mode === "B" ? "hsl(var(--primary))" : "transparent",
              color: mode === "B" ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: mode === "B" ? "0 1px 3px hsl(var(--primary) / 0.3)" : "none",
            }}
          >
            <Wand2 className="w-3 h-3" />
            IA
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {aiLoading && mode === "B" ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl px-4 py-3 border border-primary/10 shadow-sm flex items-start gap-3">
              <Skeleton className="w-6 h-6 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2.5 w-full" />
              </div>
            </div>
          ))
        ) : (
          activeTips.map((tip) => (
            <div
              key={tip.id}
              className="bg-card rounded-xl px-4 py-3 border border-primary/10 shadow-sm flex items-start gap-3"
            >
              <span className="text-xl shrink-0 mt-0.5">{tip.emoji}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold">{tip.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{tip.reason}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {mode === "B" && !aiLoading && (
        <p className="text-[10px] text-muted-foreground mt-2 text-center opacity-60">
          ✨ Personalizado com IA · baseado nos seus dados recentes
        </p>
      )}
    </div>
  );
};

export default FeaturedForYou;
