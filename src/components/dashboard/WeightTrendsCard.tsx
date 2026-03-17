import { useState, useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { ChevronRight, Scale } from "lucide-react";

interface WeightTrendsCardProps {
  weightHistory: { date: string; peso: number }[];
  onExpand?: () => void;
  onRegisterWeight?: () => void;
}

const periods = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "All", days: 9999 },
];

const WeightTrendsCard = ({ weightHistory, onExpand, onRegisterWeight }: WeightTrendsCardProps) => {
  const [activePeriod, setActivePeriod] = useState(0);

  const filteredData = useMemo(() => {
    const days = periods[activePeriod].days;
    if (days >= 9999) return weightHistory;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return weightHistory.filter((d) => d.date >= cutoffStr);
  }, [weightHistory, activePeriod]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const latestWeight = filteredData.length > 0 ? filteredData[filteredData.length - 1].peso : null;
  const firstWeight = filteredData.length > 0 ? filteredData[0].peso : null;
  const diff = latestWeight && firstWeight ? firstWeight - latestWeight : null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Tendência de peso</h2>
        <button
          onClick={() => onExpand?.()}
          className="text-[11px] text-muted-foreground/50 font-semibold flex items-center gap-0.5"
        >
          Ver mais <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Period tabs */}
      <div className="flex gap-0 mb-5 relative">
        {periods.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActivePeriod(i)}
            className={cn(
              "flex-1 pb-2.5 text-sm font-semibold transition-all border-b",
              activePeriod === i
                ? "text-foreground border-transparent"
                : "text-muted-foreground border-border/50"
            )}
          >
            {p.label}
            {activePeriod === i && (
              <div className="absolute bottom-0 tab-underline-gradient transition-all duration-300" style={{
                left: `${(i / periods.length) * 100}%`,
                width: `${100 / periods.length}%`,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Diff badge */}
      {diff !== null && diff !== 0 && (
        <div className="flex justify-end mb-2">
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            diff > 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
          )}>
            {diff > 0 ? `-${diff.toFixed(1)}` : `+${Math.abs(diff).toFixed(1)}`} kg
          </span>
        </div>
      )}

      {/* Chart or Empty State */}
      {filteredData.length >= 2 ? (
        <div className="h-48 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["dataMin - 2", "dataMax + 2"]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v} kg`}
                width={50}
              />
              <Area
                type="monotone"
                dataKey="peso"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fill="url(#weightGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
            <Scale className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-semibold text-foreground/70 mb-1">
            Registre seu peso hoje
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            para começar a visualizar sua evolução
          </p>
          {onRegisterWeight && (
            <button
              onClick={onRegisterWeight}
              className="gradient-hero text-primary-foreground px-5 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform"
            >
              Registrar peso
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WeightTrendsCard;
