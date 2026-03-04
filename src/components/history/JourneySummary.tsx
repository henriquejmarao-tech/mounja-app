import { TrendingDown, TrendingUp, Minus } from "lucide-react";
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
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <h2 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Resumo do período</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Peso inicial</p>
          <p className="text-lg font-bold tabular-nums">{initialWeight ? `${initialWeight} kg` : "—"}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Peso atual</p>
          <p className="text-lg font-bold tabular-nums">{currentWeight ? `${currentWeight} kg` : "—"}</p>
        </div>
        <div className={cn("rounded-xl p-3", isLoss ? "bg-primary/8" : isGain ? "bg-destructive/8" : "bg-muted/40")}>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Variação</p>
          <div className="flex items-center gap-1.5">
            {isLoss ? <TrendingDown className="w-3.5 h-3.5 text-primary" /> : isGain ? <TrendingUp className="w-3.5 h-3.5 text-destructive" /> : <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
            <p className={cn("text-lg font-bold tabular-nums", isLoss ? "text-primary" : isGain ? "text-destructive" : "")}>
              {totalLost !== null ? `${totalLost > 0 ? "-" : "+"}${Math.abs(totalLost).toFixed(1)} kg` : "—"}
            </p>
          </div>
          {pctChange && <p className="text-[10px] text-muted-foreground mt-0.5">{isLoss ? "-" : "+"}{Math.abs(Number(pctChange))}% do peso inicial</p>}
        </div>
        <div className="bg-muted/40 rounded-xl p-3">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1">Aplicações</p>
          <p className="text-lg font-bold tabular-nums">{injectionCount}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">no período</p>
        </div>
      </div>
    </div>
  );
};

export default JourneySummary;
