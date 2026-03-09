import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { Lightbulb, Droplets, Moon, Apple, Footprints, Wind, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn, diffCalendarDays } from "@/lib/utils";

interface HabitTip {
  icon: typeof Lightbulb;
  text: string;
}

const DailyHabitsCard = () => {
  const [expanded, setExpanded] = useState(true);
  const { profile } = useAuth();
  const { dose, recentSymptoms } = useApplicationData();

  const tips = useMemo(() => {
    const allTips: HabitTip[] = [];
    const hour = new Date().getHours();

    // Hydration — always relevant
    allTips.push({
      icon: Droplets,
      text: "Beba pelo menos 2L de água hoje — ajuda na saciedade e reduz efeitos colaterais.",
    });

    // Time-based tips
    if (hour < 12) {
      allTips.push({
        icon: Apple,
        text: "Comece o dia com proteína no café da manhã — ovos, iogurte ou queijo cottage.",
      });
    } else if (hour < 18) {
      allTips.push({
        icon: Footprints,
        text: "Uma caminhada leve de 15 min após o almoço melhora a digestão e o humor.",
      });
    } else {
      allTips.push({
        icon: Moon,
        text: "Evite telas 1h antes de dormir — sono de qualidade potencializa o tratamento.",
      });
    }

    // Symptom-based
    const hasNausea = recentSymptoms && (recentSymptoms as any)?.nausea > 3;
    if (hasNausea) {
      allTips.push({
        icon: Wind,
        text: "Com náusea, prefira refeições pequenas e frias. Gengibre pode ajudar.",
      });
    }

    // Post-injection tip
    const daysUntilNext = dose.nextApplicationAt
      ? Math.max(0, diffCalendarDays(new Date(), new Date(dose.nextApplicationAt)))
      : null;
    if (daysUntilNext !== null && (daysUntilNext >= 6 || daysUntilNext === 0)) {
      allTips.push({
        icon: Wind,
        text: "Dia pós-aplicação: pegue leve, descanse e alimente-se com calma.",
      });
    }

    // Generic wellness
    allTips.push({
      icon: Lightbulb,
      text: "Mastigue devagar e pare ao primeiro sinal de saciedade — seu corpo agradece.",
    });

    return allTips.slice(0, 3);
  }, [dose, recentSymptoms]);

  return (
    <div
      className="rounded-[20px] p-4 animate-fade-in-up"
      style={{ animationDelay: "120ms", background: "#F7F8F7", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}
    >
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.08)" }}>
            <Lightbulb className="w-[18px] h-[18px] text-primary" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>
            Dicas do dia
          </h3>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-2.5 mt-3.5 animate-fade-in-up">
          {tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0 mt-[7px]" />
              <p className="text-[13px] text-foreground/65 leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyHabitsCard;
