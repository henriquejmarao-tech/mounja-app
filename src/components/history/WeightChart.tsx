import { Scale } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Dot } from "recharts";

interface WeightChartProps {
  weightData: { date: string; peso: number }[];
}

const chartConfig = {
  peso: { label: "Peso (kg)", color: "hsl(var(--primary))" },
};

const CustomDot = (props: any) => {
  const { cx, cy, index, payload } = props;
  const isLast = index === props.dataLength - 1;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isLast ? 5 : 3}
      fill="hsl(var(--primary))"
      stroke="white"
      strokeWidth={isLast ? 3 : 2}
    />
  );
};

const WeightChart = ({ weightData }: WeightChartProps) => {
  const hasData = weightData.length > 1;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
      <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
        <Scale className="w-4 h-4 text-primary" /> Evolução do peso
      </h3>
      {hasData ? (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
          <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="peso"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fill="url(#weightGrad)"
              dot={(props: any) => <CustomDot {...props} dataLength={weightData.length} />}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ChartContainer>
      ) : (
        <p className="text-xs text-muted-foreground/60 text-center py-8">Faça mais registros diários, ainda não está disponível.</p>
      )}
    </div>
  );
};

export default WeightChart;
