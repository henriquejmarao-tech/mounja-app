import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Dumbbell, Footprints, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TipCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  levels: string[]; // activity levels this applies to
}

const allTips: TipCard[] = [
  {
    id: "start-slow",
    emoji: "🚶",
    title: "Comece devagar",
    description: "Uma caminhada de 10-15 minutos por dia já faz diferença. O mais importante agora é criar o hábito — a intensidade vem depois.",
    levels: ["sedentary"],
  },
  {
    id: "routine",
    emoji: "📅",
    title: "Crie uma rotina simples",
    description: "Escolha 2-3 dias fixos na semana para se exercitar. Pode ser algo leve como caminhar no bairro, dançar em casa ou fazer alongamento.",
    levels: ["sedentary", "light"],
  },
  {
    id: "preserve-muscle",
    emoji: "💪",
    title: "Preserve seus músculos",
    description: "Durante a perda de peso, é natural perder um pouco de músculo. Exercícios de força (mesmo leves, como agachamento e flexão de parede) ajudam a minimizar isso.",
    levels: ["sedentary", "light", "moderate", "active"],
  },
  {
    id: "frequency",
    emoji: "🎯",
    title: "Frequência ideal",
    description: "Tente fazer pelo menos 150 minutos de atividade moderada por semana (cerca de 30 min, 5x). Mas qualquer quantidade já é melhor que nenhuma.",
    levels: ["light", "moderate"],
  },
  {
    id: "low-energy",
    emoji: "🔋",
    title: "Dias de baixa energia",
    description: "É normal sentir menos disposição em alguns dias, especialmente após a aplicação. Nesses dias, opte por alongamento ou uma caminhada leve. Respeite seu corpo.",
    levels: ["sedentary", "light", "moderate", "active"],
  },
  {
    id: "progress",
    emoji: "📈",
    title: "Aumente aos poucos",
    description: "Você já tem uma boa base! Tente adicionar um dia a mais de treino ou aumentar levemente a intensidade. Progressão gradual é a chave.",
    levels: ["moderate", "active"],
  },
  {
    id: "variety",
    emoji: "🔄",
    title: "Varie os exercícios",
    description: "Misture caminhada, musculação e alongamento durante a semana. Isso trabalha o corpo de formas diferentes e evita monotonia.",
    levels: ["moderate", "active"],
  },
  {
    id: "post-injection",
    emoji: "💉",
    title: "Treino e dia de aplicação",
    description: "Nos 1-2 dias após a aplicação, você pode sentir mais cansaço ou desconforto. Está tudo bem diminuir o ritmo. Prefira atividades leves nesses dias.",
    levels: ["sedentary", "light", "moderate", "active"],
  },
];

const levelLabels: Record<string, string> = {
  sedentary: "Iniciante",
  light: "Pouco ativo",
  moderate: "Moderado",
  active: "Ativo",
};

const frequencySuggestion: Record<string, string> = {
  sedentary: "2-3x por semana, 10-15 min",
  light: "3-4x por semana, 20-30 min",
  moderate: "4-5x por semana, 30-45 min",
  active: "5-6x por semana, 45-60 min",
};

const Workouts = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const activityLevel = profile?.activity_level || "sedentary";
  const weeklyGoal = profile?.weekly_workouts || (activityLevel === "sedentary" ? 2 : activityLevel === "light" ? 3 : 4);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const { data } = await supabase
        .from("daily_logs")
        .select("workout_type")
        .eq("user_id", user.id)
        .gte("date", weekAgo)
        .not("workout_type", "is", null);
      setWeeklyCount((data as any[])?.length || 0);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const relevantTips = allTips.filter((t) => t.levels.includes(activityLevel));
  const progress = Math.min(100, (weeklyCount / weeklyGoal) * 100);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Treino</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Dicas para manter o corpo ativo</p>
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
            {/* User level + frequency */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Seu perfil</h3>
                </div>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                  {levelLabels[activityLevel] || "Iniciante"}
                </span>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Frequência sugerida</p>
                <p className="text-sm font-bold">{frequencySuggestion[activityLevel] || frequencySuggestion.sedentary}</p>
              </div>
            </div>

            {/* Weekly progress */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Esta semana</h3>
                </div>
                <span className="text-xs font-bold text-primary">{weeklyCount}/{weeklyGoal}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                <div className="gradient-hero h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {weeklyCount >= weeklyGoal
                  ? "Meta atingida! Parabéns! 🎉"
                  : weeklyCount > 0
                  ? `Falta${weeklyGoal - weeklyCount === 1 ? "" : "m"} ${weeklyGoal - weeklyCount} treino${weeklyGoal - weeklyCount === 1 ? "" : "s"} para a meta!`
                  : "Registre seus treinos para acompanhar o progresso."}
              </p>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Dicas educativas gerais. Consulte um profissional antes de iniciar atividades intensas.
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              {relevantTips.map((tip, i) => (
                <div
                  key={tip.id}
                  className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up"
                  style={{ animationDelay: `${(i + 2) * 60}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{tip.emoji}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{tip.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Workouts;
