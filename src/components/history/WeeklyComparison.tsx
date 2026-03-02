import { cn } from "@/lib/utils";

interface WeeklyComparisonProps {
  thisWeekLogs: any[];
  lastWeekLogs: any[];
}

const avgSymptom = (arr: any[]) => {
  if (arr.length === 0) return null;
  return arr.reduce((s, l) => s + (l.symptom_nausea || 0) + (l.symptom_fatigue || 0) + (l.symptom_headache || 0), 0) / (arr.length * 3);
};

const WeeklyComparison = ({ thisWeekLogs, lastWeekLogs }: WeeklyComparisonProps) => {
  if (thisWeekLogs.length === 0 || lastWeekLogs.length === 0) return null;

  const thisWeekSymptoms = avgSymptom(thisWeekLogs);
  const lastWeekSymptoms = avgSymptom(lastWeekLogs);
  const thisW = thisWeekLogs.find((l: any) => l.weight)?.weight;
  const lastW = lastWeekLogs.find((l: any) => l.weight)?.weight;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
      <h3 className="font-bold text-sm mb-3">Comparação semanal</h3>
      <div className="grid grid-cols-2 gap-4">
        {thisW && lastW && (() => {
          const diff = thisW - lastW;
          return (
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Peso</p>
              <p className="text-lg font-bold">{thisW} kg</p>
              <p className={cn("text-[11px] font-semibold", diff <= 0 ? "text-primary" : "text-secondary")}>
                {diff <= 0 ? "" : "+"}{diff.toFixed(1)} kg vs semana anterior
              </p>
            </div>
          );
        })()}
        {thisWeekSymptoms !== null && lastWeekSymptoms !== null && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-1">Sintomas (média)</p>
            <p className="text-lg font-bold">{thisWeekSymptoms.toFixed(1)}</p>
            <p className={cn("text-[11px] font-semibold", thisWeekSymptoms <= lastWeekSymptoms ? "text-primary" : "text-secondary")}>
              {thisWeekSymptoms <= lastWeekSymptoms ? "Melhorando ✨" : "Mais intensos"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyComparison;
