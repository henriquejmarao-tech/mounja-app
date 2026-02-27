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
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
      <h3 className="font-bold text-sm mb-0.5 tracking-tight">Como você está hoje?</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Registre para acompanharmos seus padrões
      </p>
      <div className="flex items-center justify-between gap-1.5">
        {symptoms.map((s) => (
          <button
            key={s.value}
            onClick={() => setSelected(s.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl transition-all duration-300 flex-1",
              selected === s.value
                ? "bg-primary/10 ring-2 ring-primary shadow-glow scale-105"
                : "hover:bg-muted/80 active:scale-95"
            )}
          >
            <span className={cn(
              "text-2xl transition-transform duration-300",
              selected === s.value && "scale-110"
            )}>{s.emoji}</span>
            <span className={cn(
              "text-[10px] font-semibold transition-colors",
              selected === s.value ? "text-primary" : "text-muted-foreground"
            )}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-3 animate-slide-up">
          <button className="w-full bg-primary/8 text-primary text-xs font-semibold py-2.5 rounded-xl hover:bg-primary/12 transition-colors">
            Salvar registro
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomTracker;
