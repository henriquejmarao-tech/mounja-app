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
  streakAtDate: number = 1
): number => {
  let score = 0;

  // 1. Check-in consistency (30 pts) — the log exists so base 10 + streak bonus
  const streakBonus = Math.round(Math.min(streakAtDate, 7) / 7 * 20);
  score += 10 + streakBonus;

  // 2. Food quality (25 pts) — proportional
  if (log.food_quality) {
    const foodMap: Record<string, number> = { great: 25, good: 20, regular: 12, ok: 12, bad: 5, poor: 5 };
    score += foodMap[log.food_quality] ?? 10;
  }

  // 3. Hydration (25 pts) — proportional to target
  if (log.water_ml) {
    const target = profile?.daily_water_ml || 2000;
    score += Math.round(Math.min(log.water_ml / target, 1) * 25);
  }

  // 4. Weight progress (20 pts) — if weight logged, give tracking credit
  if (log.weight && profile?.current_weight) {
    const lost = profile.current_weight - log.weight;
    if (lost > 0) {
      score += Math.round(Math.min(lost / (profile.current_weight * 0.10), 1) * 20);
    } else if (lost === 0) {
      score += 10;
    } else {
      score += 5;
    }
  } else if (log.weight) {
    score += 10;
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

  // Compute streak for each log date
  const dateSet = new Set(pastLogs.map((l) => l.date));
  const computeStreak = (date: string) => {
    let s = 1;
    const d = new Date(date + "T12:00:00");
    for (let i = 1; i <= 7; i++) {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - i);
      if (dateSet.has(prev.toISOString().split("T")[0])) s++;
      else break;
    }
    return s;
  };

  const scoreData = hasData ? pastLogs.slice(-14).map((l) => ({
    date: new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    score: computeDailyScore(l, profile, lastInjectionDate, intervalDays, computeStreak(l.date)),
  })) : [];

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
