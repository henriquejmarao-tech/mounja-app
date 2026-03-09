import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Syringe, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const symptomDefs = [
  { key: "symptom_fatigue", label: "Fadiga", emoji: "😴", color: "bg-red-400", textColor: "text-red-500" },
  { key: "symptom_diarrhea", label: "Diarreia", emoji: "🤢", color: "bg-orange-400", textColor: "text-orange-500" },
  { key: "symptom_nausea", label: "Náusea", emoji: "😵", color: "bg-blue-400", textColor: "text-blue-500" },
  { key: "symptom_headache", label: "Dor de cabeça", emoji: "🤕", color: "bg-purple-400", textColor: "text-purple-500" },
  { key: "symptom_constipation", label: "Constipação", emoji: "😣", color: "bg-yellow-500", textColor: "text-yellow-600" },
  { key: "symptom_injection_pain", label: "Dor na aplicação", emoji: "💉", color: "bg-pink-400", textColor: "text-pink-500" },
];

interface DayData {
  date: string;
  weekday: string;
  dayNum: string;
  month: string;
  hasInjection: boolean;
  injectionDose?: string;
  symptoms: Record<string, number>;
  totalSeverity: number;
}

const SideEffectHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState<DayData[]>([]);
  const [period, setPeriod] = useState<30 | 60 | 90>(30);

  const loadData = useCallback(async () => {
    if (!user) return;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (period - 1));
    const cutoff = startDate.toISOString().split("T")[0];

    const [logsRes, injRes] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("date, symptom_fatigue, symptom_diarrhea, symptom_nausea, symptom_headache, symptom_constipation, symptom_injection_pain")
        .eq("user_id", user.id)
        .gte("date", cutoff)
        .order("date", { ascending: false }),
      supabase
        .from("injections")
        .select("date, dose")
        .eq("user_id", user.id)
        .gte("date", cutoff)
        .order("date", { ascending: false }),
    ]);

    const logs = (logsRes.data as any[]) || [];
    const injections = ((injRes.data as any[]) || []);
    const injMap = new Map(injections.map(i => [i.date, i.dose]));

    const result: DayData[] = [];
    for (let i = 0; i < period; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logs.find((l) => l.date === dateStr);
      
      const symptoms: Record<string, number> = {};
      let totalSeverity = 0;
      symptomDefs.forEach(s => {
        const val = log ? (log[s.key] || 0) : 0;
        symptoms[s.key] = val;
        totalSeverity += val;
      });

      result.push({
        date: dateStr,
        weekday: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
        dayNum: d.getDate().toString().padStart(2, "0"),
        month: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        hasInjection: injMap.has(dateStr),
        injectionDose: injMap.get(dateStr),
        symptoms,
        totalSeverity,
      });
    }
    setDays(result);
  }, [user, period]);

  useEffect(() => { loadData(); }, [loadData]);

  // Stats
  const daysWithSymptoms = days.filter(d => d.totalSeverity > 0).length;
  const daysWithInjection = days.filter(d => d.hasInjection).length;
  const avgSeverity = days.length > 0 ? days.reduce((s, d) => s + d.totalSeverity, 0) / days.length : 0;

  // Most common symptom
  const symptomTotals = symptomDefs.map(s => ({
    ...s,
    total: days.reduce((sum, d) => sum + (d.symptoms[s.key] || 0), 0),
    occurrences: days.filter(d => (d.symptoms[s.key] || 0) > 0).length,
  })).sort((a, b) => b.total - a.total);

  const severityLabel = (val: number) => {
    if (val === 0) return null;
    if (val <= 1) return "Leve";
    if (val <= 2) return "Moderado";
    return "Intenso";
  };

  const severityColor = (val: number) => {
    if (val <= 1) return "text-green-500";
    if (val <= 2) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30">
        <div
          className="px-5 pb-6"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
            background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl bg-white/10 text-primary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-primary-foreground">Histórico de Efeitos</h1>
          </div>

          {/* Period filter */}
          <div className="flex gap-2">
            {([30, 60, 90] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                  period === p
                    ? "bg-primary-foreground text-primary"
                    : "bg-white/15 text-primary-foreground/80"
                )}
              >
                {p} dias
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-5 -mt-2 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-2xl p-3 border border-border/50 text-center">
            <p className="text-2xl font-bold text-foreground">{daysWithSymptoms}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Dias com efeitos</p>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border/50 text-center">
            <p className="text-2xl font-bold text-primary">{daysWithInjection}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Aplicações</p>
          </div>
          <div className="bg-card rounded-2xl p-3 border border-border/50 text-center">
            <p className={cn("text-2xl font-bold", avgSeverity > 2 ? "text-destructive" : avgSeverity > 1 ? "text-yellow-500" : "text-green-500")}>
              {avgSeverity.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Severidade média</p>
          </div>
        </div>

        {/* Top symptoms */}
        {symptomTotals.filter(s => s.total > 0).length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <h2 className="text-sm font-bold text-foreground mb-3">Efeitos mais frequentes</h2>
            <div className="space-y-2.5">
              {symptomTotals.filter(s => s.total > 0).map(s => {
                const maxPossible = days.length * 3;
                const pct = maxPossible > 0 ? (s.total / maxPossible) * 100 : 0;
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{s.emoji} {s.label}</span>
                      <span className="text-[10px] text-muted-foreground">{s.occurrences} dias</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", s.color)} style={{ width: `${Math.max(pct, 3)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily timeline */}
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <div className="p-4 pb-2">
            <h2 className="text-sm font-bold text-foreground">Linha do tempo diária</h2>
          </div>

          <div className="divide-y divide-border/30">
            {days.map((day) => {
              const activeSymptoms = symptomDefs.filter(s => (day.symptoms[s.key] || 0) > 0);
              const isEmpty = !day.hasInjection && activeSymptoms.length === 0;

              if (isEmpty) return null;

              return (
                <div key={day.date} className="px-4 py-3 flex gap-3">
                  {/* Date column */}
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">{day.weekday}</p>
                    <p className="text-lg font-bold text-foreground leading-tight">{day.dayNum}</p>
                    <p className="text-[10px] text-muted-foreground">{day.month}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {day.hasInjection && (
                      <div className="flex items-center gap-1.5 bg-primary/10 rounded-lg px-2.5 py-1.5">
                        <Syringe className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-primary">
                          Aplicação {day.injectionDose && `· ${day.injectionDose}`}
                        </span>
                      </div>
                    )}

                    {activeSymptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {activeSymptoms.map(s => {
                          const val = day.symptoms[s.key];
                          return (
                            <span
                              key={s.key}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium",
                                val >= 3 ? "bg-destructive/10 text-destructive" :
                                val >= 2 ? "bg-yellow-500/10 text-yellow-600" :
                                "bg-muted text-muted-foreground"
                              )}
                            >
                              {s.emoji} {s.label}
                              <span className={cn("text-[10px] font-bold", severityColor(val))}>
                                {severityLabel(val)}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {days.filter(d => d.hasInjection || d.totalSeverity > 0).length === 0 && (
              <div className="p-8 text-center">
                <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum registro encontrado neste período</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <h3 className="text-xs font-bold text-foreground mb-2">Legenda de severidade</h3>
          <div className="flex gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Leve (1)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Moderado (2)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Intenso (3)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideEffectHistory;
