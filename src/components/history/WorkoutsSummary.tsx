import { Dumbbell } from "lucide-react";

interface WorkoutsSummaryProps {
  workouts: any[];
}

const intensityLabel: Record<string, string> = {
  light: "Leve",
  moderate: "Moderado",
  intense: "Intenso",
};

const WorkoutsSummary = ({ workouts }: WorkoutsSummaryProps) => {
  if (workouts.length === 0) return null;

  const totalMinutes = workouts.reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);
  const avgFeeling = workouts.filter((w: any) => w.feeling_after).reduce((s: number, w: any) => s + w.feeling_after, 0) / (workouts.filter((w: any) => w.feeling_after).length || 1);

  // Group by type
  const byType: Record<string, number> = {};
  workouts.forEach((w: any) => {
    byType[w.workout_type] = (byType[w.workout_type] || 0) + 1;
  });
  const topTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-primary" /> Treinos no Período
      </h3>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-muted/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">{workouts.length}</p>
          <p className="text-[10px] text-muted-foreground">Treinos</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">{totalMinutes}</p>
          <p className="text-[10px] text-muted-foreground">Minutos</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-2.5 text-center">
          <p className="text-lg font-bold text-foreground">
            {avgFeeling > 0 ? ["", "😞", "😐", "🙂", "😊"][Math.round(avgFeeling)] : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">Sensação</p>
        </div>
      </div>

      {/* Top types */}
      {topTypes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {topTypes.map(([type, count]) => (
            <span key={type} className="text-[11px] font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
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
              <p className="text-[10px] text-muted-foreground">
                {new Date(w.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · {w.duration_minutes}min · {intensityLabel[w.intensity] || w.intensity}
              </p>
            </div>
            {w.feeling_after && (
              <span className="text-base">{["", "😞", "😐", "🙂", "😊"][w.feeling_after]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutsSummary;
