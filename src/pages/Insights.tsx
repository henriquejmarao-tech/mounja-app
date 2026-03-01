import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Sparkles, TrendingDown, TrendingUp, AlertTriangle, Zap } from "lucide-react";

interface Insight {
  title: string;
  description: string;
  type: "positive" | "warning" | "info";
}

const Insights = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const analyze = async () => {
      const { data: logs } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(30);

      const { data: injections } = await supabase
        .from("injections")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(10);

      const allLogs = (logs as any[]) || [];
      const allInj = (injections as any[]) || [];
      const generated: Insight[] = [];

      // Weight trend
      const weights = allLogs.filter((l) => l.weight).map((l) => l.weight);
      if (weights.length >= 3) {
        const recent = weights.slice(0, 3);
        const trend = recent[0] - recent[recent.length - 1];
        if (trend < 0) {
          generated.push({
            title: "Peso em queda",
            description: `Você perdeu ${Math.abs(trend).toFixed(1)} kg nos últimos registros. Continue assim!`,
            type: "positive",
          });
        } else if (trend > 1) {
          generated.push({
            title: "Peso subindo",
            description: `Ganho de ${trend.toFixed(1)} kg recentemente. Revise alimentação e hidratação.`,
            type: "warning",
          });
        }
      }

      // Nausea pattern after injection
      if (allInj.length > 0 && allLogs.length > 0) {
        const lastInj = allInj[0];
        const logsAfterInj = allLogs.filter((l) => {
          const logDate = new Date(l.date);
          const injDate = new Date(lastInj.date);
          const diff = (logDate.getTime() - injDate.getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 2;
        });
        const avgNausea = logsAfterInj.length
          ? logsAfterInj.reduce((sum: number, l: any) => sum + (l.symptom_nausea || 0), 0) / logsAfterInj.length
          : 0;
        if (avgNausea >= 4) {
          generated.push({
            title: "Náusea pós-aplicação",
            description: "Seus registros mostram náusea elevada nas 48h após a aplicação. Tente refeições leves e frias nesse período.",
            type: "info",
          });
        }
      }

      // Energy vs workout correlation
      const logsWithWorkout = allLogs.filter((l) => l.workout_type);
      const logsWithoutWorkout = allLogs.filter((l) => !l.workout_type);
      if (logsWithWorkout.length >= 3 && logsWithoutWorkout.length >= 3) {
        const avgEnergyWithWorkout = logsWithWorkout.reduce((s: number, l: any) => s + (l.energy || 0), 0) / logsWithWorkout.length;
        const avgEnergyWithout = logsWithoutWorkout.reduce((s: number, l: any) => s + (l.energy || 0), 0) / logsWithoutWorkout.length;
        if (avgEnergyWithWorkout > avgEnergyWithout + 1) {
          generated.push({
            title: "Treino aumenta sua energia",
            description: `Em dias de treino, sua energia média é ${avgEnergyWithWorkout.toFixed(1)} vs ${avgEnergyWithout.toFixed(1)} em dias sem treino.`,
            type: "positive",
          });
        }
      }

      // Hydration
      const waterLogs = allLogs.filter((l) => l.water_ml);
      if (waterLogs.length >= 3) {
        const avgWater = waterLogs.reduce((s: number, l: any) => s + l.water_ml, 0) / waterLogs.length;
        if (avgWater < 1500) {
          generated.push({
            title: "Hidratação baixa",
            description: `Sua média de água é ${Math.round(avgWater)}ml/dia. O ideal é pelo menos 2L. Hidratação ajuda a reduzir efeitos colaterais.`,
            type: "warning",
          });
        }
      }

      // Mood trend
      const moods = allLogs.filter((l) => l.mood > 0).map((l) => l.mood);
      if (moods.length >= 5) {
        const recentMood = moods.slice(0, 3).reduce((s: number, m: number) => s + m, 0) / 3;
        const olderMood = moods.slice(-3).reduce((s: number, m: number) => s + m, 0) / 3;
        if (recentMood > olderMood + 1) {
          generated.push({
            title: "Humor melhorando",
            description: "Seu humor tem melhorado ao longo das semanas. A adaptação ao medicamento está progredindo bem.",
            type: "positive",
          });
        }
      }

      if (generated.length === 0) {
        generated.push({
          title: "Continue registrando",
          description: "Preciso de mais dados para gerar insights personalizados. Registre pelo menos 7 dias para ver padrões.",
          type: "info",
        });
      }

      setInsights(generated);
      setLoading(false);
    };
    analyze();
  }, [user]);

  const getIcon = (type: string) => {
    switch (type) {
      case "positive": return <TrendingDown className="w-4 h-4 text-primary" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <Sparkles className="w-4 h-4 text-info" />;
    }
  };

  const getBg = (type: string) => {
    switch (type) {
      case "positive": return "border-primary/15 bg-primary/5";
      case "warning": return "border-warning/15 bg-warning/5";
      default: return "border-info/15 bg-info/5";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary-foreground" />
            <h1 className="text-xl font-bold text-primary-foreground">Insights</h1>
          </div>
          <p className="text-sm text-primary-foreground/70 mt-1">Padrões identificados nos seus dados</p>
        </div>
      </header>

      <div className="px-5 mt-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-3" />
                <div className="h-3 bg-muted rounded w-full mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          insights.map((insight, i) => (
            <div key={i} className={`rounded-2xl p-4 border shadow-card animate-fade-in-up ${getBg(insight.type)}`} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-2 mb-2">
                {getIcon(insight.type)}
                <h3 className="font-bold text-sm">{insight.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Insights;
