import { FileText } from "lucide-react";

interface WeeklyNarrativeProps {
  thisWeekLogs: any[];
  lastWeekLogs: any[];
  workouts: any[];
  injections: any[];
}

const WeeklyNarrative = ({ thisWeekLogs, lastWeekLogs, workouts, injections }: WeeklyNarrativeProps) => {
  if (thisWeekLogs.length < 2) return null;

  const now = new Date();
  const thisWeekWorkouts = workouts.filter((w) => {
    const diff = (now.getTime() - new Date(w.date).getTime()) / 86400000;
    return diff <= 7;
  });
  const lastWeekWorkouts = workouts.filter((w) => {
    const diff = (now.getTime() - new Date(w.date).getTime()) / 86400000;
    return diff > 7 && diff <= 14;
  });

  const narratives: string[] = [];

  // Weight narrative
  const thisWeights = thisWeekLogs.filter((l) => l.weight).map((l) => l.weight);
  const lastWeights = lastWeekLogs.filter((l) => l.weight).map((l) => l.weight);
  if (thisWeights.length > 0 && lastWeights.length > 0) {
    const thisAvg = thisWeights.reduce((a: number, b: number) => a + b, 0) / thisWeights.length;
    const lastAvg = lastWeights.reduce((a: number, b: number) => a + b, 0) / lastWeights.length;
    const diff = thisAvg - lastAvg;
    if (diff < -0.3) {
      narratives.push(`Redução de ${Math.abs(diff).toFixed(1)} kg na média semanal. Tendência favorável.`);
    } else if (diff > 0.5) {
      narratives.push(`Aumento de ${diff.toFixed(1)} kg na média semanal. Pode indicar retenção — monitorar nos próximos dias.`);
    } else {
      narratives.push("Peso estável em relação à semana anterior.");
    }
  }

  // Workout narrative
  if (thisWeekWorkouts.length > 0) {
    const totalMin = thisWeekWorkouts.reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);
    const comparison = lastWeekWorkouts.length > 0
      ? thisWeekWorkouts.length > lastWeekWorkouts.length
        ? " — frequência superior à semana anterior."
        : thisWeekWorkouts.length < lastWeekWorkouts.length
          ? " — frequência inferior à semana anterior."
          : " — frequência mantida."
      : ".";
    narratives.push(`${thisWeekWorkouts.length} treino(s) registrado(s) (${totalMin} min total)${comparison}`);
  } else if (lastWeekWorkouts.length > 0) {
    narratives.push("Nenhum treino registrado nesta semana. Considere retomar com atividade leve.");
  }

  // Symptom narrative
  const avgSx = (arr: any[]) => {
    if (!arr.length) return null;
    return arr.reduce((s, l) => s + (l.symptom_nausea || 0) + (l.symptom_fatigue || 0) + (l.symptom_headache || 0), 0) / (arr.length * 3);
  };
  const thisS = avgSx(thisWeekLogs);
  const lastS = avgSx(lastWeekLogs);
  if (thisS !== null && lastS !== null) {
    if (thisS < lastS - 0.5) {
      narratives.push("Sintomas com tendência de redução comparado ao período anterior. Possível adaptação ao tratamento.");
    } else if (thisS > lastS + 0.5) {
      narratives.push("Sintomas mais intensos nesta semana. Recomenda-se aumentar hidratação e priorizar refeições leves.");
    }
  }

  // Injection proximity
  const recentInj = injections.find((inj) => {
    const diff = (now.getTime() - new Date(inj.date).getTime()) / 86400000;
    return diff >= 0 && diff <= 3;
  });
  if (recentInj) {
    const daysSince = Math.round((now.getTime() - new Date(recentInj.date).getTime()) / 86400000);
    if (daysSince <= 1) {
      narratives.push(`Aplicação recente (${recentInj.dose}). Sintomas podem se intensificar nas próximas 48h — esperado.`);
    }
  }

  // Hydration narrative
  const waterLogs = thisWeekLogs.filter((l) => l.water_ml);
  if (waterLogs.length > 0) {
    const avgW = waterLogs.reduce((s: number, l: any) => s + l.water_ml, 0) / waterLogs.length;
    if (avgW < 1500) {
      narratives.push(`Média de hidratação em ${Math.round(avgW)}ml/dia. Valor abaixo do recomendado (2.000ml).`);
    } else if (avgW >= 2000) {
      narratives.push("Hidratação adequada nesta semana. Fator positivo para redução de efeitos colaterais.");
    }
  }

  if (narratives.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "260ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <h2 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Análise semanal</h2>
      </div>
      <div className="space-y-2.5">
        {narratives.map((text, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="w-1 rounded-full bg-border shrink-0 mt-1" style={{ minHeight: "12px" }} />
            <p className="text-[13px] text-foreground/80 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyNarrative;
