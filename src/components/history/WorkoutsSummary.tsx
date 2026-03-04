import { Dumbbell } from "lucide-react";

interface WorkoutsSummaryProps {
  workouts: any[];
}

const intensityLabel: Record<string, string> = {
  light: "Leve",
  moderate: "Moderado",
  intense: "Intenso",
};

const feelingLabel: Record<number, string> = {
  1: "Ruim",
  2: "Regular",
  3: "Bom",
  4: "Ótimo",
};

const WorkoutsSummary = ({ workouts }: WorkoutsSummaryProps) => {
  if (workouts.length === 0) return null;

  const totalMinutes = workouts.reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);
  const feelingWorkouts = workouts.filter((w: any) => w.feeling_after);
  const avgFeeling = feelingWorkouts.length
    ? feelingWorkouts.reduce((s: number, w: any) => s + w.feeling_after, 0) / feelingWorkouts.length
    : null;

  // Group by type
  const byType: Record<string, number> = {};
  workouts.forEach((w: any) => {
    byType[w.workout_type] = (byType[w.workout_type] || 0) + 1;
  });
  const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Treinos no período</h3>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-muted/40 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">{workouts.length}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Sessões</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">{totalMinutes}</p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Minutos</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">
            {avgFeeling ? feelingLabel[Math.round(avgFeeling)] || "—" : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Sensação</p>
        </div>
      </div>

      {/* Top types */}
      {topTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topTypes.map(([type, count]) => (
            <span key={type} className="text-[11px] font-medium bg-muted/60 text-foreground/70 px-2.5 py-1 rounded-lg border border-border/50">
              {type} ({count}x)
            </span>
          ))}
        </div>
      )}

      {/* Recent list */}
      <div className="space-y-1.5">
        {workouts.slice(0, 5).map((w: any) => (
          <div key={w.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2">
            <div>
              <p className="text-xs font-semibold">{w.workout_type}</p>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {new Date(w.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {w.duration_minutes}min · {intensityLabel[w.intensity] || w.intensity}
              </p>
            </div>
            {w.feeling_after && (
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {feelingLabel[w.feeling_after] || "—"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutsSummary;
