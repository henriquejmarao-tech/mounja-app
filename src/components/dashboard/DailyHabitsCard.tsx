import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { Lightbulb, Droplets, Moon, Apple, Footprints, Wind } from "lucide-react";
import { useMemo } from "react";

interface HabitTip {
  icon: typeof Lightbulb;
  text: string;
  color: string;
}

const DailyHabitsCard = () => {
  const { profile } = useAuth();
  const { dose, recentSymptoms } = useApplicationData();

  const tips = useMemo(() => {
    const allTips: HabitTip[] = [];
    const hour = new Date().getHours();

    // Hydration — always relevant
    allTips.push({
      icon: Droplets,
      text: "Beba pelo menos 2L de água hoje — ajuda na saciedade e reduz efeitos colaterais.",
      color: "hsl(200 80% 50%)",
    });

    // Time-based tips
    if (hour < 12) {
      allTips.push({
        icon: Apple,
        text: "Comece o dia com proteína no café da manhã — ovos, iogurte ou queijo cottage.",
        color: "hsl(25 80% 52%)",
      });
    } else if (hour < 18) {
      allTips.push({
        icon: Footprints,
        text: "Uma caminhada leve de 15 min após o almoço melhora a digestão e o humor.",
        color: "hsl(var(--primary))",
      });
    } else {
      allTips.push({
        icon: Moon,
        text: "Evite telas 1h antes de dormir — sono de qualidade potencializa o tratamento.",
        color: "hsl(260 60% 55%)",
      });
    }

    // Symptom-based
    const hasNausea = recentSymptoms && (recentSymptoms as any)?.nausea > 3;
    if (hasNausea) {
      allTips.push({
        icon: Wind,
        text: "Com náusea, prefira refeições pequenas e frias. Gengibre pode ajudar.",
        color: "hsl(174 42% 48%)",
      });
    }

    // Post-injection tip
    const daysUntilNext = dose.nextApplicationAt
      ? Math.max(0, Math.ceil((new Date(dose.nextApplicationAt).getTime() - Date.now()) / 86400000))
      : null;
    if (daysUntilNext !== null && (daysUntilNext >= 6 || daysUntilNext === 0)) {
      allTips.push({
        icon: Wind,
        text: "Dia pós-aplicação: pegue leve, descanse e alimente-se com calma.",
        color: "hsl(174 42% 48%)",
      });
    }

    // Generic wellness
    allTips.push({
      icon: Lightbulb,
      text: "Mastigue devagar e pare ao primeiro sinal de saciedade — seu corpo agradece.",
      color: "hsl(45 93% 47%)",
    });

    return allTips.slice(0, 3);
  }, [dose, recentSymptoms]);

  return (
    <div
      className="rounded-[20px] p-4 animate-fade-in-up"
      style={{ animationDelay: "120ms", background: "#FFFFFF", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
    >
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-7 h-7 rounded-[10px] flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.08)" }}>
          <Lightbulb className="w-[18px] h-[18px] text-primary" />
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>
          Dicas do dia
        </h3>
      </div>

      <div className="space-y-3">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-3">
            <div
              className="w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: `${tip.color}12` }}
            >
              <tip.icon className="w-[15px] h-[15px]" style={{ color: tip.color }} />
            </div>
            <p className="text-[13px] text-foreground/75 leading-relaxed">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyHabitsCard;
