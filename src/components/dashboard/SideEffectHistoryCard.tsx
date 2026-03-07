import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronRight } from "lucide-react";
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

const SideEffectHistoryCard = ({ selectedDate }: { selectedDate?: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState<DayData[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const cutoff = thirtyDaysAgo.toISOString().split("T")[0];

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

    // Build 30 days
    const result: DayData[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(thirtyDaysAgo.getDate() + i);
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Only show symptoms that have at least one occurrence
  const activeSymptoms = symptomDefs.filter((s) =>
    days.some((d) => (d.symptoms[s.key] || 0) > 0)
  );

  if (activeSymptoms.length === 0 && days.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Histórico de efeitos</h2>
        <button
          onClick={() => navigate("/progress")}
          className="text-xs text-primary font-semibold flex items-center gap-0.5"
        >
          Ver todos <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeSymptoms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum efeito colateral registrado ainda
        </p>
      ) : (
        <div className="space-y-4">
          {activeSymptoms.slice(0, 4).map((symptom) => (
            <div key={symptom.key}>
              <p className="text-sm font-semibold text-foreground mb-2">{symptom.label}</p>
              <div className="flex gap-[2px] items-center overflow-hidden">
                {days.map((day) => {
                  const value = day.symptoms[symptom.key] || 0;
                  const hasSymptom = value > 0;
                  const hasInj = day.hasInjection;

                  return (
                    <div key={day.date} className="relative flex flex-col items-center" style={{ flex: 1 }}>
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all",
                          hasSymptom ? symptom.color : "bg-muted/50",
                          selectedDate === day.date && "ring-2 ring-primary ring-offset-1 ring-offset-card"
                        )}
                        style={hasSymptom ? { opacity: Math.min(1, 0.4 + value * 0.15) } : {}}
                      />
                      {hasInj && (
                        <div className="absolute -top-1.5 w-0.5 h-1.5 bg-primary/60 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>
              {symptom !== activeSymptoms[activeSymptoms.length - 1] && (
                <div className="border-b border-border/30 mt-3" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="border-t border-border/30 mt-4 pt-3 flex gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3 bg-primary/60 rounded-full" />
          Aplicação
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Efeito
        </div>
      </div>
    </div>
  );
};

export default SideEffectHistoryCard;
