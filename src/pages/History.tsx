import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import HistoryHeader from "@/components/history/HistoryHeader";
import PeriodFilter, { type Period } from "@/components/history/PeriodFilter";
import JourneySummary from "@/components/history/JourneySummary";
import WeeklyComparison from "@/components/history/WeeklyComparison";
import WeightChart from "@/components/history/WeightChart";
import BodyCompositionChart from "@/components/history/BodyCompositionChart";
import DoseTimeline from "@/components/history/DoseTimeline";
import WorkoutsSummary from "@/components/history/WorkoutsSummary";
import WeeklyNarrative from "@/components/history/WeeklyNarrative";
import InsightsList, { type Insight } from "@/components/history/InsightsList";

const History = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [logs, setLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const now = new Date();
      let since: Date | null = null;
      if (period === "7d") since = new Date(now.getTime() - 7 * 86400000);
      else if (period === "30d") since = new Date(now.getTime() - 30 * 86400000);
      else if (period === "90d") since = new Date(now.getTime() - 90 * 86400000);

      let logsQuery = supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: true });
      let injQuery = supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false });
      let workoutsQuery = supabase.from("workouts").select("*").eq("user_id", user.id).order("date", { ascending: false });
      const allLogsQuery = supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30);

      if (since) {
        const sinceStr = since.toISOString().split("T")[0];
        logsQuery = logsQuery.gte("date", sinceStr);
        injQuery = injQuery.gte("date", sinceStr);
        workoutsQuery = workoutsQuery.gte("date", sinceStr);
      }

      const [logsRes, injRes, workoutsRes, allRes] = await Promise.all([logsQuery, injQuery, workoutsQuery, allLogsQuery]);
      const l = (logsRes.data as any[]) || [];
      const inj = (injRes.data as any[]) || [];
      const wk = (workoutsRes.data as any[]) || [];
      const all = (allRes.data as any[]) || [];
      setLogs(l);
      setInjections(inj);
      setWorkouts(wk);
      setAllLogs(all);
      generateInsights(all, inj);
      setLoading(false);
    };
    fetchData();
  }, [user, period]);

  const generateInsights = (allL: any[], allInj: any[]) => {
    const generated: Insight[] = [];
    const weights = allL.filter((l) => l.weight).map((l) => l.weight);

    if (weights.length >= 3) {
      const recent = weights.slice(0, 3);
      const trend = recent[0] - recent[recent.length - 1];
      if (trend < 0) {
        generated.push({ title: "Peso em queda", description: `Você perdeu ${Math.abs(trend).toFixed(1)} kg nos últimos registros. Continue assim!`, type: "positive" });
      } else if (trend > 1) {
        generated.push({ title: "Peso subindo", description: `Ganho de ${trend.toFixed(1)} kg recentemente. Revise alimentação e hidratação.`, type: "warning" });
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
        generated.push({ title: "Náusea pós-aplicação", description: "Você costuma sentir mais náusea nas 48h após a aplicação. Tente refeições leves nesse período.", type: "info" });
      }
    }

    const logsWithWorkout = allL.filter((l) => l.workout_type);
    const logsWithoutWorkout = allL.filter((l) => !l.workout_type);
    if (logsWithWorkout.length >= 3 && logsWithoutWorkout.length >= 3) {
      const avgE1 = logsWithWorkout.reduce((s: number, l: any) => s + (l.energy || 0), 0) / logsWithWorkout.length;
      const avgE2 = logsWithoutWorkout.reduce((s: number, l: any) => s + (l.energy || 0), 0) / logsWithoutWorkout.length;
      if (avgE1 > avgE2 + 1) {
        generated.push({ title: "Treino aumenta sua energia", description: `Nos dias que você treina, sua energia é ${avgE1.toFixed(1)} vs ${avgE2.toFixed(1)} sem treino.`, type: "positive" });
      }
    }

    const waterLogs = allL.filter((l) => l.water_ml);
    if (waterLogs.length >= 3) {
      const avgW = waterLogs.reduce((s: number, l: any) => s + l.water_ml, 0) / waterLogs.length;
      if (avgW < 1500) {
        generated.push({ title: "Hidratação baixa", description: `Sua média de água é ${Math.round(avgW)}ml/dia. Tente chegar a 2L — ajuda a reduzir efeitos colaterais.`, type: "warning" });
      }
    }

    setInsights(generated);
  };

  // PDF export
  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ format: "a4", unit: "mm" });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 20;

      const addLine = (text: string, size: number, bold = false, color: [number, number, number] = [30, 40, 45]) => {
        doc.setFontSize(size);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, pageW - 40);
        if (y + lines.length * (size * 0.5) > 270) { doc.addPage(); y = 20; }
        doc.text(lines, 20, y);
        y += lines.length * (size * 0.45) + 3;
      };
      const addSpacer = (h = 5) => { y += h; };

      addLine("Relatório da Jornada", 18, true, [45, 120, 95]);
      addLine(profile?.name || "Usuário", 11, false, [120, 120, 120]);
      addLine(`Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, 9, false, [150, 150, 150]);
      addSpacer(8);
      doc.setDrawColor(220, 220, 220);
      doc.line(20, y, pageW - 20, y);
      addSpacer(8);

      addLine("Resumo", 14, true);
      if (initialWeight) addLine(`Peso inicial: ${initialWeight} kg`, 10);
      if (currentWeight) addLine(`Peso atual: ${currentWeight} kg`, 10);
      if (totalLost !== null && totalLost > 0) addLine(`Total perdido: ${totalLost.toFixed(1)} kg`, 10, true, [45, 120, 95]);
      if (profile?.current_dose) addLine(`Dose atual: ${profile.current_dose}`, 10);
      addSpacer(6);

      const wLogs = logs.filter((l) => l.weight);
      if (wLogs.length > 0) {
        addLine("Evolução do Peso", 14, true);
        wLogs.forEach((l: any) => {
          addLine(`${new Date(l.date).toLocaleDateString("pt-BR")}  —  ${l.weight} kg`, 9, false, [80, 80, 80]);
        });
        addSpacer(6);
      }

      if (workouts.length > 0) {
        addLine("Treinos no Período", 14, true);
        workouts.forEach((w: any) => {
          addLine(`${new Date(w.date).toLocaleDateString("pt-BR")}  —  ${w.workout_type} (${w.duration_minutes}min, ${w.intensity})`, 9, false, [80, 80, 80]);
        });
        addSpacer(6);
      }

      if (injections.length > 0) {
        addLine("Histórico de Aplicações", 14, true);
        injections.forEach((inj: any) => {
          const dateStr = new Date(inj.date).toLocaleDateString("pt-BR");
          addLine(`${dateStr}  —  ${inj.dose}${inj.site ? ` (${inj.site})` : ""}`, 9, false, [80, 80, 80]);
        });
        addSpacer(6);
      }

      if (insights.length > 0) {
        addLine("Insights Detectados", 14, true);
        insights.forEach((ins) => {
          addLine(`• ${ins.title}`, 10, true, [60, 60, 60]);
          addLine(ins.description, 9, false, [100, 100, 100]);
          addSpacer(2);
        });
        addSpacer(6);
      }

      doc.setDrawColor(220, 220, 220);
      doc.line(20, y, pageW - 20, y);
      addSpacer(4);
      addLine("Este relatório é de caráter informativo e educacional. Não substitui acompanhamento médico.", 7, false, [160, 160, 160]);

      doc.save(`relatorio-jornada-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF gerado com sucesso! 📄");
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
  const thisWeekLogs = allLogs.filter((l) => (now.getTime() - new Date(l.date).getTime()) / 86400000 <= 7);
  const lastWeekLogs = allLogs.filter((l) => {
    const diff = (now.getTime() - new Date(l.date).getTime()) / 86400000;
    return diff > 7 && diff <= 14;
  });

  const weightData = weights.map((l: any) => ({
    date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    peso: l.weight,
  }));

  const hasData = logs.length > 0 || injections.length > 0 || workouts.length > 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      <HistoryHeader showExport={!loading && hasData} onExport={handleExportPDF} />
      <PeriodFilter period={period} onChange={setPeriod} />

      <div className="px-5 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-pulse h-32" />
            ))}
          </div>
        ) : !hasData ? (
          <div className="text-center py-16">
            <Scale className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">Nenhum registro ainda</p>
            <p className="text-xs text-muted-foreground mt-1">Comece registrando seu primeiro dia!</p>
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
            <WeeklyComparison thisWeekLogs={thisWeekLogs} lastWeekLogs={lastWeekLogs} />
            <WeeklyNarrative
              thisWeekLogs={thisWeekLogs}
              lastWeekLogs={lastWeekLogs}
              workouts={workouts}
              injections={injections}
            />
            <WeightChart weightData={weightData} />
            <BodyCompositionChart logs={logs} />
            <WorkoutsSummary workouts={workouts} />
            <DoseTimeline injections={injections} />
            <InsightsList insights={insights} />

            {allLogs.length < 7 && (
              <div className="bg-muted/50 rounded-2xl p-4 text-center animate-fade-in-up" style={{ animationDelay: "360ms" }}>
                <p className="text-xs text-muted-foreground">
                  📊 Registre pelo menos <span className="font-semibold text-foreground">7 dias</span> para ver insights personalizados sobre sua jornada.
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
