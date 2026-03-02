import { BookOpen } from "lucide-react";

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
      narratives.push(`Seu peso caiu em média ${Math.abs(diff).toFixed(1)} kg essa semana. A tendência está positiva!`);
    } else if (diff > 0.5) {
      narratives.push(`Seu peso subiu levemente (${diff.toFixed(1)} kg vs semana passada). Pode ser retenção — observe nos próximos dias.`);
    } else {
      narratives.push("Seu peso se manteve estável essa semana.");
    }
  }

  // Workout narrative
  if (thisWeekWorkouts.length > 0) {
    const totalMin = thisWeekWorkouts.reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);
    const comparison = lastWeekWorkouts.length > 0
      ? thisWeekWorkouts.length > lastWeekWorkouts.length
        ? " — mais que na semana passada! 💪"
        : thisWeekWorkouts.length < lastWeekWorkouts.length
          ? " — um pouco menos que na semana passada."
          : " — manteve o ritmo!"
      : ".";
    narratives.push(`Você treinou ${thisWeekWorkouts.length}x essa semana (${totalMin} min)${comparison}`);
  } else if (lastWeekWorkouts.length > 0) {
    narratives.push("Essa semana não houve treinos registrados. Que tal retomar com algo leve?");
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
      narratives.push("Os sintomas diminuíram em comparação à semana passada. Seu corpo parece estar se adaptando ✨");
    } else if (thisS > lastS + 0.5) {
      narratives.push("Os sintomas estão mais intensos essa semana. Aumente a hidratação e prefira refeições leves.");
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
      narratives.push(`Aplicação recente (${recentInj.dose}). É normal sentir mais sintomas nas próximas 48h.`);
    }
  }

  // Hydration narrative
  const waterLogs = thisWeekLogs.filter((l) => l.water_ml);
  if (waterLogs.length > 0) {
    const avgW = waterLogs.reduce((s: number, l: any) => s + l.water_ml, 0) / waterLogs.length;
    if (avgW < 1500) {
      narratives.push(`Sua média de água está em ${Math.round(avgW)}ml/dia. Tentar chegar a 2L pode ajudar com os sintomas.`);
    } else if (avgW >= 2000) {
      narratives.push("Boa hidratação essa semana! 💧 Isso ajuda a minimizar efeitos colaterais.");
    }
  }

  if (narratives.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "260ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-bold text-sm">Narrativa da Semana</h2>
          <p className="text-[10px] text-muted-foreground">Conectando seus hábitos e resultados</p>
        </div>
      </div>
      <div className="space-y-3">
        {narratives.map((text, i) => (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {text}
          </p>
        ))}
      </div>
    </div>
  );
};

export default WeeklyNarrative;
