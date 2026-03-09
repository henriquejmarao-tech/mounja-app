import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const symptomDefs = [
  { key: "symptom_fatigue", label: "Fadiga", color: "bg-red-400" },
  { key: "symptom_diarrhea", label: "Diarreia", color: "bg-orange-400" },
  { key: "symptom_nausea", label: "Náusea", color: "bg-blue-400" },
  { key: "symptom_headache", label: "Dor de cabeça", color: "bg-purple-400" },
  { key: "symptom_constipation", label: "Constipação", color: "bg-yellow-500" },
  { key: "symptom_injection_pain", label: "Dor na aplicação", color: "bg-pink-400" },
];

interface DayData {
  date: string;
  hasInjection: boolean;
  symptoms: Record<string, number>;
}

const SideEffectHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState<DayData[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);
    const cutoff = startDate.toISOString().split("T")[0];

    const [logsRes, injRes] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("date, symptom_fatigue, symptom_diarrhea, symptom_nausea, symptom_headache, symptom_constipation, symptom_injection_pain")
        .eq("user_id", user.id)
        .gte("date", cutoff)
        .order("date", { ascending: true }),
      supabase
        .from("injections")
        .select("date")
        .eq("user_id", user.id)
        .gte("date", cutoff),
    ]);

    const logs = (logsRes.data as any[]) || [];
    const injections = new Set(((injRes.data as any[]) || []).map((i) => i.date));

    const result: DayData[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const log = logs.find((l) => l.date === dateStr);
      result.push({
        date: dateStr,
        hasInjection: injections.has(dateStr),
        symptoms: log
          ? {
              symptom_fatigue: log.symptom_fatigue || 0,
              symptom_diarrhea: log.symptom_diarrhea || 0,
              symptom_nausea: log.symptom_nausea || 0,
              symptom_headache: log.symptom_headache || 0,
              symptom_constipation: log.symptom_constipation || 0,
              symptom_injection_pain: log.symptom_injection_pain || 0,
            }
          : {},
      });
    }
    setDays(result);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const activeSymptoms = symptomDefs.filter((s) =>
    days.some((d) => (d.symptoms[s.key] || 0) > 0)
  );

  // Show all symptoms even if no data
  const displaySymptoms = activeSymptoms.length > 0 ? symptomDefs : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header
        className="px-5 pb-4 flex items-center gap-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        <button onClick={() => navigate(-1)} className="p-1">
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1 text-center pr-6">Histórico de Efeitos</h1>
      </header>

      {/* Symptom rows */}
      <div className="mx-5 bg-card rounded-2xl border border-border/50 overflow-hidden">
        {displaySymptoms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Nenhum efeito colateral registrado ainda
          </p>
        ) : (
          <div className="divide-y divide-border/30">
            {displaySymptoms.map((symptom) => (
              <div key={symptom.key} className="px-5 py-4">
                <p className="text-base font-semibold text-foreground mb-3">{symptom.label}</p>
                <div className="flex items-center" style={{ gap: "3px" }}>
                  {days.map((day) => {
                    const value = day.symptoms[symptom.key] || 0;
                    const hasSymptom = value > 0;
                    const hasInj = day.hasInjection;

                    // Grey dot + purple lines = only treatment
                    // Red dot + purple lines = treatment + symptom
                    // Red dot only = symptom only
                    // Grey dot only = nothing

                    return (
                      <div key={day.date} className="relative flex flex-col items-center" style={{ flex: "1 1 0", minWidth: 0 }}>
                        <div
                          className={cn(
                            "w-[9px] h-[9px] rounded-full",
                            hasSymptom
                              ? symptom.color
                              : "bg-muted-foreground/20"
                          )}
                          style={hasSymptom ? { opacity: Math.min(1, 0.5 + value * 0.17) } : {}}
                        />
                        {hasInj && (
                          <div className="absolute -top-[7px] w-[2.5px] h-[7px] bg-primary/70 rounded-full" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border/30 px-5 py-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}>
        <p className="text-sm font-bold text-foreground mb-2.5">Legenda</p>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-card rounded-full px-3 py-1.5 border border-border/50">
            <div className="w-[3px] h-3.5 bg-primary/70 rounded-full" />
            <span className="text-xs text-muted-foreground">Aplicação</span>
          </div>
          <div className="flex items-center gap-2 bg-card rounded-full px-3 py-1.5 border border-border/50">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="text-xs text-muted-foreground">Efeito</span>
          </div>
          <div className="flex items-center gap-2 bg-card rounded-full px-3 py-1.5 border border-border/50">
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="absolute -top-1.5 w-[3px] h-2 bg-primary/70 rounded-full" />
            </div>
            <span className="text-xs text-muted-foreground">Efeito + Aplic.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideEffectHistory;
