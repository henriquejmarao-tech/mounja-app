import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, CartesianGrid, ReferenceLine, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface WeightTrendsCardProps {
  weightHistory: { date: string; peso: number }[];
  onExpand?: () => void;
}

const periods = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "All", days: 9999 },
];

const WeightTrendsCard = ({ weightHistory, onExpand }: WeightTrendsCardProps) => {
  const navigate = useNavigate();
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
          className="text-xs text-primary font-semibold flex items-center gap-0.5"
        >
          Ver mais <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Period tabs */}
      <div className="flex gap-0 mb-5 border-b border-border/50">
        {periods.map((p, i) => (
          <button
            key={p.label}
            onClick={() => setActivePeriod(i)}
            className={cn(
              "flex-1 pb-2.5 text-sm font-semibold transition-all",
              activePeriod === i
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            )}
          >
            {p.label}
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

      {/* Chart */}
      {filteredData.length >= 2 ? (
        <div className="h-48 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(250, 58%, 58%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(250, 58%, 58%)" stopOpacity={0.02} />
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
                stroke="hsl(250, 58%, 58%)"
                strokeWidth={2.5}
                fill="url(#weightGradient)"
                dot={false}
                activeDot={{ r: 5, fill: "hsl(250, 58%, 58%)", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          Registre seu peso para ver o gráfico
        </div>
      )}
    </div>
  );
};

export default WeightTrendsCard;
