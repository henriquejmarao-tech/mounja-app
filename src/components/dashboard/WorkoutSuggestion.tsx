import { useNavigate } from "react-router-dom";
import { Dumbbell, Check, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutSuggestionProps {
  weeklyWorkouts: number;
  weeklyWorkoutGoal: number;
  recentSymptoms: { nausea: number; fatigue: number } | null;
  daysUntilNext: number | null;
  todayWorkout: { type: string; duration: number } | null;
  onRestDay: () => void;
  restDayDismissed: boolean;
}

type Intensity = "light" | "moderate" | "intense";

const intensityConfig: Record<Intensity, { label: string; colorClass: string; dotClass: string }> = {
  light: { label: "Leve", colorClass: "text-primary", dotClass: "bg-primary" },
  moderate: { label: "Moderado", colorClass: "text-warning", dotClass: "bg-warning" },
  intense: { label: "Intenso", colorClass: "text-destructive", dotClass: "bg-destructive" },
};

const workoutExamples: Record<Intensity, string> = {
  light: "Caminhada leve ou alongamento",
  moderate: "Caminhada rápida ou musculação leve",
  intense: "Corrida intervalada ou musculação",
};

const WorkoutSuggestion = ({
  weeklyWorkouts,
  weeklyWorkoutGoal,
  recentSymptoms,
  daysUntilNext,
  todayWorkout,
  onRestDay,
  restDayDismissed,
}: WorkoutSuggestionProps) => {
  const navigate = useNavigate();

  // If already trained today
  if (todayWorkout) {
    return (
      <div className="flex items-start gap-2.5 bg-primary/12 rounded-xl px-3 py-2.5 border border-primary/15">
        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-primary">Treino concluído hoje</p>
          <p className="text-[11px] text-muted-foreground">
            {todayWorkout.type} — {todayWorkout.duration} minutos
          </p>
        </div>
      </div>
    );
  }

  // If rest day dismissed
  if (restDayDismissed) {
    return (
      <div className="flex items-start gap-2.5 bg-primary/12 rounded-xl px-3 py-2.5 border border-primary/15">
        <Moon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Dia de descanso registrado. Descanse bem.</p>
      </div>
    );
  }

  // Determine intensity adaptively
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

  const config = intensityConfig[intensity];
  const example = workoutExamples[intensity];

  return (
    <div className="space-y-2.5">
      <div className="bg-primary/12 rounded-xl px-3 py-3 border border-primary/15">
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs font-semibold text-foreground">Treino recomendado hoje</p>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", config.dotClass)} />
            <span className={cn("text-[11px] font-bold", config.colorClass)}>{config.label}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] font-semibold text-foreground">{duration} minutos</span>
        </div>

        <p className="text-[11px] text-muted-foreground mb-1">Ex: {example}</p>
        {reason && <p className="text-[10px] text-muted-foreground/80 italic">{reason}</p>}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate("/registrar?tab=workout")}
          className="flex-1 gradient-hero text-primary-foreground font-semibold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all"
        >
          <Dumbbell className="w-3.5 h-3.5" />
          Registrar treino agora
        </button>
        <button
          onClick={onRestDay}
          className="px-3 py-2.5 rounded-xl text-[11px] text-muted-foreground bg-muted/60 hover:bg-muted transition-colors font-medium"
        >
          Descanso
        </button>
      </div>
    </div>
  );
};

export default WorkoutSuggestion;
