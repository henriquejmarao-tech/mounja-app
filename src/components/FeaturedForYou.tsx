import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Sparkles, Wand2, Cpu,
  // Nutrition icons
  Soup, Droplets, UtensilsCrossed, Syringe, Beef, GlassWater, Clock,
  // Movement icons
  Footprints, Battery, HeartPulse, Dumbbell, RefreshCw, Calendar, TrendingUp,
} from "lucide-react";
import { useApplicationData, type RecentSymptoms } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeaturedTip {
  id: string;
  icon: LucideIcon;
  title: string;
  reason: string;
}

// For AI tips that come as JSON (no icon component)
interface FeaturedTipRaw {
  id: string;
  emoji: string;
  title: string;
  reason: string;
}

interface FeaturedForYouProps {
  context: "nutrition" | "movement";
}

// Icon color palette per tip for visual variety
// Unified theme colors per section — darker tones with translucency for readability
const sectionTheme: Record<string, { bg: string; icon: string; border: string; iconBg: string }> = {
  nutrition: {
    bg: "bg-teal-600/10 dark:bg-teal-400/10",
    icon: "text-teal-700 dark:text-teal-300",
    border: "border-teal-600/20 dark:border-teal-400/20",
    iconBg: "bg-teal-600/15 dark:bg-teal-400/15",
  },
  movement: {
    bg: "bg-secondary/10 dark:bg-secondary/10",
    icon: "text-secondary dark:text-secondary",
    border: "border-secondary/20 dark:border-secondary/20",
    iconBg: "bg-secondary/15 dark:bg-secondary/15",
  },
};

// ─── Mode A: Deterministic ranking ──────────────────────────────────
function rankNutritionTips(symptoms: RecentSymptoms, daysSinceInjection: number | null): FeaturedTip[] {
  const tips: (FeaturedTip & { score: number })[] = [];

  if (symptoms.nausea >= 3) {
    tips.push({ id: "n-nausea", icon: Soup, title: "Refeição leve para pouco apetite", reason: "Náusea alta — tente algo frio e em porção pequena, como iogurte com frutas.", score: symptoms.nausea * 10 });
  }
  if (symptoms.constipation >= 3) {
    tips.push({ id: "n-constipation", icon: Droplets, title: "Refeição rica em fibras", reason: "Constipação frequente — inclua aveia, frutas com casca ou salada verde.", score: symptoms.constipation * 9 });
  }
  if (symptoms.fatigue >= 3) {
    tips.push({ id: "n-fatigue", icon: Battery, title: "Refeição fácil para dia cansado", reason: "Fadiga alta — opte por algo prático como ovo mexido com torrada integral.", score: symptoms.fatigue * 8 });
  }
  if (daysSinceInjection !== null && daysSinceInjection <= 2) {
    tips.push({ id: "n-post-inj", icon: Syringe, title: "Refeição leve pós-aplicação", reason: "Aplicação recente — porções menores e alimentos de fácil digestão.", score: 25 });
  }

  tips.push({ id: "n-protein", icon: Beef, title: "Refeição rica em proteína", reason: "Frango, ovo ou peixe ajudam a preservar músculo durante a perda de peso.", score: 5 });
  tips.push({ id: "n-hydration", icon: GlassWater, title: "Lanche rápido + hidratação", reason: "Um copo de água com lanche leve mantém energia e reduz efeitos colaterais.", score: 4 });
  tips.push({ id: "n-snack", icon: UtensilsCrossed, title: "Lanche rápido pós caminhada", reason: "Após atividade leve, reponha com iogurte, banana ou mix de castanhas.", score: 3 });

  return tips.sort((a, b) => b.score - a.score).slice(0, 5);
}

function rankMovementTips(symptoms: RecentSymptoms, daysSinceInjection: number | null, weeklyWorkoutCount: number): FeaturedTip[] {
  const tips: (FeaturedTip & { score: number })[] = [];

  if (daysSinceInjection !== null && daysSinceInjection <= 2) {
    tips.push({ id: "m-post-inj", icon: Syringe, title: "Pegue leve hoje", reason: "Pós-aplicação recente — prefira caminhada leve ou alongamento.", score: 30 });
  }
  if (symptoms.fatigue >= 3) {
    tips.push({ id: "m-fatigue", icon: Battery, title: "Respeite o cansaço", reason: "Fadiga alta — um alongamento suave é suficiente hoje.", score: symptoms.fatigue * 9 });
  }
  if (symptoms.nausea >= 3) {
    tips.push({ id: "m-nausea", icon: HeartPulse, title: "Atividade mais leve", reason: "Náusea elevada — evite exercícios intensos e prefira ar livre.", score: symptoms.nausea * 8 });
  }
  if (weeklyWorkoutCount === 0) {
    tips.push({ id: "m-start", icon: Footprints, title: "Comece com 10 minutos", reason: "Nenhum treino esta semana — uma caminhada curta já faz diferença.", score: 20 });
  }
  if (weeklyWorkoutCount >= 3) {
    tips.push({ id: "m-variety", icon: RefreshCw, title: "Varie os exercícios", reason: "Boa frequência! Misture tipos diferentes para trabalhar o corpo todo.", score: 15 });
  }

  tips.push({ id: "m-preserve", icon: Dumbbell, title: "Preserve seus músculos", reason: "Exercícios de força ajudam a manter massa muscular durante a perda de peso.", score: 5 });
  tips.push({ id: "m-routine", icon: Calendar, title: "Crie uma rotina", reason: "Dias fixos para treinar ajudam a criar o hábito com mais facilidade.", score: 4 });
  tips.push({ id: "m-progress", icon: TrendingUp, title: "Progressão gradual", reason: "Aumente duração ou intensidade aos poucos para resultados sustentáveis.", score: 3 });

  return tips.sort((a, b) => b.score - a.score).slice(0, 5);
}

// Map AI emoji responses to a fallback icon
const emojiToIcon: Record<string, LucideIcon> = {
  "🤢": Soup, "😣": Droplets, "😴": Battery, "🤕": GlassWater,
  "💉": Syringe, "💪": Beef, "💧": GlassWater, "🍽️": UtensilsCrossed,
  "🚶": Footprints, "🔋": Battery, "🎯": HeartPulse, "🔄": RefreshCw,
  "📅": Calendar, "📈": TrendingUp,
};

const FeaturedForYou = ({ context }: FeaturedForYouProps) => {
  const { dose, recentSymptoms, weeklyWorkoutCount, latestWeight } = useApplicationData();
  const [mode, setMode] = useState<"A" | "B">("A");
  const [aiTipsRaw, setAiTipsRaw] = useState<FeaturedTipRaw[] | null>(null);
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
        setAiTipsRaw(data.tips.slice(0, 3));
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (e) {
      console.error("AI tips error:", e);
      toast.error("Não foi possível gerar dicas com IA. Usando modo padrão.");
      setMode("A");
      setAiTipsRaw(null);
    } finally {
      setAiLoading(false);
    }
  }, [context, daysSinceInjection, recentSymptoms, weeklyWorkoutCount, latestWeight, dose.currentDose]);

  useEffect(() => {
    if (mode === "B" && !aiTipsRaw) {
      fetchAiTips();
    }
  }, [mode, aiTipsRaw, fetchAiTips]);

  useEffect(() => {
    setAiTipsRaw(null);
  }, [context]);

  // Convert AI raw tips to FeaturedTip with icons
  const aiTips: FeaturedTip[] | null = aiTipsRaw
    ? aiTipsRaw.map((t, i) => ({
        ...t,
        id: t.id || `ai-${i}`,
        icon: emojiToIcon[t.emoji] || Sparkles,
      }))
    : null;

  const activeTips = mode === "B" && aiTips ? aiTips : deterministicTips.slice(0, 3);

  if (mode === "A" && activeTips.length === 0) return null;

  const isNutrition = context === "nutrition";
  const gradientClass = isNutrition ? "gradient-nutrition" : "gradient-hero";
  const activeColor = isNutrition ? "hsl(174, 42%, 48%)" : "hsl(var(--secondary))";
  const activeFg = "hsl(0, 0%, 100%)";

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg ${gradientClass} flex items-center justify-center`}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="font-bold text-sm">Em destaque para você</h2>
        </div>
        <div className="flex items-center gap-1 bg-muted/60 rounded-full p-0.5">
          <button
            onClick={() => { setMode("A"); setAiTipsRaw(null); }}
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
              background: mode === "B" ? activeColor : "transparent",
              color: mode === "B" ? activeFg : "hsl(var(--muted-foreground))",
              boxShadow: mode === "B" ? `0 1px 3px ${activeColor}50` : "none",
            }}
          >
            <Wand2 className="w-3 h-3" />
            IA
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        {aiLoading && mode === "B" ? (
          Array.from({ length: 3 }).map((_, i) => {
            const theme = sectionTheme[context] || sectionTheme.nutrition;
            return (
              <div key={i} className={cn("rounded-xl px-4 py-3.5 border shadow-sm flex items-start gap-3", theme.bg, theme.border)}>
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            );
          })
        ) : (
          activeTips.map((tip) => {
            const theme = sectionTheme[context] || sectionTheme.nutrition;
            const Icon = tip.icon;
            return (
              <div
                key={tip.id}
                className={cn(
                  "rounded-xl px-4 py-3.5 border shadow-sm flex items-start gap-3 transition-all duration-200",
                  theme.bg,
                  theme.border,
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  theme.icon,
                  theme.iconBg,
                )}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold">{tip.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{tip.reason}</p>
                </div>
              </div>
            );
          })
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
