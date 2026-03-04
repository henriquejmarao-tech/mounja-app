import { Activity } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

interface DailyScoreChartProps {
  logs: any[];
  profile: any;
  lastInjectionDate: string | null;
  intervalDays: number;
}

const chartConfig = {
  score: { label: "Score", color: "hsl(var(--primary))" },
};

const computeDailyScore = (
  log: any,
  profile: any,
  lastInjectionDate: string | null,
  intervalDays: number
): number => {
  let score = 0;

  // 1. Medication adherence (35 pts) — based on injection proximity to log date
  if (lastInjectionDate) {
    const logDate = new Date(log.date + "T12:00:00").getTime();
    const injDate = new Date(lastInjectionDate + "T12:00:00").getTime();
    const daysSince = Math.floor((logDate - injDate) / 86400000);
    if (daysSince >= 0 && daysSince <= intervalDays) {
      score += 35;
    } else if (daysSince > intervalDays) {
      score += Math.max(0, 35 - (daysSince - intervalDays) * 5);
    }
  }

  // 2. Hydration (20 pts)
  if (log.water_ml) {
    const target = profile?.daily_water_ml || 2000;
    score += Math.round(Math.min(log.water_ml / target, 1) * 20);
  }

  // 3. Meals (25 pts)
  if (log.food_quality) {
    score += log.food_quality === "good" || log.food_quality === "great" ? 25 : 12;
  }

  // 4. Activity (20 pts)
  if (log.workout_type || log.workout_duration) {
    score += 20;
  }

  return Math.min(score, 100);
};

const getScoreColor = (score: number) => {
  if (score <= 40) return "hsl(0, 60%, 55%)";
  if (score <= 70) return "hsl(45, 93%, 47%)";
  return "hsl(153, 46%, 34%)";
};

const DailyScoreChart = ({ logs, profile, lastInjectionDate, intervalDays }: DailyScoreChartProps) => {
  if (logs.length < 2) return null;

  const scoreData = logs
    .filter((l) => l.date)
    .slice(-14)
    .map((l) => ({
      date: new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      score: computeDailyScore(l, profile, lastInjectionDate, intervalDays),
    }));

  const avgScore = scoreData.length
    ? Math.round(scoreData.reduce((s, d) => s + d.score, 0) / scoreData.length)
    : 0;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Score diário
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground/60 font-medium">Média</span>
          <span className="text-lg font-extrabold tabular-nums text-primary">{avgScore}</span>
          <span className="text-[10px] text-muted-foreground/40 font-medium">/100</span>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[160px] w-full">
        <BarChart data={scoreData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="score"
            radius={[4, 4, 0, 0]}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {scoreData.map((entry, index) => (
              <Cell key={index} fill={getScoreColor(entry.score)} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default DailyScoreChart;
