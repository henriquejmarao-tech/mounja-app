import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { useApplicationData, type RecentSymptoms } from "@/hooks/useApplicationData";

interface FeaturedTip {
  id: string;
  emoji: string;
  title: string;
  reason: string; // max 120 chars
}

interface FeaturedForYouProps {
  context: "nutrition" | "movement";
}

// ─── Deterministic ranking (Mode A) ─────────────────────────────────
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

  // Always-relevant tips as fallback
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

  // Fallbacks
  tips.push({ id: "m-preserve", emoji: "💪", title: "Preserve seus músculos", reason: "Exercícios de força ajudam a manter massa muscular durante a perda de peso.", score: 5 });
  tips.push({ id: "m-routine", emoji: "📅", title: "Crie uma rotina", reason: "Dias fixos para treinar ajudam a criar o hábito com mais facilidade.", score: 4 });
  tips.push({ id: "m-progress", emoji: "📈", title: "Progressão gradual", reason: "Aumente duração ou intensidade aos poucos para resultados sustentáveis.", score: 3 });

  return tips.sort((a, b) => b.score - a.score).slice(0, 5);
}

const FeaturedForYou = ({ context }: FeaturedForYouProps) => {
  const { dose, recentSymptoms, weeklyWorkoutCount } = useApplicationData();

  const daysSinceInjection = useMemo(() => {
    if (!dose.lastApplicationAt) return null;
    return Math.floor((Date.now() - new Date(dose.lastApplicationAt).getTime()) / 86400000);
  }, [dose.lastApplicationAt]);

  const tips = useMemo(() => {
    if (context === "nutrition") {
      return rankNutritionTips(recentSymptoms, daysSinceInjection);
    }
    return rankMovementTips(recentSymptoms, daysSinceInjection, weeklyWorkoutCount);
  }, [context, recentSymptoms, daysSinceInjection, weeklyWorkoutCount]);

  const topTips = tips.slice(0, 3);

  if (topTips.length === 0) return null;

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
        </div>
        <h2 className="font-bold text-sm">Em destaque para você</h2>
      </div>
      <div className="space-y-2">
        {topTips.map((tip) => (
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
        ))}
      </div>
    </div>
  );
};

export default FeaturedForYou;
