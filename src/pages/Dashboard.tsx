import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { useTutorial } from "@/hooks/useTutorial";
import { Settings, Plus, Sparkles, Flame, Utensils, ChevronRight, X, Coffee, Sun, Moon, Cookie, ClipboardCheck, ArrowRight, Salad, Dumbbell, Timer, Zap, Target, User, Pill, HeartPulse, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import WorkoutSuggestion, { getWorkoutSuggestion } from "@/components/dashboard/WorkoutSuggestion";
import StatusHeroCard from "@/components/dashboard/StatusHeroCard";
import NextInjectionCard from "@/components/dashboard/NextInjectionCard";

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
  const { dose, getLastConfirmedApplication, recentSymptoms: ssotSymptoms, weeklyWorkoutCount, latestWeight: ssotWeight, loading: ssotLoading } = useApplicationData();
  const { triggerPostTriageTutorial } = useTutorial();

  // Trigger tutorial immediately after first triage
  useEffect(() => {
    if (profile?.triage_completed) {
      triggerPostTriageTutorial();
    }
  }, [profile?.triage_completed, triggerPostTriageTutorial]);
  const [lastInjection, setLastInjection] = useState<any>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(0);
  const [weeklyWorkoutGoal, setWeeklyWorkoutGoal] = useState(3);
  const [recentSymptoms, setRecentSymptoms] = useState<any>(null);
  const [insight, setInsight] = useState<string | null>(null);
  const [savedDiet, setSavedDiet] = useState<any>(null); // kept for data fetch compatibility
  const [todayWorkout, setTodayWorkout] = useState<{ type: string; duration: number } | null>(null);
  const [restDayDismissed, setRestDayDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDietModal, setShowDietModal] = useState(false); // unused now but kept to avoid breaking refs
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);

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
      const todayStr = new Date().toISOString().split("T")[0];
      setTodayCheckedIn(logs.some((l: any) => l.date === todayStr));
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
  // SSOT: dose comes exclusively from ApplicationDataLayer
  const currentDose = dose.currentDose;
  if (import.meta.env.DEV) {
    console.log(`[Hub] reading from SSOT: currentDose = ${currentDose}`);
    console.log(`[Hub] currentDose loaded = ${currentDose}`);
  }
  // SSOT: daysUntilNext from canonical nextApplicationAt
  const daysUntilNext = dose.nextApplicationAt
    ? Math.max(0, Math.ceil((new Date(dose.nextApplicationAt).getTime() - Date.now()) / 86400000))
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
    <div className="min-h-screen pb-28" style={{ background: "#F6F8F7" }}>
      {/* Sticky Header */}
      <header
        className="sticky top-0 z-30"
      >
        <div
          className="px-5 pb-16"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
            background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 30%, hsl(var(--primary) / 0.20) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/perfil")}
              className="w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-md flex items-center justify-center text-primary-foreground font-bold text-sm"
            >
              {((profile as any)?.username?.[0] || profile?.name?.[0] || "U").toUpperCase()}
            </button>
            <div className="text-center">
              <p className="text-sm text-primary-foreground/85 font-medium">{firstName}, bom te ver 🌿</p>
            </div>
            <button
              onClick={() => navigate("/configuracoes")}
              className="w-10 h-10 rounded-full bg-primary-foreground/20 backdrop-blur-md flex items-center justify-center"
            >
              <Settings className="w-5 h-5 text-primary-foreground/90" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-10 relative z-20">
        {/* Status Hero Card — always first */}
        <StatusHeroCard
          streak={streak}
          currentDose={currentDose}
          latestWeight={latestWeight}
        />

        <div className="mt-3.5 space-y-4">

        {/* Next Injection Card */}
        <NextInjectionCard daysUntilNext={daysUntilNext} currentDose={currentDose} />

        {/* Check-in CTA */}
        {!todayCheckedIn && (
          <button
            onClick={() => navigate("/registrar")}
            className="w-full rounded-[20px] p-4 animate-fade-in-up flex items-center gap-3.5 text-left active:scale-[0.98] transition-all duration-200 group"
            style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
          >
            <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary) / 0.12)" }}>
              <ClipboardCheck className="w-[18px] h-[18px] text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground/85">Como você está hoje?</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Registre sintomas, peso e humor — leva 1 min ✨</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Onboarding completion card */}
        {(!(profile as any)?.dose_history_completed || !(profile as any)?.health_info_completed || !(profile as any)?.routine_completed) && (
          <div className="rounded-[20px] p-4 animate-fade-in-up" style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-[18px] h-[18px] text-urgent" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>Completar perfil</h3>
            </div>
            <p className="text-xs text-muted-foreground/60 mb-3.5">Preencha uma única vez para recomendações personalizadas ✨</p>

            <div className="space-y-2.5">
              {!(profile as any)?.dose_history_completed && (
                <button onClick={() => navigate("/historico-dose")} className="w-full text-left group">
                  <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5 group-active:scale-[0.98] transition-all duration-200" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
                    <div className="w-8 h-8 rounded-[12px] bg-urgent/10 flex items-center justify-center shrink-0">
                      <Pill className="w-[18px] h-[18px] text-urgent" />
                    </div>
                    <p className="text-sm text-foreground/80 flex-1">Histórico de tratamento</p>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              )}

              {!(profile as any)?.health_info_completed && (
                <button onClick={() => navigate("/saude")} className="w-full text-left group">
                  <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5 group-active:scale-[0.98] transition-all duration-200" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
                    <div className="w-8 h-8 rounded-[12px] bg-urgent/10 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-[18px] h-[18px] text-urgent" />
                    </div>
                    <p className="text-sm text-foreground/80 flex-1">Saúde e restrições</p>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              )}

              {!(profile as any)?.routine_completed && (
                <button onClick={() => navigate("/rotina")} className="w-full text-left group">
                  <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5 group-active:scale-[0.98] transition-all duration-200" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
                    <div className="w-8 h-8 rounded-[12px] bg-urgent/10 flex items-center justify-center shrink-0">
                      <CalendarClock className="w-[18px] h-[18px] text-urgent" />
                    </div>
                    <p className="text-sm text-foreground/80 flex-1">Rotina e preferências</p>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Block 2a: Alimentação */}
        <div data-tutorial="suggestion-card" className="rounded-[20px] p-4 animate-fade-in-up" style={{ animationDelay: "60ms", background: "#F7F8F7", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-7 h-7 rounded-[10px] flex items-center justify-center" style={{ background: "hsl(174 42% 48% / 0.07)" }}>
              <Utensils className="w-[18px] h-[18px]" style={{ color: "hsl(174 42% 48% / 0.7)" }} />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>Está com fome?</h3>
          </div>

          <button onClick={() => navigate("/nutricao")} className="w-full text-left group">
            <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5 group-active:scale-[0.98] transition-all duration-200" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
              <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "hsl(174 42% 48% / 0.1)" }}>
                <Utensils className="w-5 h-5" style={{ color: "hsl(174 42% 48%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/80">Ver sugestão de refeição</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Block 2b: Treino */}
        <div className="rounded-[20px] p-4 animate-fade-in-up" style={{ animationDelay: "90ms", background: "#F7F8F7", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-7 h-7 rounded-[10px] flex items-center justify-center" style={{ background: "hsl(25 80% 52% / 0.07)" }}>
              <Flame className="w-[18px] h-[18px]" style={{ color: "hsl(25 80% 52% / 0.7)" }} />
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>Treino recomendado</h3>
          </div>

          <WorkoutSuggestion
            weeklyWorkouts={weeklyWorkouts}
            weeklyWorkoutGoal={weeklyWorkoutGoal}
            recentSymptoms={recentSymptoms}
            daysUntilNext={daysUntilNext}
            todayWorkout={todayWorkout}
            restDayDismissed={restDayDismissed}
            onOpen={() => setShowWorkoutModal(true)}
          />
        </div>


        {/* Block 4: Insight */}
        {insight && (
          <div className="rounded-[20px] p-4 animate-fade-in-up flex items-center gap-3" style={{ animationDelay: "240ms", background: "#F7F8F7", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
            <div className="w-8 h-8 rounded-[12px] bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-[18px] h-[18px] text-primary" />
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed">{insight}</p>
          </div>
        )}

        </div>{/* end inner space-y-4 */}

      </div>



      {/* Workout Detail Modal - fullscreen on mobile */}
      {showWorkoutModal && (() => {
        const suggestion = getWorkoutSuggestion(weeklyWorkouts, weeklyWorkoutGoal, recentSymptoms, daysUntilNext);
        return (
          <div className="fixed inset-0 z-[60] bg-card flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
            {/* Header */}
            <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <h2 className="font-bold text-base">Treino de hoje</h2>
              </div>
              <button onClick={() => setShowWorkoutModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {suggestion.reason && (
                <div className="bg-primary/5 rounded-xl px-3.5 py-2.5 border border-primary/10">
                  <p className="text-xs text-primary font-medium">{suggestion.reason}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground font-medium">Intensidade</p>
                  </div>
                  <p className={cn("text-lg font-bold", suggestion.config.colorClass)}>{suggestion.config.label}</p>
                </div>
                <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Timer className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground font-medium">Duração</p>
                  </div>
                  <p className="text-lg font-bold text-primary">{suggestion.duration} min</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground font-medium">Meta semanal</p>
                </div>
                <p className="text-lg font-bold text-primary">{weeklyWorkouts}<span className="text-sm font-medium text-muted-foreground">/{weeklyWorkoutGoal}</span></p>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">Sugestões de exercício</p>
                {suggestion.examples.map((ex, i) => (
                  <div key={i} className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed">{ex}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed footer */}
            <div className="shrink-0 px-5 pt-3 border-t border-border/50 bg-card" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowWorkoutModal(false); navigate("/registrar?tab=workout"); }}
                  className="flex-1 py-3.5 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                >
                  <Dumbbell className="w-4 h-4" />
                  Registrar treino
                </button>
                <button
                  onClick={() => { setShowWorkoutModal(false); handleRestDay(); }}
                  className="px-5 py-3.5 rounded-xl bg-muted text-sm text-muted-foreground font-medium active:scale-[0.97] transition-all"
                >
                  Descanso
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
