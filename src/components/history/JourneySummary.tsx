import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface JourneySummaryProps {
  initialWeight: number | null;
  currentWeight: number | null;
  totalLost: number | null;
  injectionCount: number;
}

const JourneySummary = ({ initialWeight, currentWeight, totalLost, injectionCount }: JourneySummaryProps) => {
  const pctChange = initialWeight && totalLost ? ((totalLost / initialWeight) * 100).toFixed(1) : null;
  const isLoss = totalLost !== null && totalLost > 0;
  const isGain = totalLost !== null && totalLost < 0;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
      <h2 className="font-bold text-sm text-foreground mb-4">Seu progresso</h2>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Peso inicial</span>
          <span className="text-[13px] font-semibold tabular-nums">{initialWeight ? `${initialWeight} kg` : "—"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Peso atual</span>
          <span className="text-[13px] font-semibold tabular-nums">{currentWeight ? `${currentWeight} kg` : "—"}</span>
        </div>

        <div className="h-px bg-border/60 my-1" />

        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted-foreground">Variação</span>
          <div className="flex items-center gap-1.5">
            {isLoss && <ArrowDown className="w-3.5 h-3.5 text-primary" />}
            {isGain && <ArrowUp className="w-3.5 h-3.5 text-destructive" />}
            <span className={cn(
              "text-base font-bold tabular-nums",
              isLoss ? "text-primary" : isGain ? "text-destructive" : "text-muted-foreground"
            )}>
              {totalLost !== null ? `${totalLost > 0 ? "-" : "+"}${Math.abs(totalLost).toFixed(1)} kg` : "—"}
            </span>
          </div>
        </div>

        {pctChange && (
          <p className={cn(
            "text-[11px] text-right font-medium",
            isLoss ? "text-primary/70" : "text-destructive/70"
          )}>
            {isLoss ? "-" : "+"}{Math.abs(Number(pctChange))}% do peso inicial
          </p>
        )}
      </div>
    </div>
  );
};

export default JourneySummary;
