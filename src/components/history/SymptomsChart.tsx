import { useState } from "react";
import { Heart, SlidersHorizontal } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface SymptomsChartProps {
  logs: any[];
}

const ALL_SYMPTOMS = [
  { key: "Náusea", field: "symptom_nausea", color: "hsl(0, 60%, 55%)" },
  { key: "Fadiga", field: "symptom_fatigue", color: "hsl(38, 92%, 50%)" },
  { key: "Dor de cabeça", field: "symptom_headache", color: "hsl(210, 80%, 55%)" },
  { key: "Constipação", field: "symptom_constipation", color: "hsl(270, 50%, 55%)" },
  { key: "Diarreia", field: "symptom_diarrhea", color: "hsl(160, 50%, 45%)" },
  { key: "Dor na aplicação", field: "symptom_injection_pain", color: "hsl(330, 55%, 50%)" },
];

const SymptomsChart = ({ logs }: SymptomsChartProps) => {
  const [visible, setVisible] = useState<Set<string>>(new Set(["Náusea", "Fadiga", "Dor de cabeça"]));
  const [showFilter, setShowFilter] = useState(false);

  const data = logs
    .filter((l) => ALL_SYMPTOMS.some((s) => l[s.field] !== null && l[s.field] !== undefined))
    .map((l: any) => {
      const entry: any = {
        date: new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      };
      ALL_SYMPTOMS.forEach((s) => {
        entry[s.key] = l[s.field] ?? 0;
      });
      return entry;
    });

  const hasData = data.length >= 2;

  const toggle = (key: string) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "320ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" /> Como você se sentiu
        </h3>
        {hasData && (
          <button
            onClick={() => setShowFilter((p) => !p)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90",
              showFilter ? "bg-primary/10" : "bg-muted/50"
            )}
            aria-label="Filtrar sintomas"
            type="button"
          >
            <SlidersHorizontal className={cn("w-3.5 h-3.5", showFilter ? "text-primary" : "text-muted-foreground/50")} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      {showFilter && hasData && (
        <div className="flex flex-wrap gap-1.5 mb-3 animate-fade-in">
          {ALL_SYMPTOMS.map((s) => {
            const active = visible.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border",
                  active
                    ? "border-transparent text-white"
                    : "border-border/50 text-muted-foreground/60 bg-muted/30"
                )}
                style={active ? { backgroundColor: s.color } : undefined}
                type="button"
              >
                {s.key}
              </button>
            );
          })}
        </div>
      )}

      {hasData ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              {ALL_SYMPTOMS.filter((s) => visible.has(s.key)).map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  animationDuration={800}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/60 text-center py-8">Faça mais registros diários, ainda não está disponível.</p>
      )}
    </div>
  );
};

export default SymptomsChart;
