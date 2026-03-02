import { Scale } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

interface WeightChartProps {
  weightData: { date: string; peso: number }[];
}

const chartConfig = {
  peso: { label: "Peso (kg)", color: "hsl(162, 38%, 40%)" },
};

const WeightChart = ({ weightData }: WeightChartProps) => {
  if (weightData.length <= 1) return null;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary" /> Evolução do Peso
      </h3>
      <ChartContainer config={chartConfig} className="h-[160px] w-full">
        <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(162, 38%, 40%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(162, 38%, 40%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(200, 12%, 90%)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" dataKey="peso" stroke="hsl(162, 38%, 40%)" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ r: 3, fill: "hsl(162, 38%, 40%)", stroke: "white", strokeWidth: 2 }} />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

export default WeightChart;
