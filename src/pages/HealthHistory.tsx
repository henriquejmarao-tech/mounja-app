import { ArrowLeft, Calendar, TrendingUp, Activity, Flame, Droplets, Dumbbell, Utensils, Target, ChevronRight, Syringe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

const periodFilters = ["7d", "30d", "90d", "Total"] as const;
type Period = (typeof periodFilters)[number];

// Mock data
const weightData = [
  { date: "01/01", peso: 89.2 },
  { date: "08/01", peso: 88.5 },
  { date: "15/01", peso: 87.8 },
  { date: "22/01", peso: 87.1 },
  { date: "29/01", peso: 86.4 },
  { date: "05/02", peso: 85.9 },
  { date: "12/02", peso: 85.2 },
];

const symptomData = [
  { date: "Sem 1", nausea: 3, fadiga: 2, dor: 1 },
  { date: "Sem 2", nausea: 4, fadiga: 3, dor: 1 },
  { date: "Sem 3", nausea: 2, fadiga: 2, dor: 0 },
  { date: "Sem 4", nausea: 1, fadiga: 1, dor: 0 },
  { date: "Sem 5", nausea: 1, fadiga: 1, dor: 0 },
  { date: "Sem 6", nausea: 0, fadiga: 0, dor: 0 },
];

const engagementData = [
  { date: "Sem 1", treinos: 2, alimentacao: 4 },
  { date: "Sem 2", treinos: 3, alimentacao: 5 },
  { date: "Sem 3", treinos: 2, alimentacao: 6 },
  { date: "Sem 4", treinos: 4, alimentacao: 5 },
  { date: "Sem 5", treinos: 3, alimentacao: 6 },
  { date: "Sem 6", treinos: 4, alimentacao: 7 },
];

const applicationTimeline = [
  { date: "28 Fev", dose: "5mg", local: "Coxa esquerda", week: 7 },
  { date: "21 Fev", dose: "5mg", local: "Abdômen direito", week: 6 },
  { date: "14 Fev", dose: "2.5mg", local: "Coxa direita", week: 5 },
  { date: "07 Fev", dose: "2.5mg", local: "Abdômen esquerdo", week: 4 },
  { date: "31 Jan", dose: "2.5mg", local: "Coxa esquerda", week: 3 },
  { date: "24 Jan", dose: "2.5mg", local: "Braço direito", week: 2 },
  { date: "17 Jan", dose: "2.5mg", local: "Coxa direita", week: 1 },
];

const bodyMetrics = [
  { label: "Peso atual", value: "85.2", unit: "kg", change: "-4.0 kg", positive: true, icon: TrendingUp },
  { label: "Gordura corporal", value: "28.4", unit: "%", change: "-2.1%", positive: true, icon: Droplets },
  { label: "Massa muscular", value: "31.2", unit: "kg", change: "+0.4 kg", positive: true, icon: Dumbbell },
  { label: "IMC", value: "28.1", unit: "", change: "-1.3", positive: true, icon: Activity },
];

const chartConfig = {
  peso: { label: "Peso (kg)", color: "hsl(162, 38%, 40%)" },
  nausea: { label: "Náusea", color: "hsl(12, 76%, 64%)" },
  fadiga: { label: "Fadiga", color: "hsl(38, 88%, 58%)" },
  dor: { label: "Dor no local", color: "hsl(215, 65%, 52%)" },
  treinos: { label: "Treinos", color: "hsl(162, 38%, 40%)" },
  alimentacao: { label: "Alimentação", color: "hsl(12, 76%, 64%)" },
};

const HealthHistory = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("30d");

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-6">
          <button onClick={() => navigate("/perfil")} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Perfil</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Histórico de Saúde</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Sua evolução completa ao longo do tempo</p>
        </div>
      </header>

      {/* Period filters */}
      <div className="px-5 -mt-3 mb-4 relative z-10">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-1.5 flex gap-1">
          {periodFilters.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300 ${
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "Total" ? p : p.replace("d", " dias")}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* === 1. APLICAÇÕES === */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Syringe className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground">Aplicações</h2>
          </div>

          {/* Dose summary */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Dose atual</p>
                <p className="text-2xl font-bold text-foreground">5mg</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total</p>
                <p className="text-2xl font-bold text-primary">7 doses</p>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-hero rounded-full" style={{ width: "58%" }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Semana 7 de 12 do ciclo inicial</p>
          </div>

          {/* Timeline */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
            {applicationTimeline.slice(0, 4).map((app, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0">
                <div className="relative flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 ${i === 0 ? "border-primary bg-primary/20" : "border-muted-foreground/30 bg-muted"}`} />
                  {i < 3 && <div className="w-px h-full bg-border/60 absolute top-3" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{app.dose}</p>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Sem {app.week}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{app.date} · {app.local}</p>
                </div>
              </div>
            ))}
            <button className="w-full py-3 text-xs font-semibold text-primary flex items-center justify-center gap-1 hover:bg-muted/40 transition-colors">
              Ver histórico completo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* === 2. MÉTRICAS CORPORAIS === */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-secondary" />
            </div>
            <h2 className="text-base font-bold text-foreground">Métricas Corporais</h2>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            {bodyMetrics.map((m, i) => (
              <div key={i} className="bg-card rounded-2xl shadow-card border border-border/50 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center">
                    <m.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">{m.label}</p>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {m.value}<span className="text-xs font-medium text-muted-foreground ml-0.5">{m.unit}</span>
                </p>
                <p className={`text-[10px] font-semibold mt-1 ${m.positive ? "text-primary" : "text-destructive"}`}>
                  {m.change}
                </p>
              </div>
            ))}
          </div>

          {/* Weight chart */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-4">
            <p className="text-xs font-semibold text-foreground mb-3">Evolução do Peso</p>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <AreaChart data={weightData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(162, 38%, 40%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(162, 38%, 40%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(200, 12%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="peso" stroke="hsl(162, 38%, 40%)" strokeWidth={2.5} fill="url(#weightGrad)" dot={{ r: 3, fill: "hsl(162, 38%, 40%)", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ChartContainer>
          </div>
        </section>

        {/* === 3. SINTOMAS === */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-warning" />
            </div>
            <h2 className="text-base font-bold text-foreground">Sintomas Relatados</h2>
          </div>

          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-4">
            <p className="text-xs font-semibold text-foreground mb-1">Intensidade por semana</p>
            <p className="text-[10px] text-muted-foreground mb-3">Sintomas diminuindo com a adaptação ✨</p>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <BarChart data={symptomData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(200, 12%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 5]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="nausea" fill="hsl(12, 76%, 64%)" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="fadiga" fill="hsl(38, 88%, 58%)" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="dor" fill="hsl(215, 65%, 52%)" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ChartContainer>
            <div className="flex gap-4 mt-3">
              {[
                { label: "Náusea", color: "bg-secondary" },
                { label: "Fadiga", color: "bg-warning" },
                { label: "Dor local", color: "bg-info" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} />
                  <span className="text-[10px] text-muted-foreground">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === 4. ENGAJAMENTO === */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground">Engajamento</h2>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-3">
            {[
              { value: "18", label: "Treinos", icon: Dumbbell },
              { value: "33", label: "Refeições", icon: Utensils },
              { value: "38", label: "Dias ativos", icon: Target },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-2xl shadow-card border border-border/50 p-3 text-center">
                <s.icon className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Engagement chart */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-4">
            <p className="text-xs font-semibold text-foreground mb-3">Frequência semanal</p>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <LineChart data={engagementData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(200, 12%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="treinos" stroke="hsl(162, 38%, 40%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(162, 38%, 40%)", stroke: "white", strokeWidth: 2 }} />
                <Line type="monotone" dataKey="alimentacao" stroke="hsl(12, 76%, 64%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(12, 76%, 64%)", stroke: "white", strokeWidth: 2 }} />
              </LineChart>
            </ChartContainer>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">Treinos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-[10px] text-muted-foreground">Alimentação</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HealthHistory;
