import { Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SymptomsChartProps {
  logs: any[];
}

const SymptomsChart = ({ logs }: SymptomsChartProps) => {
  const data = logs
    .filter((l) => l.symptom_nausea !== null || l.symptom_fatigue !== null || l.symptom_headache !== null)
    .map((l: any) => ({
      date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Náusea: l.symptom_nausea ?? 0,
      Fadiga: l.symptom_fatigue ?? 0,
      "Dor de cabeça": l.symptom_headache ?? 0,
    }));

  if (data.length < 2) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "320ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-destructive" />
        </div>
        <div>
          <h2 className="font-bold text-sm">Evolução de Sintomas</h2>
          <p className="text-[10px] text-muted-foreground">Tendência ao longo do tempo (0-10)</p>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "11px" }} />
            <Line type="monotone" dataKey="Náusea" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Fadiga" stroke="hsl(var(--warning, 38 92% 50%))" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Dor de cabeça" stroke="hsl(var(--info, 210 100% 50%))" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SymptomsChart;
