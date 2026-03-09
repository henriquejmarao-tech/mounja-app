import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Dumbbell, Footprints, Zap, Plus, Minus, X, RefreshCw, Save, Flame, Target, Clock, ChevronRight, Trophy, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-background pb-nav">
      <header className="sticky top-0 z-30">
        <div
          className="px-5 pb-14"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
            background: "linear-gradient(180deg, hsl(340 60% 68%) 0%, hsl(280 45% 35%) 100%)",
          }}
        >
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-white" />
            <h1 className="text-xl font-bold text-white">Movimento</h1>
          </div>
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
            {/* AI Workout suggestion button */}
            <button
              data-tutorial="workout-ai-btn"
              onClick={generateSuggestion}
              disabled={generating}
              className="w-full py-3.5 rounded-xl gradient-workout text-white text-sm font-bold shadow-sm active:scale-[0.97] transitihero text-primary-foregrounditems-center justify-center gap-2 animate-fade-hero text-primary-foregroundcity-60"
            >
              {generating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {savedToday ? "Gerar novo treino" : "Gerar treino personalizado"}
                </>
              )}
            </button>

            <FeaturedForYou context="movement" />



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
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold shadow-sm active:scale-[0.97]"
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
