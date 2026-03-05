import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { useTutorial } from "@/hooks/useTutorial";
import { Settings, Sparkles, Flame, Utensils, ChevronDown, ChevronRight, ClipboardCheck, ArrowRight, Dumbbell, Target, Pill, HeartPulse, CalendarClock, CheckCircle2 } from "lucide-react";
import { cn, localDateStr } from "@/lib/utils";
import { getWorkoutSuggestion } from "@/components/dashboard/WorkoutSuggestion";
import StatusHeroCard from "@/components/dashboard/StatusHeroCard";
import NextInjectionCard from "@/components/dashboard/NextInjectionCard";
import DailyHabitsCard from "@/components/dashboard/DailyHabitsCard";
import SymptomInsightsCard from "@/components/dashboard/SymptomInsightsCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { dose, recentSymptoms: ssotSymptoms, weeklyWorkoutCount, latestWeight: ssotWeight, loading: ssotLoading } = useApplicationData();
  const { triggerPostTriageTutorial } = useTutorial();

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
  const [savedDiet, setSavedDiet] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<{ type: string; duration: number } | null>(null);
  const [restDayDismissed, setRestDayDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(true);
  const [showFoodCard, setShowFoodCard] = useState(true);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  // Track if profile was just completed for one-time message
  const [profileJustCompleted, setProfileJustCompleted] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const weekAgo = localDateStr(new Date(Date.now() - 7 * 86400000));
      const today = localDateStr();

      const [injRes, logsRes, workoutsRes, dietRes, todayWorkoutRes] = await Promise.all([
        supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(1),
        supabase.from("daily_logs").select("date, weight, symptom_nausea, symptom_fatigue, symptom_headache, mood, energy, water_ml, food_quality").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
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
      const todayStr = localDateStr();
      const todayLogEntry = logs.find((l: any) => l.date === todayStr);
      setTodayCheckedIn(!!todayLogEntry);
      setTodayLog(todayLogEntry || null);
      setAllLogs(logs);
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
  const currentDose = dose.currentDose;

  const daysUntilNext = dose.nextApplicationAt
    ? Math.max(0, Math.ceil((new Date(dose.nextApplicationAt).getTime() - Date.now()) / 86400000))
    : null;

  // ─── Daily Treatment Score ───────────────────────────────────────
  const { dailyScore, scoreFactors } = useMemo(() => {
    // First day: no logs yet → welcome score of 80
    if (totalLogs === 0) {
      return {
        dailyScore: 80,
        scoreFactors: [
          { label: "Bem-vindo ao tratamento! 🎉", status: "good" as const },
          { label: "Faça seu primeiro check-in", status: "warning" as const },
        ],
      };
    }

    let score = 0;
    const factors: { label: string; status: "good" | "warning" }[] = [];

    // 1. Check-in hoje (20 pts) — presença, sem streak
    if (todayLog) {
      score += 20;
      factors.push({ label: "Check-in registrado ✓", status: "good" });
    } else {
      factors.push({ label: "Faça seu check-in de hoje", status: "warning" });
    }

    // 2. Food quality (25 pts) — proportional scale
    if (todayLog?.food_quality) {
      const foodMap: Record<string, number> = { great: 25, good: 20, regular: 12, ok: 12, bad: 5, poor: 5 };
      const pts = foodMap[todayLog.food_quality] ?? 10;
      score += pts;
      factors.push({
        label: pts >= 20 ? "Alimentação excelente" : pts >= 12 ? "Alimentação razoável" : "Alimentação precisa melhorar",
        status: pts >= 12 ? "good" : "warning",
      });
    } else {
      factors.push({ label: "Registre sua alimentação", status: "warning" });
    }

    // 3. Hydration (25 pts) — proportional to daily target
    if (todayLog?.water_ml) {
      const target = (profile as any)?.daily_water_ml || 2000;
      const ratio = Math.min(todayLog.water_ml / target, 1);
      const pts = Math.round(ratio * 25);
      score += pts;
      factors.push({
        label: ratio >= 0.8 ? "Hidratação ótima 💧" : ratio >= 0.5 ? "Hidratação parcial" : "Beba mais água",
        status: ratio >= 0.5 ? "good" : "warning",
      });
    } else {
      factors.push({ label: "Registre sua água", status: "warning" });
    }

    // 4. Weight day-over-day (30 pts) — sensitive to small daily changes
    // Find today's weight and previous day's weight from logs
    const todayWeight = todayLog?.weight;
    const previousLog = allLogs.find((l: any) => l.date !== todayLog?.date && l.weight);
    const prevWeight = previousLog?.weight;

    if (todayWeight && prevWeight) {
      const diff = prevWeight - todayWeight; // positive = lost weight
      if (diff > 0) {
        // Any loss is great; scale: 0.1kg → 20pts, 0.3kg+ → 30pts
        const pts = Math.min(Math.round((diff / 0.3) * 30), 30);
        score += pts;
        factors.push({ label: `−${diff.toFixed(1)} kg vs anterior 🎯`, status: "good" });
      } else if (Math.abs(diff) <= 0.2) {
        // Stable (within ±0.2kg) — good
        score += 22;
        factors.push({ label: "Peso estável ✓", status: "good" });
      } else {
        // Gained > 0.2kg
        const penalty = Math.min(Math.abs(diff) / 0.5, 1);
        const pts = Math.round(10 * (1 - penalty));
        score += pts;
        factors.push({ label: `+${Math.abs(diff).toFixed(1)} kg vs anterior`, status: "warning" });
      }
    } else if (todayWeight) {
      score += 15;
      factors.push({ label: "Peso registrado, sem comparação", status: "good" });
    } else {
      factors.push({ label: "Registre seu peso", status: "warning" });
    }

    return { dailyScore: Math.min(score, 100), scoreFactors: factors };
  }, [totalLogs, todayLog, profile, latestWeight, allLogs]);

  // Check if onboarding is complete
  const isProfileComplete = !!(profile as any)?.dose_history_completed && !!(profile as any)?.health_info_completed && !!(profile as any)?.routine_completed;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 pointer-events-none">
        <div
          className="px-5 pb-16"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
            background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 30%, hsl(var(--primary) / 0.20) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-between pointer-events-auto">
            {/* Avatar + Streak badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/perfil")}
                className="w-11 h-11 rounded-full flex items-center justify-center text-primary font-bold text-sm shadow-lg"
                style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
              >
                {((profile as any)?.username?.[0] || profile?.name?.[0] || "U").toUpperCase()}
              </button>
              {streak > 0 && (
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm"
                  style={{ background: "rgba(255,255,255,0.88)", color: "hsl(25 80% 45%)" }}
                >
                  <span>🔥</span>
                  <span>{streak}</span>
                </div>
              )}
            </div>
            <div className="text-center flex-1" />
            <button
              onClick={() => navigate("/configuracoes")}
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
            >
              <Settings className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-10 relative z-20">
        {/* Status Hero Card — Daily Treatment Score */}
        <StatusHeroCard
          dailyScore={dailyScore}
          scoreFactors={scoreFactors}
          currentDose={currentDose}
          latestWeight={latestWeight}
        />

        <div className="mt-3.5 space-y-4">

        {/* Next Injection Card */}
        <NextInjectionCard daysUntilNext={daysUntilNext} currentDose={currentDose} />

        {/* Suas Aplicações card */}
        <button
          onClick={() => navigate("/aplicacao")}
          className="w-full rounded-[20px] p-4 animate-fade-in-up flex items-center gap-3.5 text-left active:scale-[0.98] transition-all duration-200 group"
          style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-card)", animationDelay: "45ms" }}
        >
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary) / 0.08)" }}>
            <Pill className="w-[18px] h-[18px]" style={{ color: "hsl(var(--secondary) / 0.7)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground/85">Suas aplicações</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Histórico, rodízio e dicas de aplicação</p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Sintomas — unified card (register + AI insights) */}
        <SymptomInsightsCard />

        {/* Check-in CTA */}
        {!todayCheckedIn && (
          <button
            onClick={() => navigate("/registrar")}
            className="w-full rounded-[20px] p-4 animate-fade-in-up flex items-center gap-3.5 text-left active:scale-[0.98] transition-all duration-200 group"
            style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-card)" }}
          >
            <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "hsl(var(--secondary) / 0.12)" }}>
              <ClipboardCheck className="w-[18px] h-[18px] text-secondary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground/85">Como foi seu dia ontem?</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Registre sintomas, peso, água e alimentação — leva 1 min ✨</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Onboarding completion card — only if NOT complete */}
        {!isProfileComplete && (
          <div className="rounded-[20px] p-4 animate-fade-in-up" style={{ background: "hsl(var(--card))", boxShadow: "var(--shadow-card)" }}>
            <button onClick={() => setShowProfileCard(!showProfileCard)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-[18px] h-[18px] text-urgent" />
                <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>Completar perfil</h3>
              </div>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", showProfileCard && "rotate-180")} />
            </button>

            {showProfileCard && (
              <div className="mt-3 animate-fade-in-up">
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
          </div>
        )}

        {/* Profile just completed confirmation (show once) */}
        {isProfileComplete && profileJustCompleted && (
          <div
            className="rounded-[20px] p-4 animate-fade-in-up flex items-center gap-3"
            style={{ background: "hsl(var(--primary) / 0.06)", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
          >
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground/80">Perfil completo ✓</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">Agora podemos gerar recomendações personalizadas.</p>
            </div>
          </div>
        )}


        {/* Block 2a: Alimentação — quick action */}
        <div data-tutorial="suggestion-card" className="rounded-[20px] p-4 animate-fade-in-up" style={{ animationDelay: "60ms", background: "hsl(var(--card))", boxShadow: "var(--shadow-card)" }}>
          <button onClick={() => setShowFoodCard(!showFoodCard)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[10px] flex items-center justify-center" style={{ background: "hsl(174 42% 48% / 0.07)" }}>
                <Utensils className="w-[18px] h-[18px]" style={{ color: "hsl(174 42% 48% / 0.7)" }} />
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>Está com fome?</h3>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", showFoodCard && "rotate-180")} />
          </button>

          {showFoodCard && (
            <div className="mt-3 animate-fade-in-up">
              <button onClick={() => navigate("/nutricao")} className="w-full text-left group">
                <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5 group-active:scale-[0.98] transition-all duration-200" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
                  <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "hsl(174 42% 48% / 0.1)" }}>
                    <Sparkles className="w-4 h-4" style={{ color: "hsl(174 42% 48%)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground/80">Gerar sugestão de refeição</p>
                    <p className="text-[11px] text-muted-foreground/50 mt-0.5">Baseada nas suas restrições e fase do tratamento</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Block 2b: Treino - collapsible card */}
        {(() => {
          const suggestion = getWorkoutSuggestion(weeklyWorkouts, weeklyWorkoutGoal, recentSymptoms, daysUntilNext);
          return (
            <div className="rounded-[20px] p-4 animate-fade-in-up" style={{ animationDelay: "90ms", background: "hsl(var(--card))", boxShadow: "var(--shadow-card)" }}>
              <button
                onClick={() => setShowWorkoutModal(!showWorkoutModal)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[10px] flex items-center justify-center" style={{ background: "hsl(25 80% 52% / 0.07)" }}>
                    <Flame className="w-[18px] h-[18px]" style={{ color: "hsl(25 80% 52% / 0.7)" }} />
                  </div>
                  <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>Treino recomendado</h3>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", showWorkoutModal && "rotate-180")} />
              </button>

              {showWorkoutModal && (
                <div className="mt-3 space-y-3 animate-fade-in-up">
                  <div className="flex items-center gap-3 rounded-xl px-3.5 py-3 bg-background/80">
                    <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "hsl(25 80% 52% / 0.1)" }}>
                      <Dumbbell className="w-4 h-4" style={{ color: "hsl(25 80% 52%)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground/85">{suggestion.examples[0]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {suggestion.config.label} · {suggestion.duration} min
                      </p>
                    </div>
                  </div>

                  {suggestion.reason && (
                    <p className="text-xs text-muted-foreground leading-relaxed px-1">💡 {suggestion.reason}</p>
                  )}

                  <button
                    onClick={() => navigate("/treinos")}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all"
                    style={{ background: "hsl(25 80% 52% / 0.08)", color: "hsl(25 80% 52%)" }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Nova sugestão de treino
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* Block 4: Insight */}
        {insight && (
          <div className="rounded-[20px] p-4 animate-fade-in-up flex items-center gap-3" style={{ animationDelay: "240ms", background: "hsl(var(--card))", boxShadow: "var(--shadow-card)" }}>
            <div className="w-8 h-8 rounded-[12px] bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-[18px] h-[18px] text-primary" />
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed">{insight}</p>
          </div>
        )}

        {/* Daily Habits — moved to footer */}
        <DailyHabitsCard />

        </div>{/* end inner space-y-4 */}

      </div>
    </div>
  );
};

export default Dashboard;
