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
  _lastInjectionDate: string | null,
  _intervalDays: number,
  weightLossStreak: number = 0,
  prevWeight: number | null = null
): number => {
  let score = 0;

  // 1. Check-in (20 pts)
  score += 20;

  // 2. Food quality (25 pts)
  if (log.food_quality) {
    const foodMap: Record<string, number> = { great: 25, good: 20, regular: 12, ok: 12, bad: 5, poor: 5 };
    score += foodMap[log.food_quality] ?? 10;
  }

  // 3. Hydration (25 pts)
  if (log.water_ml) {
    const target = profile?.daily_water_ml || 2000;
    score += Math.round(Math.min(log.water_ml / target, 1) * 25);
  }

  // 4. Weight with streak-based scoring (30 pts)
  if (log.weight && prevWeight) {
    const diff = Number(prevWeight) - Number(log.weight);
    if (diff > 0) {
      const streakBonus = Math.min(weightLossStreak, 10) * 2;
      score += Math.min(10 + streakBonus, 30);
    } else if (Math.abs(diff) <= 0.2) {
      score += 18;
    } else {
      const penalty = Math.min(Math.abs(diff) / 0.5, 1);
      score += Math.round(8 * (1 - penalty));
    }
  } else if (log.weight) {
    score += 15;
  }

  return Math.min(score, 100);
};

const getScoreColor = (score: number) => {
  if (score <= 40) return "hsl(0, 60%, 55%)";
  if (score <= 70) return "hsl(45, 93%, 47%)";
  return "hsl(153, 46%, 34%)";
};

const DailyScoreChart = ({ logs, profile, lastInjectionDate, intervalDays }: DailyScoreChartProps) => {
  const today = new Date().toISOString().split("T")[0];

  // Exclude today (incomplete) and deduplicate by date (keep last entry per date)
  const dedupMap = new Map<string, any>();
  logs.filter((l) => l.date && l.date < today).forEach((l) => dedupMap.set(l.date, l));
  const pastLogs = Array.from(dedupMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  const hasData = pastLogs.length >= 2;

  const scoreData = hasData ? pastLogs.slice(-14).map((l, idx, arr) => {
    // Find previous log with weight for day-over-day comparison
    let prevWeight: number | null = null;
    for (let i = idx - 1; i >= 0; i--) {
      if (arr[i].weight) { prevWeight = arr[i].weight; break; }
    }
    // Also check logs before the slice window
    if (!prevWeight) {
      const sliceStart = pastLogs.length > 14 ? pastLogs.length - 14 : 0;
      for (let i = sliceStart + idx - 1; i >= 0; i--) {
        if (pastLogs[i]?.weight) { prevWeight = pastLogs[i].weight; break; }
      }
    }
    return {
      date: new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      score: computeDailyScore(l, profile, lastInjectionDate, intervalDays, 1, prevWeight),
    };
  }) : [];

  const avgScore = scoreData.length
    ? Math.round(scoreData.reduce((s, d) => s + d.score, 0) / scoreData.length)
    : 0;

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Score diário
        </h3>
        {hasData && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/60 font-medium">Média</span>
            <span className="text-lg font-extrabold tabular-nums text-primary">{avgScore}</span>
            <span className="text-[10px] text-muted-foreground/40 font-medium">/100</span>
          </div>
        )}
      </div>

      {hasData ? (
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
      ) : (
        <p className="text-xs text-muted-foreground/60 text-center py-8">Faça mais registros diários, ainda não está disponível.</p>
      )}
    </div>
  );
};

export default DailyScoreChart;
