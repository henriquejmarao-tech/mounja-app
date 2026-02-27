import { useState } from "react";
import { cn } from "@/lib/utils";

const symptoms = [
  { emoji: "😊", label: "Bem", value: "good" },
  { emoji: "🤢", label: "Náusea", value: "nausea" },
  { emoji: "😴", label: "Cansaço", value: "fatigue" },
  { emoji: "🤕", label: "Dor", value: "pain" },
  { emoji: "😐", label: "Normal", value: "normal" },
];

const SymptomTracker = () => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <h3 className="font-semibold text-sm mb-1">Como você está hoje?</h3>
      <p className="text-xs text-muted-foreground mb-3">
        Registre para acompanharmos seus padrões
      </p>
      <div className="flex items-center justify-between gap-2">
        {symptoms.map((s) => (
          <button
            key={s.value}
            onClick={() => setSelected(s.value)}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-all duration-200 flex-1",
              selected === s.value
                ? "bg-primary/10 ring-2 ring-primary scale-105"
                : "hover:bg-muted active:scale-95"
            )}
          >
            <span className="text-xl">{s.emoji}</span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SymptomTracker;
