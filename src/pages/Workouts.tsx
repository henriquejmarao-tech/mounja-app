import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Dumbbell, Footprints, Sparkles, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TipCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  levels: string[];
}

const allTips: TipCard[] = [
  { id: "start-slow", emoji: "🚶", title: "Comece devagar", description: "Uma caminhada de 10-15 minutos por dia já faz diferença. O mais importante agora é criar o hábito — a intensidade vem depois.", levels: ["sedentary"] },
  { id: "routine", emoji: "📅", title: "Crie uma rotina simples", description: "Escolha 2-3 dias fixos na semana para se exercitar. Pode ser algo leve como caminhar no bairro, dançar em casa ou fazer alongamento.", levels: ["sedentary", "light"] },
  { id: "preserve-muscle", emoji: "💪", title: "Preserve seus músculos", description: "Durante a perda de peso, é natural perder um pouco de músculo. Exercícios de força (mesmo leves, como agachamento e flexão de parede) ajudam a minimizar isso.", levels: ["sedentary", "light", "moderate", "active"] },
  { id: "frequency", emoji: "🎯", title: "Frequência ideal", description: "Tente fazer pelo menos 150 minutos de atividade moderada por semana (cerca de 30 min, 5x). Mas qualquer quantidade já é melhor que nenhuma.", levels: ["light", "moderate"] },
  { id: "low-energy", emoji: "🔋", title: "Dias de baixa energia", description: "É normal sentir menos disposição em alguns dias, especialmente após a aplicação. Nesses dias, opte por alongamento ou uma caminhada leve. Respeite seu corpo.", levels: ["sedentary", "light", "moderate", "active"] },
  { id: "progress", emoji: "📈", title: "Aumente aos poucos", description: "Você já tem uma boa base! Tente adicionar um dia a mais de treino ou aumentar levemente a intensidade. Progressão gradual é a chave.", levels: ["moderate", "active"] },
  { id: "variety", emoji: "🔄", title: "Varie os exercícios", description: "Misture caminhada, musculação e alongamento durante a semana. Isso trabalha o corpo de formas diferentes e evita monotonia.", levels: ["moderate", "active"] },
  { id: "post-injection", emoji: "💉", title: "Treino e dia de aplicação", description: "Nos 1-2 dias após a aplicação, você pode sentir mais cansaço ou desconforto. Está tudo bem diminuir o ritmo. Prefira atividades leves nesses dias.", levels: ["sedentary", "light", "moderate", "active"] },
];

const levelLabels: Record<string, string> = {
  sedentary: "Iniciante", light: "Pouco ativo", moderate: "Moderado", active: "Ativo",
};

const frequencySuggestion: Record<string, string> = {
  sedentary: "2-3x por semana, 10-15 min", light: "3-4x por semana, 20-30 min",
  moderate: "4-5x por semana, 30-45 min", active: "5-6x por semana, 45-60 min",
};

const Workouts = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);

  const activityLevel = profile?.activity_level || "sedentary";
  const defaultGoal = activityLevel === "sedentary" ? 2 : activityLevel === "light" ? 3 : 4;
  const [weeklyGoal, setWeeklyGoal] = useState(profile?.weekly_workout_goal ?? profile?.weekly_workouts ?? defaultGoal);

  useEffect(() => {
    if (profile) {
      setWeeklyGoal(profile.weekly_workout_goal ?? profile.weekly_workouts ?? defaultGoal);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchData = async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      
      // Fetch from workouts table
      const { data: workouts } = await supabase
        .from("workouts" as any)
        .select("*")
        .eq("user_id", user.id)
        .gte("date", weekAgo)
        .order("date", { ascending: false });

      const wk = (workouts as any[]) || [];
      setWeeklyCount(wk.length);
      setRecentWorkouts(wk.slice(0, 5));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleGoalChange = async (delta: number) => {
    const newGoal = Math.max(1, Math.min(7, weeklyGoal + delta));
    setWeeklyGoal(newGoal);
    if (!user) return;
    setSavingGoal(true);
    const { error } = await supabase.from("profiles").update({ weekly_workout_goal: newGoal } as any).eq("id", user.id);
    if (error) toast.error("Erro ao salvar meta.");
    setSavingGoal(false);
  };

  const relevantTips = allTips.filter((t) => t.levels.includes(activityLevel));
  const progress = Math.min(100, (weeklyCount / weeklyGoal) * 100);

  const intensityLabel: Record<string, string> = { light: "Leve", moderate: "Moderado", intense: "Intenso" };

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
          <p className="text-sm text-primary-foreground/70 mt-1">Registre e acompanhe sua atividade física</p>
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
            {/* Register workout button */}
            <button
              onClick={() => navigate("/register?tab=workout")}
              className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated animate-fade-in-up"
            >
              <Dumbbell className="w-5 h-5" />
              Registrar treino
            </button>

            {/* Weekly goal + progress */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Meta semanal</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleGoalChange(-1)} disabled={savingGoal || weeklyGoal <= 1}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-primary min-w-[3ch] text-center">{weeklyGoal}x</span>
                  <button onClick={() => handleGoalChange(1)} disabled={savingGoal || weeklyGoal >= 7}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="gradient-hero h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-primary">{weeklyCount}/{weeklyGoal}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {weeklyCount >= weeklyGoal
                  ? "Meta atingida! Parabéns! 🎉"
                  : weeklyCount > 0
                  ? `Falta${weeklyGoal - weeklyCount === 1 ? "" : "m"} ${weeklyGoal - weeklyCount} treino${weeklyGoal - weeklyCount === 1 ? "" : "s"} para a meta!`
                  : "Registre seus treinos para acompanhar o progresso."}
              </p>
            </div>

            {/* Recent workouts */}
            {recentWorkouts.length > 0 && (
              <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                <h3 className="font-semibold text-sm mb-3">Treinos recentes</h3>
                <div className="space-y-2.5">
                  {recentWorkouts.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-xs font-semibold">{w.workout_type}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(w.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {w.duration_minutes}min · {intensityLabel[w.intensity] || w.intensity}</p>
                      </div>
                      {w.feeling_after && (
                        <span className="text-lg">{["", "😞", "😐", "🙂", "😊"][w.feeling_after]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User level */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
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
                <div key={tip.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: `${(i + 4) * 60}ms` }}>
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
