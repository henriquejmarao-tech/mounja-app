import { cn } from "@/lib/utils";

interface JourneySummaryProps {
  initialWeight: number | null;
  currentWeight: number | null;
  totalLost: number | null;
  injectionCount: number;
}

const JourneySummary = ({ initialWeight, currentWeight, totalLost, injectionCount }: JourneySummaryProps) => {
  const isLoss = totalLost !== null && totalLost > 0;
  const isGain = totalLost !== null && totalLost < 0;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
      <h2 className="font-bold text-sm text-foreground mb-4">Seu progresso</h2>

      {/* Hero weight change */}
      <div className="flex items-center justify-center mb-4">
        <span className={cn(
          "text-3xl font-extrabold tabular-nums tracking-tight",
          isLoss ? "text-primary" : isGain ? "text-destructive" : "text-muted-foreground"
        )}>
          {totalLost !== null ? `${totalLost > 0 ? "-" : "+"}${Math.abs(totalLost).toFixed(1)} kg` : "—"}
        </span>
      </div>

      <div className="h-px bg-border/60 mb-3" />

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground/70 font-medium mb-0.5">Peso inicial</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{initialWeight ? `${initialWeight}` : "—"}<span className="text-xs font-medium text-muted-foreground/50 ml-0.5">kg</span></p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-muted-foreground/70 font-medium mb-0.5">Peso atual</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{currentWeight ? `${currentWeight}` : "—"}<span className="text-xs font-medium text-muted-foreground/50 ml-0.5">kg</span></p>
        </div>
      </div>
    </div>
  );
};

export default JourneySummary;
