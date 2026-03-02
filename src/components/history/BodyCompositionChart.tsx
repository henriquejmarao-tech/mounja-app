import { Ruler } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";

interface BodyCompositionChartProps {
  logs: any[];
}

const chartConfig = {
  cintura: { label: "Cintura (cm)", color: "hsl(215, 65%, 52%)" },
  quadril: { label: "Quadril (cm)", color: "hsl(12, 76%, 64%)" },
  gordura: { label: "Gordura (%)", color: "hsl(38, 88%, 58%)" },
};

const BodyCompositionChart = ({ logs }: BodyCompositionChartProps) => {
  const relevantLogs = logs.filter((l) => l.waist_cm || l.hip_cm || l.body_fat_pct);
  if (relevantLogs.length < 2) return null;

  const data = relevantLogs.map((l: any) => ({
    date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    cintura: l.waist_cm || undefined,
    quadril: l.hip_cm || undefined,
    gordura: l.body_fat_pct || undefined,
  }));

  const hasWaist = relevantLogs.some((l) => l.waist_cm);
  const hasHip = relevantLogs.some((l) => l.hip_cm);
  const hasFat = relevantLogs.some((l) => l.body_fat_pct);

  // Summary
  const firstWaist = relevantLogs.find((l) => l.waist_cm)?.waist_cm;
  const lastWaist = [...relevantLogs].reverse().find((l) => l.waist_cm)?.waist_cm;
  const waistDiff = firstWaist && lastWaist ? lastWaist - firstWaist : null;

  const firstFat = relevantLogs.find((l) => l.body_fat_pct)?.body_fat_pct;
  const lastFat = [...relevantLogs].reverse().find((l) => l.body_fat_pct)?.body_fat_pct;
  const fatDiff = firstFat && lastFat ? lastFat - firstFat : null;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Ruler className="w-4 h-4 text-primary" /> Composição Corporal
      </h3>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {waistDiff !== null && (
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${waistDiff <= 0 ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
            Cintura: {waistDiff <= 0 ? "" : "+"}{waistDiff.toFixed(1)} cm
          </span>
        )}
        {fatDiff !== null && (
          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${fatDiff <= 0 ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
            Gordura: {fatDiff <= 0 ? "" : "+"}{fatDiff.toFixed(1)}%
          </span>
        )}
      </div>

      <ChartContainer config={chartConfig} className="h-[160px] w-full">
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(200, 12%, 90%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {hasWaist && (
            <Line type="monotone" dataKey="cintura" stroke="hsl(215, 65%, 52%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(215, 65%, 52%)", stroke: "white", strokeWidth: 2 }} connectNulls />
          )}
          {hasHip && (
            <Line type="monotone" dataKey="quadril" stroke="hsl(12, 76%, 64%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(12, 76%, 64%)", stroke: "white", strokeWidth: 2 }} connectNulls />
          )}
          {hasFat && (
            <Line type="monotone" dataKey="gordura" stroke="hsl(38, 88%, 58%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(38, 88%, 58%)", stroke: "white", strokeWidth: 2 }} connectNulls />
          )}
        </LineChart>
      </ChartContainer>

      <div className="flex gap-3 mt-2 justify-center">
        {hasWaist && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-info" /> Cintura</span>}
        {hasHip && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-secondary" /> Quadril</span>}
        {hasFat && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full bg-warning" /> Gordura</span>}
      </div>
    </div>
  );
};

export default BodyCompositionChart;
