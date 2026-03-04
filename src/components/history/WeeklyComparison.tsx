import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

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
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Semana vs. anterior</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {thisW && lastW && (() => {
          const diff = thisW - lastW;
          const isDown = diff < 0;
          const isUp = diff > 0;
          return (
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Peso</p>
              <p className="text-lg font-bold tabular-nums">{thisW} kg</p>
              <div className="flex items-center gap-1 mt-1">
                {isDown ? <ArrowDown className="w-3 h-3 text-primary" /> : isUp ? <ArrowUp className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
                <p className={cn("text-[11px] font-semibold tabular-nums", isDown ? "text-primary" : isUp ? "text-destructive" : "text-muted-foreground")}>
                  {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg
                </p>
              </div>
            </div>
          );
        })()}
        {thisWeekSymptoms !== null && lastWeekSymptoms !== null && (() => {
          const improved = thisWeekSymptoms < lastWeekSymptoms;
          const worsened = thisWeekSymptoms > lastWeekSymptoms;
          return (
            <div className="bg-muted/40 rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Sintomas</p>
              <p className="text-lg font-bold tabular-nums">{thisWeekSymptoms.toFixed(1)}</p>
              <div className="flex items-center gap-1 mt-1">
                {improved ? <ArrowDown className="w-3 h-3 text-primary" /> : worsened ? <ArrowUp className="w-3 h-3 text-destructive" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
                <p className={cn("text-[11px] font-semibold", improved ? "text-primary" : worsened ? "text-destructive" : "text-muted-foreground")}>
                  {improved ? "Redução" : worsened ? "Aumento" : "Estável"}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default WeeklyComparison;
