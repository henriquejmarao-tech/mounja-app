import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { Stethoscope, RefreshCw, ChevronDown, HeartPulse, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Recommendation {
  emoji: string;
  title: string;
  text: string;
}

const SymptomInsightsCard = () => {
  const navigate = useNavigate();
  const { dose, recentSymptoms } = useApplicationData();
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const hasSymptoms =
    recentSymptoms.nausea > 0 ||
    recentSymptoms.fatigue > 0 ||
    recentSymptoms.headache > 0 ||
    recentSymptoms.constipation > 0 ||
    recentSymptoms.diarrhea > 0;

  const daysSinceInjection = dose.lastApplicationAt
    ? Math.floor((Date.now() - new Date(dose.lastApplicationAt).getTime()) / 86400000)
    : null;

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-insights", {
        body: {
          symptoms: recentSymptoms,
          daysSinceInjection,
          currentDose: dose.currentDose,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.recommendations) {
        setRecommendations(data.recommendations.slice(0, 3));
        setSummary(data.summary || null);
      }
    } catch (e) {
      console.error("Symptom insights error:", e);
      toast.error("Não foi possível gerar análise dos sintomas.");
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [recentSymptoms, daysSinceInjection, dose.currentDose]);

  useEffect(() => {
    if (hasSymptoms && !fetched) {
      fetchInsights();
    }
  }, [hasSymptoms, fetched, fetchInsights]);

  return (
    <div
      className="rounded-[20px] animate-fade-in-up overflow-hidden"
      style={{ animationDelay: "120ms", background: "hsl(var(--card))", boxShadow: "var(--shadow-card)" }}
    >
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[10px] flex items-center justify-center bg-primary/8">
            <Stethoscope className="w-[18px] h-[18px] text-primary" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/55">
            Sintomas
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {!loading && recommendations && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFetched(false);
                setRecommendations(null);
                setSummary(null);
                setTimeout(() => fetchInsights(), 50);
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-muted-foreground/50" />
            </button>
          )}
          <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", expanded && "rotate-180")} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in-up">
          {/* AI Insights — above the register CTA */}
          {!hasSymptoms ? (
            <p className="text-xs text-muted-foreground/50 leading-relaxed mb-3">
              Registre seus sintomas no check-in para receber recomendações personalizadas com IA.
            </p>
          ) : (
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/45 mb-2.5">
                O que seus sintomas sugerem?
              </p>

              <div className="space-y-2.5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl px-3.5 py-3 bg-muted/30">
                      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-28" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))
                ) : recommendations ? (
                  recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-xl px-3.5 py-3 bg-primary/[0.04] border border-primary/10"
                    >
                      <span className="text-lg mt-0.5 shrink-0">{rec.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground/80">{rec.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{rec.text}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground/50">Erro ao carregar. Tente novamente.</p>
                )}
              </div>

              {!loading && recommendations && (
                <p className="text-[10px] text-muted-foreground mt-2.5 text-center opacity-50">
                  Análise gerada por IA · baseada nos seus registros recentes
                </p>
              )}
            </div>
          )}

          {/* Register symptoms CTA — below insights */}
          <button
            onClick={() => navigate("/registrar", { state: { focusSymptoms: true } })}
            className="w-full rounded-xl p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-all duration-200 group bg-primary/[0.04] border border-primary/10"
          >
            <div className="w-7 h-7 rounded-[10px] bg-primary/10 flex items-center justify-center shrink-0">
              <HeartPulse className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground/80">Mudanças nos sintomas?</p>
              <p className="text-[11px] text-muted-foreground/55 mt-0.5">Registre aqui</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-primary/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SymptomInsightsCard;
