import { TrendingDown } from "lucide-react";

interface JourneySummaryProps {
  initialWeight: number | null;
  currentWeight: number | null;
  totalLost: number | null;
  injectionCount: number;
}

const JourneySummary = ({ initialWeight, currentWeight, totalLost, injectionCount }: JourneySummaryProps) => (
  <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
        <TrendingDown className="w-4 h-4 text-primary-foreground" />
      </div>
      <h2 className="font-bold text-sm">Resumo da Jornada</h2>
    </div>
    <div className="space-y-2.5">
      {initialWeight && (
        <p className="text-sm text-muted-foreground">
          Você começou com <span className="font-bold text-foreground">{initialWeight} kg</span>.
        </p>
      )}
      {currentWeight && (
        <p className="text-sm text-muted-foreground">
          Hoje está com <span className="font-bold text-foreground">{currentWeight} kg</span>.
        </p>
      )}
      {totalLost !== null && totalLost > 0 && (
        <p className="text-sm font-semibold text-primary">Já perdeu {totalLost.toFixed(1)} kg! 🎉</p>
      )}
      {totalLost !== null && totalLost <= 0 && currentWeight && (
        <p className="text-sm text-muted-foreground">
          Continue registrando — cada dia conta para entender seu progresso.
        </p>
      )}
      {injectionCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {injectionCount} {injectionCount === 1 ? "aplicação registrada" : "aplicações registradas"} no período.
        </p>
      )}
    </div>
  </div>
);

export default JourneySummary;
