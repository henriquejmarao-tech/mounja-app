import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Scale, FileDown } from "lucide-react";
import { toast } from "sonner";
import HistoryHeader from "@/components/history/HistoryHeader";
import PeriodFilter, { type Period } from "@/components/history/PeriodFilter";
import JourneySummary from "@/components/history/JourneySummary";
import WeeklyComparison from "@/components/history/WeeklyComparison";
import WeightChart from "@/components/history/WeightChart";
import BodyCompositionChart from "@/components/history/BodyCompositionChart";

import WorkoutsSummary from "@/components/history/WorkoutsSummary";
import WeeklyNarrative from "@/components/history/WeeklyNarrative";
import InsightsList, { type Insight } from "@/components/history/InsightsList";
import SymptomsChart from "@/components/history/SymptomsChart";
import DailyScoreChart from "@/components/history/DailyScoreChart";

import ContextualHint from "@/components/tutorial/ContextualHint";

const periodDays: Record<Period, number | null> = { "7d": 7, "30d": 30, "90d": 90, Total: null };

const sanitize = (t: string | null): string => {
  if (!t) return "";
  return t.replace(/Ã©/g, "é").replace(/Ã£/g, "ã").replace(/Ã§/g, "ç")
    .replace(/Ã³/g, "ó").replace(/Ãº/g, "ú").replace(/Ã¡/g, "á")
    .replace(/Ã­/g, "í").replace(/Ãª/g, "ê").replace(/Ã´/g, "ô").trim();
};

const History = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [logs, setLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dietSuggestions, setDietSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const now = new Date();
    const days = periodDays[period];
    const since = days ? new Date(now.getTime() - days * 86400000) : null;

    let logsQuery = supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: true });
    let injQuery = supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false });
    let workoutsQuery = supabase.from("workouts").select("*").eq("user_id", user.id).order("date", { ascending: false });
    const allLogsQuery = supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30);
    let dietQuery = supabase.from("diet_suggestions").select("*").eq("user_id", user.id).order("date", { ascending: false });

    if (since) {
      const sinceStr = since.toISOString().split("T")[0];
      logsQuery = logsQuery.gte("date", sinceStr);
      injQuery = injQuery.gte("date", sinceStr);
      workoutsQuery = workoutsQuery.gte("date", sinceStr);
      dietQuery = dietQuery.gte("date", sinceStr);
    }

    const [logsRes, injRes, workoutsRes, allRes, dietRes] = await Promise.all([logsQuery, injQuery, workoutsQuery, allLogsQuery, dietQuery]);
    const l = (logsRes.data as any[]) || [];
    const inj = (injRes.data as any[]) || [];
    const wk = (workoutsRes.data as any[]) || [];
    const all = (allRes.data as any[]) || [];
    const diets = (dietRes.data as any[]) || [];
    setLogs(l);
    setInjections(inj);
    setWorkouts(wk);
    setAllLogs(all);
    setDietSuggestions(diets);
    generateInsights(all, inj);
    setLoading(false);
  }, [user, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateInsights = (allL: any[], allInj: any[]) => {
    const generated: Insight[] = [];
    const weights = allL.filter((l) => l.weight).map((l) => l.weight);

    if (weights.length >= 3) {
      const recent = weights.slice(0, 3);
      const trend = recent[0] - recent[recent.length - 1];
      if (trend < 0) {
        generated.push({ title: "Tendência de redução", description: `Perda de ${Math.abs(trend).toFixed(1)} kg nos últimos registros. Tendência favorável.`, type: "positive" });
      } else if (trend > 1) {
        generated.push({ title: "Aumento detectado", description: `Ganho de ${trend.toFixed(1)} kg recentemente. Recomenda-se revisar alimentação e hidratação.`, type: "warning" });
      }
    }

    if (allInj.length > 0 && allL.length > 0) {
      const lastInj = allInj[0];
      const logsAfterInj = allL.filter((l) => {
        const diff = (new Date(l.date).getTime() - new Date(lastInj.date).getTime()) / 86400000;
        return diff >= 0 && diff <= 2;
      });
      const avgNausea = logsAfterInj.length ? logsAfterInj.reduce((s: number, l: any) => s + (l.symptom_nausea || 0), 0) / logsAfterInj.length : 0;
      if (avgNausea >= 4) {
        generated.push({ title: "Náusea pós-aplicação", description: "Padrão de náusea elevada nas 48h após aplicação. Considere refeições leves nesse período.", type: "info" });
      }
    }

    const logsWithWorkout = allL.filter((l) => l.workout_type);
    const logsWithoutWorkout = allL.filter((l) => !l.workout_type);
    if (logsWithWorkout.length >= 3 && logsWithoutWorkout.length >= 3) {
      const avgE1 = logsWithWorkout.reduce((s: number, l: any) => s + (l.energy || 0), 0) / logsWithWorkout.length;
      const avgE2 = logsWithoutWorkout.reduce((s: number, l: any) => s + (l.energy || 0), 0) / logsWithoutWorkout.length;
      if (avgE1 > avgE2 + 1) {
        generated.push({ title: "Correlação treino-energia", description: `Nos dias com treino, seu nível de energia é ${avgE1.toFixed(1)} vs ${avgE2.toFixed(1)} sem treino.`, type: "positive" });
      }
    }

    const waterLogs = allL.filter((l) => l.water_ml);
    if (waterLogs.length >= 3) {
      const avgW = waterLogs.reduce((s: number, l: any) => s + l.water_ml, 0) / waterLogs.length;
      if (avgW < 1500) {
        generated.push({ title: "Hidratação insuficiente", description: `Média de ${Math.round(avgW)}ml/dia. Recomendado: 2.000ml.`, type: "warning" });
      }
    }

    setInsights(generated);
  };

  // ---- PDF Export (clinical format) ----
  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: "a4", unit: "mm" });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      const checkPage = (needed: number) => { if (y + needed > 275) { doc.addPage(); y = 20; } };

      const addLine = (text: string, size: number, bold = false, color: [number, number, number] = [30, 40, 45]) => {
        const clean = sanitize(text);
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(clean, pageW - 40);
        checkPage(lines.length * (size * 0.5));
        doc.text(lines, 20, y);
        y += lines.length * (size * 0.45) + 3;
      };
      const addSpacer = (h = 5) => { y += h; };
      const addDivider = () => { doc.setDrawColor(220, 220, 220); doc.line(20, y, pageW - 20, y); addSpacer(6); };

      // Period calculation
      const days = periodDays[period];
      const endDate = new Date();
      const startDate = days ? new Date(endDate.getTime() - days * 86400000) : (logs.length > 0 ? new Date(logs[0].date + "T12:00:00") : endDate);
      const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const periodLabel = days ? `Ultimos ${days} dias` : "Periodo total";

      // ---- HEADER ----
      addLine("Relatorio da Jornada", 18, true, [45, 120, 95]);
      addLine(profile?.name || "Usuario", 11, false, [80, 80, 80]);
      addLine(`Data de geracao: ${fmtDate(endDate)}`, 9, false, [130, 130, 130]);
      addLine(`${periodLabel}: ${fmtDate(startDate)} ate ${fmtDate(endDate)}`, 9, false, [130, 130, 130]);
      addSpacer(4);
      addDivider();

      // ---- 1. RESUMO DA JORNADA ----
      addLine("1. Resumo da Jornada", 13, true, [45, 120, 95]);
      addSpacer(2);
      if (initialWeight) addLine(`Peso inicial: ${initialWeight} kg`, 10);
      if (currentWeight) addLine(`Peso atual: ${currentWeight} kg`, 10);
      if (totalLost !== null && totalLost !== 0) {
        const pct = initialWeight ? ((totalLost / initialWeight) * 100).toFixed(1) : null;
        const sign = totalLost > 0 ? "-" : "+";
        addLine(`Variacao: ${sign}${Math.abs(totalLost).toFixed(1)} kg${pct ? ` (${sign}${Math.abs(Number(pct))}%)` : ""}`, 10, true, totalLost > 0 ? [45, 120, 95] : [180, 80, 60]);
      }
      if (profile?.current_dose) addLine(`Dose atual: ${profile.current_dose}`, 10);
      if (!initialWeight && !currentWeight) addLine("Dados insuficientes no periodo selecionado.", 9, false, [150, 150, 150]);
      addSpacer(4);
      addDivider();

      // ---- 2. EVOLUCAO DO PESO ----
      const wLogs = logs.filter((l) => l.weight);
      if (wLogs.length > 1) {
        addLine("2. Evolucao do Peso", 13, true, [45, 120, 95]);
        addSpacer(2);
        wLogs.forEach((l: any) => {
          addLine(`${fmtDate(new Date(l.date + "T12:00:00"))}  --  ${l.weight} kg`, 9, false, [80, 80, 80]);
        });
        addSpacer(4);
        addDivider();
      }

      // ---- 3. EVOLUCAO DE SINTOMAS ----
      const symptomLogs = logs.filter((l) => l.symptom_nausea !== null || l.symptom_fatigue !== null || l.symptom_headache !== null);
      if (symptomLogs.length > 1) {
        addLine("3. Evolucao de Sintomas", 13, true, [45, 120, 95]);
        addSpacer(2);
        addLine("Data             Nausea   Fadiga   Dor de cabeca", 8, true, [100, 100, 100]);
        symptomLogs.forEach((l: any) => {
          const d = fmtDate(new Date(l.date + "T12:00:00"));
          addLine(`${d}       ${l.symptom_nausea ?? "-"}        ${l.symptom_fatigue ?? "-"}        ${l.symptom_headache ?? "-"}`, 8, false, [80, 80, 80]);
        });
        addSpacer(4);
        addDivider();
      }

      // ---- 4. TREINOS NO PERIODO ----
      if (workouts.length > 0) {
        addLine("4. Treinos no Periodo", 13, true, [45, 120, 95]);
        addSpacer(2);
        const totalMin = workouts.reduce((s: number, w: any) => s + (w.duration_minutes || 0), 0);
        addLine(`Total: ${workouts.length} treino(s) | ${totalMin} minutos`, 10, true, [60, 60, 60]);
        addSpacer(2);
        workouts.forEach((w: any) => {
          addLine(`${fmtDate(new Date(w.date + "T12:00:00"))}  --  ${w.workout_type} (${w.duration_minutes}min, ${w.intensity})`, 9, false, [80, 80, 80]);
        });
        addSpacer(4);
        addDivider();
      }

      // ---- 5. APLICACOES NO PERIODO ----
      if (injections.length > 0) {
        addLine("5. Aplicacoes no Periodo", 13, true, [45, 120, 95]);
        addSpacer(2);
        injections.forEach((inj: any) => {
          addLine(`${fmtDate(new Date(inj.date + "T12:00:00"))}  --  ${inj.dose}${inj.site ? ` (${inj.site})` : ""}`, 9, false, [80, 80, 80]);
        });
        if (injections.length >= 2) {
          const dates = injections.map((i) => new Date(i.date + "T12:00:00").getTime()).sort((a, b) => a - b);
          const intervals: number[] = [];
          for (let i = 1; i < dates.length; i++) intervals.push(Math.round((dates[i] - dates[i - 1]) / 86400000));
          const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          addLine(`Intervalo medio entre aplicacoes: ${avg.toFixed(0)} dias`, 9, true, [60, 60, 60]);
        }
        addSpacer(4);
        addDivider();
      }

      // ---- 6. COMPOSICAO CORPORAL ----
      const bodyLogs = logs.filter((l) => l.waist_cm || l.hip_cm || l.body_fat_pct);
      if (bodyLogs.length > 0) {
        addLine("6. Composicao Corporal", 13, true, [45, 120, 95]);
        addSpacer(2);
        const first = bodyLogs[0];
        const last = bodyLogs[bodyLogs.length - 1];
        if (first.body_fat_pct && last.body_fat_pct) {
          const diff = last.body_fat_pct - first.body_fat_pct;
          addLine(`Gordura corporal: ${first.body_fat_pct}% -> ${last.body_fat_pct}% (${diff > 0 ? "+" : ""}${diff.toFixed(1)}%)`, 10, false, [80, 80, 80]);
        }
        if (first.waist_cm && last.waist_cm) {
          const diff = last.waist_cm - first.waist_cm;
          addLine(`Cintura: ${first.waist_cm} -> ${last.waist_cm} cm (${diff > 0 ? "+" : ""}${diff.toFixed(1)} cm)`, 10, false, [80, 80, 80]);
        }
        addSpacer(4);
        addDivider();
      }

      // ---- 7. SUGESTOES DE DIETA ----
      if (dietSuggestions.length > 0) {
        addLine("7. Sugestoes de Dieta Salvas", 13, true, [45, 120, 95]);
        addSpacer(2);
        dietSuggestions.slice(0, 10).forEach((d: any) => {
          addLine(fmtDate(new Date(d.date + "T12:00:00")), 10, true, [60, 60, 60]);
          if (d.breakfast) addLine(`  Cafe: ${sanitize(d.breakfast)}`, 8, false, [80, 80, 80]);
          if (d.lunch) addLine(`  Almoco: ${sanitize(d.lunch)}`, 8, false, [80, 80, 80]);
          if (d.dinner) addLine(`  Jantar: ${sanitize(d.dinner)}`, 8, false, [80, 80, 80]);
          if (d.snack) addLine(`  Lanche: ${sanitize(d.snack)}`, 8, false, [80, 80, 80]);
          if (d.calories_target || d.protein_target) {
            addLine(`  Meta: ${d.calories_target || "--"} kcal | ${d.protein_target || "--"}g proteina`, 8, true, [100, 100, 100]);
          }
          addSpacer(2);
        });
        addSpacer(4);
        addDivider();
      }

      // ---- 8. COMPARACAO COM PERIODO ANTERIOR ----
      if (days && logs.length >= 3) {
        const prevStart = new Date(startDate.getTime() - days * 86400000);
        const prevEnd = startDate;
        // Fetch prev period data inline is complex; use allLogs as proxy
        const prevLogs = allLogs.filter((l) => {
          const d = new Date(l.date + "T12:00:00");
          return d >= prevStart && d < prevEnd;
        });
        if (prevLogs.length >= 2) {
          addLine("8. Comparacao com Periodo Anterior", 13, true, [45, 120, 95]);
          addSpacer(2);

          const currWeights = logs.filter((l) => l.weight).map((l) => l.weight);
          const prevWeights = prevLogs.filter((l) => l.weight).map((l) => l.weight);
          if (currWeights.length && prevWeights.length) {
            const currAvg = currWeights.reduce((a: number, b: number) => a + b, 0) / currWeights.length;
            const prevAvg = prevWeights.reduce((a: number, b: number) => a + b, 0) / prevWeights.length;
            addLine(`Peso medio: ${prevAvg.toFixed(1)} kg -> ${currAvg.toFixed(1)} kg`, 9, false, [80, 80, 80]);
          }

          // Workout frequency
          const prevWorkouts = workouts.filter((w) => {
            const d = new Date(w.date + "T12:00:00");
            return d >= prevStart && d < prevEnd;
          });
          const currWk = workouts.filter((w) => {
            const d = new Date(w.date + "T12:00:00");
            return d >= startDate && d <= endDate;
          });
          addLine(`Treinos: ${prevWorkouts.length} -> ${currWk.length}`, 9, false, [80, 80, 80]);

          // Symptoms avg
          const avgSx = (arr: any[]) => arr.length ? arr.reduce((s: number, l: any) => s + (l.symptom_nausea || 0) + (l.symptom_fatigue || 0) + (l.symptom_headache || 0), 0) / (arr.length * 3) : null;
          const prevSx = avgSx(prevLogs);
          const currSx = avgSx(logs);
          if (prevSx !== null && currSx !== null) {
            addLine(`Sintomas (media): ${prevSx.toFixed(1)} -> ${currSx.toFixed(1)}`, 9, false, [80, 80, 80]);
          }

          addSpacer(4);
          addDivider();
        }
      }

      // ---- FOOTER ----
      checkPage(20);
      addLine("Este relatorio e de carater informativo e educacional.", 7, false, [160, 160, 160]);
      addLine("Nao substitui acompanhamento medico profissional.", 7, false, [160, 160, 160]);

      doc.save(`relatorio-jornada-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar o PDF.");
    }
  };

  // Derived data
  const initialWeight = profile?.current_weight;
  const weights = logs.filter((l) => l.weight);
  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const totalLost = initialWeight && currentWeight ? initialWeight - currentWeight : null;

  const now = new Date();
  const thisWeekLogs = allLogs.filter((l) => (now.getTime() - new Date(l.date + "T12:00:00").getTime()) / 86400000 <= 7);
  const lastWeekLogs = allLogs.filter((l) => {
    const diff = (now.getTime() - new Date(l.date + "T12:00:00").getTime()) / 86400000;
    return diff > 7 && diff <= 14;
  });

  const weightData = weights.map((l: any) => ({
    date: new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    peso: l.weight,
  }));

  const hasData = logs.length > 0 || injections.length > 0 || workouts.length > 0;

  return (
    <div className="min-h-screen bg-background pb-nav">
      <HistoryHeader />
      <PeriodFilter period={period} onChange={setPeriod} />

      <div data-tutorial="charts-area" className="px-5 space-y-4">
        <ContextualHint id="export-pdf" message="Você pode exportar seu relatório completo em PDF." />
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-pulse h-32" />
            ))}
          </div>
        ) : !hasData ? (
          <div className="text-center py-16">
            <Scale className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Sem dados registrados</p>
            <p className="text-xs text-muted-foreground mt-1">Registre seu primeiro dia para iniciar a análise.</p>
            <button onClick={() => navigate("/registrar")}
              className="mt-4 gradient-hero text-primary-foreground font-bold py-3 px-6 rounded-2xl text-sm shadow-elevated">
              Registrar agora
            </button>
          </div>
        ) : (
          <>
            <JourneySummary
              initialWeight={initialWeight}
              currentWeight={currentWeight}
              totalLost={totalLost}
              injectionCount={injections.length}
            />
            <DailyScoreChart
              logs={logs}
              profile={profile}
              lastInjectionDate={injections.length > 0 ? injections[0].date : null}
              intervalDays={(profile as any)?.application_interval_days || 7}
            />
            <WeightChart weightData={weightData} />
            <SymptomsChart logs={logs} />
            
            
            <WeeklyComparison thisWeekLogs={thisWeekLogs} lastWeekLogs={lastWeekLogs} />
            <WeeklyNarrative
              thisWeekLogs={thisWeekLogs}
              lastWeekLogs={lastWeekLogs}
              workouts={workouts}
              injections={injections}
            />
            <BodyCompositionChart logs={logs} />
            <WorkoutsSummary workouts={workouts} />
            <InsightsList insights={insights} />

            {/* Export PDF button */}
            <button
              data-tutorial="export-btn"
              onClick={handleExportPDF}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-4 rounded-2xl text-sm shadow-elevated mt-2"
            >
              <FileDown className="w-4 h-4" />
              Exportar Relatório PDF
            </button>

            {allLogs.length < 7 && (
              <div className="bg-muted/30 rounded-xl p-4 text-center border border-border/50 animate-fade-in-up" style={{ animationDelay: "360ms" }}>
                <p className="text-xs text-muted-foreground">
                  Registre pelo menos <span className="font-semibold text-foreground">7 dias</span> para ativar a análise de padrões e tendências.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;
