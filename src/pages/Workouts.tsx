import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Dumbbell, Footprints, Zap, Plus, Minus, X, RefreshCw, Save, Flame, Target, Clock, ChevronRight, Trophy, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ContextualHint from "@/components/tutorial/ContextualHint";
import FeaturedForYou from "@/components/FeaturedForYou";

interface WorkoutSuggestion {
  warmup: string;
  main_workout: string;
  cooldown: string;
  duration_minutes: number;
  intensity: string;
  focus_area: string;
  tip: string;
  context_note: string;
}

const levelLabels: Record<string, string> = {
  sedentary: "Iniciante", light: "Pouco ativo", moderate: "Moderado", active: "Ativo",
};

const frequencySuggestion: Record<string, string> = {
  sedentary: "2-3x por semana, 10-15 min", light: "3-4x por semana, 20-30 min",
  moderate: "4-5x por semana, 30-45 min", active: "5-6x por semana, 45-60 min",
};

const intensityLabel: Record<string, string> = { light: "Leve", moderate: "Moderado", intense: "Intenso" };

const Workouts = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);

  // AI suggestion state
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [suggestion, setSuggestion] = useState<WorkoutSuggestion | null>(null);
  const [savedToday, setSavedToday] = useState(false);

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
      const today = new Date().toISOString().split("T")[0];

      const [workoutsRes, savedRes] = await Promise.all([
        supabase.from("workouts" as any).select("*").eq("user_id", user.id).gte("date", weekAgo).order("date", { ascending: false }),
        supabase.from("workout_suggestions" as any).select("*").eq("user_id", user.id).eq("date", today).limit(1),
      ]);

      const wk = (workoutsRes.data as any[]) || [];
      setWeeklyCount(wk.length);
      setRecentWorkouts(wk.slice(0, 5));

      const saved = (savedRes.data as any[]) || [];
      if (saved.length > 0) {
        setSuggestion(saved[0]);
        setSavedToday(true);
      }

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

  const generateSuggestion = async () => {
    setGenerating(true);
    setSuggestion(null);
    setShowModal(true);

    try {
      const { data, error } = await supabase.functions.invoke("workout-suggestion", {});
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

    await supabase.from("workout_suggestions" as any).delete().eq("user_id", user.id).eq("date", today);

    const { error } = await supabase.from("workout_suggestions" as any).insert({
      user_id: user.id,
      date: today,
      warmup: suggestion.warmup,
      main_workout: suggestion.main_workout,
      cooldown: suggestion.cooldown,
      duration_minutes: suggestion.duration_minutes,
      intensity: suggestion.intensity,
      focus_area: suggestion.focus_area,
      tip: suggestion.tip,
      context_note: suggestion.context_note,
    } as any);

    if (error) toast.error("Erro ao salvar.");
    else {
      toast.success("Treino salvo para hoje! 💪");
      setSavedToday(true);
    }
    setSaving(false);
  };

  const progress = Math.min(100, (weeklyCount / weeklyGoal) * 100);

  const workoutSections = [
    { key: "warmup", label: "Aquecimento", Icon: Flame },
    { key: "main_workout", label: "Treino principal", Icon: Dumbbell },
    { key: "cooldown", label: "Volta à calma", Icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-workout opacity-95" />
        <div className="relative px-5 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-white" />
            <h1 className="text-xl font-bold text-white">Movimento</h1>
          </div>
          <p className="text-sm text-white/70 mt-1">No seu ritmo, do seu jeito</p>
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
            <ContextualHint id="workout-ai" message="Gere treinos personalizados com IA adaptados ao seu momento." className="mb-1" />

            {/* AI Workout suggestion button */}
            <button
              data-tutorial="workout-ai-btn"
              onClick={generateSuggestion}
              disabled={generating}
              className="w-full bg-card rounded-2xl p-4 shadow-card border border-urgent/20 flex items-center gap-3 hover:border-urgent/40 transition-all animate-fade-in-up active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-xl gradient-workout flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Treino do dia com IA</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {savedToday ? "Treino salvo — toque para gerar outro" : "Adaptado ao seu momento e nível"}
                </p>
              </div>
              <Dumbbell className="w-4 h-4 text-urgent" />
            </button>

            <FeaturedForYou context="movement" />

            {/* Weekly goal + progress */}
            <div data-tutorial="workout-goal" className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-urgent" />
                  <h3 className="font-semibold text-sm">Meta semanal</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleGoalChange(-1)} disabled={savingGoal || weeklyGoal <= 1}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm font-bold text-urgent min-w-[3ch] text-center">{weeklyGoal}x</span>
                  <button onClick={() => handleGoalChange(1)} disabled={savingGoal || weeklyGoal >= 7}
                    className="w-7 h-7 rounded-full bg-muted flex items-center justify-center disabled:opacity-30">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="gradient-workout h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs font-bold text-urgent">{weeklyCount}/{weeklyGoal}</span>
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

            {/* User level with edit */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-urgent" />
                  <h3 className="font-semibold text-sm">Seu perfil</h3>
                </div>
                <span className="text-[10px] font-bold bg-urgent/10 text-urgent px-2.5 py-1 rounded-full">
                  {levelLabels[activityLevel] || "Iniciante"}
                </span>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 mb-3">
                <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Frequência sugerida</p>
                <p className="text-sm font-bold">{frequencySuggestion[activityLevel] || frequencySuggestion.sedentary}</p>
              </div>
              <button
                onClick={() => navigate("/preferencias-rotina")}
                className="w-full flex items-center justify-between bg-muted/50 rounded-xl px-3 py-2.5 hover:bg-muted transition-colors"
              >
                <p className="text-xs font-semibold">Editar perfil de atividade</p>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Dicas educativas gerais. Consulte um profissional antes de iniciar atividades intensas.
              </p>
            </div>
          </>
        )}
      </div>

      {/* AI Workout Suggestion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] bg-card flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
          <div className="shrink-0 px-5 pt-4 pb-3 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-urgent" />
              <h2 className="font-bold text-base">Treino do dia</h2>
            </div>
            <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {generating ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div className="w-10 h-10 border-3 border-urgent/30 border-t-urgent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Gerando treino personalizado...</p>
                <p className="text-xs text-muted-foreground/60">Isso pode levar alguns segundos</p>
              </div>
            ) : suggestion ? (
              <>
                {suggestion.context_note && (
                  <div className="bg-urgent/5 rounded-xl px-3.5 py-2.5 border border-urgent/10">
                    <p className="text-xs text-urgent font-medium">{suggestion.context_note}</p>
                  </div>
                )}

                {/* Focus area + duration + intensity */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-center">
                    <Target className="w-3.5 h-3.5 text-urgent mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground font-medium">Foco</p>
                    <p className="text-xs font-bold">{suggestion.focus_area || "—"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-center">
                    <Clock className="w-3.5 h-3.5 text-urgent mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground font-medium">Duração</p>
                    <p className="text-xs font-bold">{suggestion.duration_minutes ? `${suggestion.duration_minutes}min` : "—"}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl px-3 py-2.5 text-center">
                    <Flame className="w-3.5 h-3.5 text-urgent mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground font-medium">Intensidade</p>
                    <p className="text-xs font-bold">{intensityLabel[suggestion.intensity] || suggestion.intensity || "—"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {workoutSections.map(({ key, label, Icon }) => {
                    const value = (suggestion as any)[key];
                    if (!value) return null;
                    return (
                      <div key={key} className="bg-muted/50 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className="w-3.5 h-3.5 text-urgent" />
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                        </div>
                        <ul className="space-y-1.5">
                          {value
                            .split(/\n|;|·/)
                            .map((s: string) => s.replace(/^-\s*/, "").trim())
                            .filter(Boolean)
                            .map((item: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-urgent/40 shrink-0 mt-[7px]" />
                                <span className="text-[13px] leading-snug">{item}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {suggestion.tip && (
                  <div className="bg-muted/30 rounded-xl px-4 py-3 border border-border/50">
                    <p className="text-xs font-semibold mb-1">💡 Dica do treino</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.tip}</p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {suggestion && !generating && (
            <div className="shrink-0 px-5 pt-3 border-t border-border/50 bg-card" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}>
              <div className="flex gap-2">
                <button
                  onClick={generateSuggestion}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border bg-background text-sm font-semibold transition-all active:scale-[0.97]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Outro
                </button>
                <button
                  onClick={saveSuggestion}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-workout text-white text-sm font-semibold shadow-sm active:scale-[0.97]"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4" /> Salvar</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Workouts;
