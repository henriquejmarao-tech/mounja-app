import { useState, useMemo } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface WeightTrendsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weightHistory: { date: string; peso: number }[];
}

const periods = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "Tudo", days: 9999 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = new Date(label + "T12:00:00");
  const formatted = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{formatted}</p>
      <p className="text-sm font-bold text-foreground">{payload[0].value.toFixed(1)} kg</p>
    </div>
  );
};

const WeightTrendsDrawer = ({ open, onOpenChange, weightHistory }: WeightTrendsDrawerProps) => {
  const [activePeriod, setActivePeriod] = useState(0);

  const filteredData = useMemo(() => {
    const days = periods[activePeriod].days;
    if (days >= 9999) return weightHistory;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    return weightHistory.filter((d) => d.date >= cutoffStr);
  }, [weightHistory, activePeriod]);

  const latestWeight = filteredData.length > 0 ? filteredData[filteredData.length - 1].peso : null;
  const firstWeight = filteredData.length > 0 ? filteredData[0].peso : null;
  const diff = latestWeight && firstWeight ? firstWeight - latestWeight : null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] rounded-t-2xl">
        <div className="px-5 pt-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Tendência de peso</h2>
            <button onClick={() => onOpenChange(false)} className="p-1 rounded-full hover:bg-muted">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Period tabs */}
          <div className="flex gap-0 mb-4 border-b border-border/50">
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

          {/* Summary */}
          <div className="flex items-center justify-between mb-4">
            {latestWeight && (
              <span className="text-2xl font-bold text-foreground">{latestWeight.toFixed(1)} kg</span>
            )}
            {diff !== null && diff !== 0 && (
              <span className={cn(
                "text-sm font-bold px-2.5 py-1 rounded-full",
                diff > 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
              )}>
                {diff > 0 ? `-${diff.toFixed(1)}` : `+${Math.abs(diff).toFixed(1)}`} kg
              </span>
            )}
          </div>

          {/* Chart */}
          {filteredData.length >= 2 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightGradExpanded" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
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
                    tickFormatter={(v: number) => `${v}`}
                    width={40}
                    unit=" kg"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="peso"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#weightGradExpanded)"
                    dot={{ r: 3, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 3 }}
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
      </DrawerContent>
    </Drawer>
  );
};

export default WeightTrendsDrawer;
