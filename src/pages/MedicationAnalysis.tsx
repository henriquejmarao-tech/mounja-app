import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, TrendingDown, TrendingUp, Minus,
  Activity, Pill, Dumbbell, Droplets, Moon, Utensils, Heart,
  AlertTriangle, CheckCircle2, Info, RefreshCw, Stethoscope,
} from "lucide-react";

interface AnalysisResult {
  overall_status: "excelente" | "bom" | "atenção" | "alerta";
  overall_summary: string;
  weight_analysis: {
    trend: "descendo" | "estável" | "subindo" | "insuficiente";
    summary: string;
    lost_kg?: number;
    weekly_avg_loss?: number;
  };
  symptom_analysis: {
    severity: "leve" | "moderado" | "intenso" | "sem_dados";
    summary: string;
    main_concern?: string;
  };
  dose_recommendation: {
    action: "manter" | "considerar_aumento" | "considerar_redução" | "avaliar_com_médico";
    reasoning: string;
  };
  behavioral_suggestions: {
    emoji: string;
    title: string;
    description: string;
    category: string;
  }[];
  medical_note: string;
}

const statusConfig = {
  excelente: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, label: "Excelente" },
  bom: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", icon: CheckCircle2, label: "Bom" },
  "atenção": { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: Info, label: "Atenção" },
  alerta: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle, label: "Alerta" },
};

const trendConfig = {
  descendo: { icon: TrendingDown, color: "text-emerald-600", label: "Em queda" },
  estável: { icon: Minus, color: "text-amber-600", label: "Estável" },
  subindo: { icon: TrendingUp, color: "text-red-500", label: "Subindo" },
  insuficiente: { icon: Minus, color: "text-muted-foreground", label: "Dados insuficientes" },
};

const doseActionConfig = {
  manter: { color: "text-emerald-600", bg: "bg-emerald-50", label: "Manter dose atual" },
  considerar_aumento: { color: "text-amber-600", bg: "bg-amber-50", label: "Considerar aumento" },
  considerar_redução: { color: "text-blue-600", bg: "bg-blue-50", label: "Considerar redução" },
  avaliar_com_médico: { color: "text-red-600", bg: "bg-red-50", label: "Avaliar com médico" },
};

const categoryIcons: Record<string, any> = {
  alimentação: Utensils,
  exercício: Dumbbell,
  hidratação: Droplets,
  sono: Moon,
  medicação: Pill,
  geral: Heart,
};

const MedicationAnalysis = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { dose } = useApplicationData();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("medication-analysis");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data);
      setHasGenerated(true);
    } catch (err: any) {
      console.error("Medication analysis error:", err);
      if (err?.message?.includes("Rate limit")) {
        toast.error("Muitas solicitações. Tente novamente em alguns segundos.");
      } else {
        toast.error("Erro ao gerar análise. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const status = result ? statusConfig[result.overall_status] : null;
  const trend = result ? trendConfig[result.weight_analysis.trend] : null;
  const doseAction = result ? doseActionConfig[result.dose_recommendation.action] : null;

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3 pt-safe">
          <button onClick={() => navigate(-1)} className="p-1 active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Análise de Medicação</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Current treatment summary */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{profile?.medication || "Mounjaro®"}</p>
              <p className="text-xs text-muted-foreground">
                {dose.currentDose ? `Dose: ${dose.currentDose}` : "Dose não configurada"}
                {profile?.mounjaro_start_date ? ` · Início: ${new Date(profile.mounjaro_start_date + "T12:00:00").toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Generate button */}
        {!result && (
          <button
            onClick={generateAnalysis}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-sm gradient-hero text-primary-foreground shadow-elevated active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 touch-manipulation disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Analisando seu tratamento...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                {hasGenerated ? "Gerar nova análise" : "Gerar análise completa"}
              </>
            )}
          </button>
        )}

        {/* Loading skeleton */}
        {loading && !result && (
          <div className="space-y-4 animate-fade-in">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 border border-border/50 animate-pulse" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="h-4 w-1/3 bg-muted rounded-lg mb-3" />
                <div className="h-3 w-full bg-muted/60 rounded-lg mb-2" />
                <div className="h-3 w-2/3 bg-muted/40 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-fade-in">
            {/* Overall status */}
            {status && (
              <div className={`rounded-2xl p-5 border ${status.border} ${status.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                  <status.icon className={`w-5 h-5 ${status.color}`} />
                  <span className={`text-sm font-bold ${status.color}`}>{status.label}</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{result.overall_summary}</p>
              </div>
            )}

            {/* Weight analysis */}
            {trend && (
              <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-foreground">Evolução de Peso</h3>
                  <div className="flex items-center gap-1.5">
                    <trend.icon className={`w-4 h-4 ${trend.color}`} />
                    <span className={`text-xs font-semibold ${trend.color}`}>{trend.label}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.weight_analysis.summary}</p>
                {(result.weight_analysis.lost_kg != null || result.weight_analysis.weekly_avg_loss != null) && (
                  <div className="flex gap-3 mt-3">
                    {result.weight_analysis.lost_kg != null && (
                      <div className="flex-1 bg-muted/30 rounded-xl p-3 text-center">
                        <p className="text-lg font-extrabold text-foreground">{result.weight_analysis.lost_kg}kg</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Perdidos</p>
                      </div>
                    )}
                    {result.weight_analysis.weekly_avg_loss != null && (
                      <div className="flex-1 bg-muted/30 rounded-xl p-3 text-center">
                        <p className="text-lg font-extrabold text-foreground">{result.weight_analysis.weekly_avg_loss}kg</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Média/semana</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Symptom analysis */}
            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Análise de Sintomas</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  result.symptom_analysis.severity === "leve" ? "bg-emerald-50 text-emerald-600" :
                  result.symptom_analysis.severity === "moderado" ? "bg-amber-50 text-amber-600" :
                  result.symptom_analysis.severity === "intenso" ? "bg-red-50 text-red-500" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {result.symptom_analysis.severity === "sem_dados" ? "Sem dados" : result.symptom_analysis.severity}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{result.symptom_analysis.summary}</p>
              {result.symptom_analysis.main_concern && (
                <div className="mt-3 bg-amber-50 rounded-xl p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">{result.symptom_analysis.main_concern}</p>
                </div>
              )}
            </div>

            {/* Dose recommendation */}
            {doseAction && (
              <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-foreground" />
                  <h3 className="text-sm font-bold text-foreground">Recomendação de Dose</h3>
                </div>
                <div className={`rounded-xl p-3 mb-3 ${doseAction.bg}`}>
                  <p className={`text-sm font-bold ${doseAction.color}`}>{doseAction.label}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{result.dose_recommendation.reasoning}</p>
              </div>
            )}

            {/* Behavioral suggestions */}
            {result.behavioral_suggestions.length > 0 && (
              <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
                <h3 className="text-sm font-bold text-foreground mb-3">Sugestões para você</h3>
                <div className="space-y-3">
                  {result.behavioral_suggestions.map((s, i) => {
                    const CatIcon = categoryIcons[s.category] || Heart;
                    return (
                      <div key={i} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-sm">{s.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{s.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Medical note */}
            {result.medical_note && (
              <div className="bg-muted/50 rounded-2xl p-4 border border-border/30 flex items-start gap-3">
                <Stethoscope className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{result.medical_note}</p>
              </div>
            )}

            {/* Regenerate */}
            <button
              onClick={() => { setResult(null); generateAnalysis(); }}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl font-bold text-sm bg-card border border-border/50 text-foreground shadow-card active:scale-[0.98] transition-all flex items-center justify-center gap-2 touch-manipulation disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Gerar nova análise
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationAnalysis;
