import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Plus, Sparkles, Flame, Utensils, ChevronRight, X, Coffee, Sun, Moon, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import WorkoutSuggestion from "@/components/dashboard/WorkoutSuggestion";

const badges = [
  { id: "first", label: "Primeiro registro", emoji: "🌱", threshold: 1 },
  { id: "3days", label: "3 dias seguidos", emoji: "⚡", threshold: 3 },
  { id: "7days", label: "1 semana seguida", emoji: "🏅", threshold: 7 },
  { id: "14days", label: "2 semanas seguidas", emoji: "🌟", threshold: 14 },
  { id: "30days", label: "1 mês seguido", emoji: "🏆", threshold: 30 },
];

const streakMessages = [
  { min: 0, max: 0, message: "Comece a registrar hoje! 🌱" },
  { min: 1, max: 1, message: "Primeiro passo dado! ✨" },
  { min: 2, max: 2, message: "Dois dias seguidos! 💫" },
  { min: 3, max: 6, message: "Hábito se formando! ⚡" },
  { min: 7, max: 13, message: "Uma semana inteira! 🏅" },
  { min: 14, max: 29, message: "Consistência incrível! 🌟" },
  { min: 30, max: Infinity, message: "Inspiração pura! 🏆" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [lastInjection, setLastInjection] = useState<any>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [weeklyWorkoutGoal, setWeeklyWorkoutGoal] = useState(3);
  const [recentSymptoms, setRecentSymptoms] = useState<any>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [savedDiet, setSavedDiet] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<{ type: string; duration: number } | null>(null);
  const [restDayDismissed, setRestDayDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDietModal, setShowDietModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];

      const [injRes, logsRes, workoutsRes, dietRes, todayWorkoutRes] = await Promise.all([
        supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(1),
        supabase.from("daily_logs").select("date, weight, symptom_nausea, symptom_fatigue, symptom_headache, mood, energy").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
        supabase.from("workouts" as any).select("*").eq("user_id", user.id).gte("date", weekAgo),
        supabase.from("diet_suggestions" as any).select("breakfast, lunch, dinner, snack, calories_target, protein_target, tip, context_note").eq("user_id", user.id).eq("date", today).limit(1),
        supabase.from("workouts" as any).select("workout_type, duration_minutes").eq("user_id", user.id).eq("date", today).limit(1),
      ]);

      const inj = (injRes.data as any[]) || [];
      const logs = (logsRes.data as any[]) || [];
      const workouts = (workoutsRes.data as any[]) || [];
      const diet = (dietRes.data as any[]) || [];
      const todayW = (todayWorkoutRes.data as any[]) || [];

      setLastInjection(inj[0] || null);
      setTotalLogs(logs.length);
      setWeeklyWorkouts(workouts.length);
      if (diet[0]) setSavedDiet(diet[0]);
      if (todayW[0]) setTodayWorkout({ type: todayW[0].workout_type, duration: todayW[0].duration_minutes });

      const wLog = logs.find((l) => l.weight);
      setLatestWeight(wLog?.weight ?? null);

      // Recent symptoms (last 3 days)
      const recent3 = logs.slice(0, 3);
      if (recent3.length > 0) {
        const avgNausea = recent3.reduce((s: number, l: any) => s + (l.symptom_nausea || 0), 0) / recent3.length;
        const avgFatigue = recent3.reduce((s: number, l: any) => s + (l.symptom_fatigue || 0), 0) / recent3.length;
        setRecentSymptoms({ nausea: avgNausea, fatigue: avgFatigue });
      }

      // Streak
      let s = 0;
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      for (let i = 0; i < logs.length; i++) {
        const d = new Date(logs[i].date + "T12:00:00");
        d.setHours(0, 0, 0, 0);
        const expected = new Date(todayDate);
        expected.setDate(expected.getDate() - i);
        if (d.getTime() === expected.getTime()) s++;
        else break;
      }
      setStreak(s);

      // Generate insight
      if (logs.length >= 7) {
        const injDate = inj[0]?.date;
        if (injDate) {
          const postInjLogs = logs.filter((l: any) => {
            const ld = new Date(l.date + "T12:00:00");
            const id = new Date(injDate + "T12:00:00");
            const diff = Math.floor((ld.getTime() - id.getTime()) / 86400000);
            return diff >= 1 && diff <= 2;
          });
          if (postInjLogs.length > 0) {
            const avgFatigue = postInjLogs.reduce((s: number, l: any) => s + (l.symptom_fatigue || 0), 0) / postInjLogs.length;
            if (avgFatigue > 4) {
              setInsight("Nos dias após a aplicação, você costuma sentir mais cansaço. Pegue leve. 💤");
            }
          }
        }

        if (!insight) {
          const initialW = profile?.current_weight;
          const currentW = latestWeight ?? wLog?.weight;
          if (initialW && currentW && initialW - currentW > 0) {
            setInsight(`Você já perdeu ${(initialW - currentW).toFixed(1)} kg desde o início. Continue assim! 💪`);
          } else if (workouts.length >= 3) {
            setInsight(`${workouts.length} treinos esta semana! Seu corpo agradece. 🏋️`);
          }
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      const defaultGoal = profile.activity_level === "sedentary" ? 2 : profile.activity_level === "light" ? 3 : 4;
      setWeeklyWorkoutGoal(profile.weekly_workout_goal ?? profile.weekly_workouts ?? defaultGoal);
    }
  }, [profile]);

  const firstName = profile?.name?.split(" ")[0] || "Olá";
  const currentDose = profile?.current_dose || null;
  const daysUntilNext = lastInjection
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(lastInjection.date + "T12:00:00").getTime()) / 86400000))
    : null;

  const getStreakMessage = () => {
    const msg = streakMessages.find((m) => streak >= m.min && streak <= m.max);
    return msg?.message || streakMessages[0].message;
  };

  // Diet suggestion text
  const getDietSuggestion = () => {
    const isPostInjection = daysUntilNext !== null && (daysUntilNext >= 6 || daysUntilNext === 0);
    const hasHighNausea = recentSymptoms?.nausea > 3;
    if (isPostInjection) return "Dia pós-aplicação: prefira refeições leves e em porções menores.";
    if (hasHighNausea) return "Com náusea recente, tente alimentos frios e secos.";
    return "Priorize proteínas e vegetais hoje.";
  };

  const nextBadge = badges.find((b) => streak < b.threshold);
  const earnedBadges = badges.filter((b) => streak >= b.threshold);

  const handleRestDay = () => setRestDayDismissed(true);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-primary-foreground/80 font-medium">{firstName} 👋</p>
              <h1 className="text-lg font-bold text-primary-foreground mt-0.5">Sua jornada</h1>
            </div>
            <button
              onClick={() => navigate("/configuracoes")}
              className="w-9 h-9 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10"
            >
              <Settings className="w-4.5 h-4.5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-3 space-y-4 relative z-10">
        {/* Block 1: Dose + Next injection */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Dose atual</p>
              <p className="text-xl font-bold text-primary">{currentDose || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Próxima aplicação</p>
              <p className="text-xl font-bold">
                {daysUntilNext !== null ? (
                  daysUntilNext === 0 ? (
                    <span className="text-secondary">Hoje!</span>
                  ) : (
                    <>{daysUntilNext} <span className="text-sm font-medium text-muted-foreground">dias</span></>
                  )
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Peso atual</p>
              <p className="text-xl font-bold">
                {latestWeight ? (
                  <>{latestWeight} <span className="text-sm font-medium text-muted-foreground">kg</span></>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Treinos esta semana</p>
              <p className="text-xl font-bold">
                {weeklyWorkouts}<span className="text-sm font-medium text-muted-foreground">/{weeklyWorkoutGoal}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Block 2: Sugestão de hoje */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Sugestão de hoje</h3>
          </div>

          {/* Diet row */}
          {savedDiet ? (
            <button
              onClick={() => setShowDietModal(true)}
              className="w-full text-left space-y-2.5"
            >
              {savedDiet.context_note && (
                <p className="text-[10px] text-primary font-medium mb-1">{savedDiet.context_note}</p>
              )}
              <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl px-3 py-2.5 hover:bg-muted/70 transition-colors">
                <Utensils className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed line-clamp-2 flex-1">
                  {savedDiet.breakfast}{savedDiet.lunch ? ` · ${savedDiet.lunch}` : ""}
                </p>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
              </div>
            </button>
          ) : (
            <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl px-3 py-2.5 mb-2.5">
              <Utensils className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">{getDietSuggestion()}</p>
            </div>
          )}

          {/* Workout suggestion - structured */}
          <div className="mt-2.5">
            <WorkoutSuggestion
              weeklyWorkouts={weeklyWorkouts}
              weeklyWorkoutGoal={weeklyWorkoutGoal}
              recentSymptoms={recentSymptoms}
              daysUntilNext={daysUntilNext}
              todayWorkout={todayWorkout}
              onRestDay={handleRestDay}
              restDayDismissed={restDayDismissed}
            />
          </div>
        </div>

        {/* Block 3: Streak + badges */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              streak >= 7 ? "gradient-hero" : streak >= 3 ? "bg-warning/15" : "bg-muted"
            )}>
              <Flame className={cn(
                "w-5 h-5",
                streak >= 7 ? "text-primary-foreground" : streak >= 3 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold">
                {streak} <span className="text-xs font-medium text-muted-foreground">{streak === 1 ? "dia seguido" : "dias seguidos"}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">{getStreakMessage()}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className={cn("h-2 flex-1 rounded-full transition-all", i < Math.min(streak, 7) ? "gradient-hero" : "bg-muted")} />
            ))}
          </div>
          {earnedBadges.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {earnedBadges.map((badge) => (
                <span key={badge.id} className="text-[10px] font-semibold bg-primary/8 text-primary rounded-lg px-2 py-1 border border-primary/10">
                  {badge.emoji} {badge.label}
                </span>
              ))}
            </div>
          )}
          {nextBadge && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Mais {nextBadge.threshold - streak} dia{nextBadge.threshold - streak !== 1 ? "s" : ""} para: {nextBadge.emoji} {nextBadge.label}
            </p>
          )}
        </div>

        {/* Block 4: Insight */}
        {insight && (
          <div className="bg-card rounded-2xl px-4 py-3.5 shadow-card border border-border/50 animate-fade-in-up flex items-center gap-3" style={{ animationDelay: "180ms" }}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-foreground leading-relaxed">{insight}</p>
          </div>
        )}

        {/* Block 5: Register button */}
        <button
          onClick={() => navigate("/registrar")}
          className="w-full gradient-hero text-primary-foreground font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 animate-fade-in-up text-base"
          style={{ animationDelay: "240ms" }}
        >
          <Plus className="w-6 h-6" />
          Registrar hoje
        </button>
      </div>

      {/* Diet Detail Modal */}
      {showDietModal && savedDiet && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-elevated border border-border/50 max-h-[85vh] overflow-y-auto animate-fade-in-up">
            <div className="sticky top-0 bg-card rounded-t-3xl sm:rounded-t-2xl px-5 pt-5 pb-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Dieta de hoje</h2>
              </div>
              <button onClick={() => setShowDietModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {savedDiet.context_note && (
                <div className="bg-primary/5 rounded-xl px-3.5 py-2.5 border border-primary/10">
                  <p className="text-xs text-primary font-medium">{savedDiet.context_note}</p>
                </div>
              )}
              {[
                { key: "breakfast", label: "Café da manhã", Icon: Coffee },
                { key: "lunch", label: "Almoço", Icon: Sun },
                { key: "dinner", label: "Jantar", Icon: Moon },
                { key: "snack", label: "Lanche", Icon: Cookie },
              ].map(({ key, label, Icon }) => {
                const value = savedDiet[key];
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
              {(savedDiet.calories_target || savedDiet.protein_target) && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">Calorias aprox.</p>
                    <p className="text-lg font-bold text-primary">{savedDiet.calories_target || "—"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">Proteína aprox.</p>
                    <p className="text-lg font-bold text-primary">{savedDiet.protein_target ? `${savedDiet.protein_target}g` : "—"}</p>
                  </div>
                </div>
              )}
              {savedDiet.tip && (
                <div className="bg-card rounded-xl px-4 py-3 border border-border/50">
                  <p className="text-xs font-semibold mb-1">💡 Dica do dia</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{savedDiet.tip}</p>
                </div>
              )}
              <button
                onClick={() => { setShowDietModal(false); navigate("/nutricao"); }}
                className="w-full py-3 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold mt-2"
              >
                Ir para Nutrição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
