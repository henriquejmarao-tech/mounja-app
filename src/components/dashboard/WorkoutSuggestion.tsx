import { Dumbbell, Check, Moon, ChevronRight } from "lucide-react";

interface WorkoutSuggestionProps {
  weeklyWorkouts: number;
  weeklyWorkoutGoal: number;
  recentSymptoms: { nausea: number; fatigue: number } | null;
  daysUntilNext: number | null;
  todayWorkout: { type: string; duration: number } | null;
  restDayDismissed: boolean;
  onOpen: () => void;
}

export type Intensity = "light" | "moderate" | "intense";

export const intensityConfig: Record<Intensity, { label: string; colorClass: string; dotClass: string }> = {
  light: { label: "Leve", colorClass: "text-foreground/70", dotClass: "bg-orange-600" },
  moderate: { label: "Moderado", colorClass: "text-foreground/70", dotClass: "bg-warning" },
  intense: { label: "Intenso", colorClass: "text-foreground/70", dotClass: "bg-destructive" },
};

export const workoutExamples: Record<Intensity, string[]> = {
  light: ["Caminhada leve (20 min)", "Alongamento ou yoga suave", "Passeio ao ar livre"],
  moderate: ["Caminhada rápida (30 min)", "Musculação leve", "Bicicleta ou elíptico"],
  intense: ["Corrida intervalada", "Musculação moderada a pesada", "HIIT ou circuito funcional"],
};

export function getWorkoutSuggestion(
  weeklyWorkouts: number,
  weeklyWorkoutGoal: number,
  recentSymptoms: { nausea: number; fatigue: number } | null,
  daysUntilNext: number | null,
) {
  const isPostInjection = daysUntilNext !== null && (daysUntilNext >= 6 || daysUntilNext === 0);
  const hasHighFatigue = (recentSymptoms?.fatigue ?? 0) > 3;
  const behindGoal = weeklyWorkouts < weeklyWorkoutGoal;

  let intensity: Intensity = "moderate";
  let duration = 40;
  let reason = "";

  if (isPostInjection) {
    intensity = "light";
    duration = 20;
    reason = "Dia pós-aplicação: intensidade reduzida.";
  } else if (hasHighFatigue) {
    intensity = "light";
    duration = 25;
    reason = "Fadiga recente detectada: pegue leve hoje.";
  } else if (behindGoal) {
    intensity = "moderate";
    duration = 35;
    reason = `Faltam ${weeklyWorkoutGoal - weeklyWorkouts} treino(s) para a meta semanal.`;
  } else {
    intensity = "moderate";
    duration = 30;
    reason = "Meta semanal atingida! Mantenha o ritmo.";
  }

  return { intensity, duration, reason, config: intensityConfig[intensity], examples: workoutExamples[intensity] };
}

const WorkoutSuggestion = ({
  weeklyWorkouts,
  weeklyWorkoutGoal,
  recentSymptoms,
  daysUntilNext,
  todayWorkout,
  restDayDismissed,
  onOpen,
}: WorkoutSuggestionProps) => {
  if (todayWorkout) {
    return (
      <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
        <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "hsl(340 60% 68% / 0.1)" }}>
          <Check className="w-[18px] h-[18px]" style={{ color: "hsl(340 60% 68%)" }} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(17,24,39,0.55)" }}>Treino concluído</p>
          <p className="text-sm text-foreground/70">
            {todayWorkout.type} — {todayWorkout.duration} minutos
          </p>
        </div>
      </div>
    );
  }

  if (restDayDismissed) {
    return (
      <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
        <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "hsl(25 80% 52% / 0.1)" }}>
          <Moon className="w-[18px] h-[18px]" style={{ color: "hsl(25 80% 52%)" }} />
        </div>
        <p className="text-sm text-foreground/70">Dia de descanso registrado. Descanse bem.</p>
      </div>
    );
  }

  const { intensity, duration, config, examples } = getWorkoutSuggestion(weeklyWorkouts, weeklyWorkoutGoal, recentSymptoms, daysUntilNext);
  const workoutType = examples[0]?.replace(/\s*\(.*\)/, "") || "Treino";

  return (
    <button onClick={onOpen} className="w-full text-left group">
      <div className="flex items-center gap-3 rounded-[16px] px-3.5 py-3.5 group-active:scale-[0.98] transition-all duration-200" style={{ background: "rgba(17,24,39,0.03)", boxShadow: "0 4px 12px rgba(17,24,39,0.06)" }}>
        <div className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0" style={{ background: "hsl(25 80% 52% / 0.1)" }}>
          <Dumbbell className="w-5 h-5" style={{ color: "hsl(25 80% 52%)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground/80">{workoutType}</p>
          <p className="text-xs text-foreground/55 mt-0.5">
            {config.label} · {duration} minutos
          </p>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
};

export default WorkoutSuggestion;
