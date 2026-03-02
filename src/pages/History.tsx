import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, TrendingDown, TrendingUp, Sparkles, AlertTriangle, Syringe, Scale, Droplets, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";

const periodFilters = ["7d", "30d", "90d", "Total"] as const;
type Period = (typeof periodFilters)[number];

interface Insight {
  title: string;
  description: string;
  type: "positive" | "warning" | "info";
}

const chartConfig = {
  peso: { label: "Peso (kg)", color: "hsl(162, 38%, 40%)" },
};

const History = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [logs, setLogs] = useState<any[]>([]);
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
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
      const allLogsQuery = supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30);

      if (since) {
        const sinceStr = since.toISOString().split("T")[0];
        logsQuery = logsQuery.gte("date", sinceStr);
        injQuery = injQuery.gte("date", sinceStr);
      }

      const [logsRes, injRes, allRes] = await Promise.all([logsQuery, injQuery, allLogsQuery]);
      const l = (logsRes.data as any[]) || [];
      const inj = (injRes.data as any[]) || [];
      const all = (allRes.data as any[]) || [];
      setLogs(l);
      setInjections(inj);
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
        if (y + lines.length * (size * 0.5) > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(lines, 20, y);
        y += lines.length * (size * 0.45) + 3;
      };

      const addSpacer = (h = 5) => { y += h; };

      // Header
      addLine("Relatório da Jornada", 18, true, [45, 120, 95]);
      addLine(profile?.name || "Usuário", 11, false, [120, 120, 120]);
      addLine(`Gerado em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`, 9, false, [150, 150, 150]);
      addSpacer(8);

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.line(20, y, pageW - 20, y);
      addSpacer(8);

      // Summary
      addLine("Resumo", 14, true);
      if (initialWeight) addLine(`Peso inicial: ${initialWeight} kg`, 10);
      if (currentWeight) addLine(`Peso atual: ${currentWeight} kg`, 10);
      if (totalLost !== null && totalLost > 0) addLine(`Total perdido: ${totalLost.toFixed(1)} kg`, 10, true, [45, 120, 95]);
      if (profile?.current_dose) addLine(`Dose atual: ${profile.current_dose}`, 10);
      addSpacer(6);

      // Weight history
      const wLogs = logs.filter((l) => l.weight);
      if (wLogs.length > 0) {
        addLine("Evolução do Peso", 14, true);
        wLogs.forEach((l: any) => {
          addLine(`${new Date(l.date).toLocaleDateString("pt-BR")}  —  ${l.weight} kg`, 9, false, [80, 80, 80]);
        });
        addSpacer(6);
      }

      // Injections
      if (injections.length > 0) {
        addLine("Histórico de Aplicações", 14, true);
        injections.forEach((inj: any) => {
          const dateStr = new Date(inj.date).toLocaleDateString("pt-BR");
          addLine(`${dateStr}  —  ${inj.dose}${inj.site ? ` (${inj.site})` : ""}`, 9, false, [80, 80, 80]);
        });
        addSpacer(6);
      }

      // Insights
      if (insights.length > 0) {
        addLine("Insights Detectados", 14, true);
        insights.forEach((ins) => {
          addLine(`• ${ins.title}`, 10, true, [60, 60, 60]);
          addLine(ins.description, 9, false, [100, 100, 100]);
          addSpacer(2);
        });
        addSpacer(6);
      }

      // Footer
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

  // Narrative data
  const initialWeight = profile?.current_weight;
  const weights = logs.filter((l) => l.weight);
  const currentWeight = weights.length > 0 ? weights[weights.length - 1].weight : null;
  const firstLogWeight = weights.length > 0 ? weights[0].weight : null;
  const totalLost = initialWeight && currentWeight ? initialWeight - currentWeight : null;

  // Weekly comparison
  const now = new Date();
  const thisWeekLogs = allLogs.filter((l) => {
    const diff = (now.getTime() - new Date(l.date).getTime()) / 86400000;
    return diff <= 7;
  });
  const lastWeekLogs = allLogs.filter((l) => {
    const diff = (now.getTime() - new Date(l.date).getTime()) / 86400000;
    return diff > 7 && diff <= 14;
  });

  const avgSymptom = (arr: any[]) => {
    if (arr.length === 0) return null;
    return arr.reduce((s, l) => s + (l.symptom_nausea || 0) + (l.symptom_fatigue || 0) + (l.symptom_headache || 0), 0) / (arr.length * 3);
  };
  const thisWeekSymptoms = avgSymptom(thisWeekLogs);
  const lastWeekSymptoms = avgSymptom(lastWeekLogs);

  const weightData = weights.map((l: any) => ({
    date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    peso: l.weight,
  }));

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive": return <TrendingDown className="w-4 h-4 text-primary" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      default: return <Sparkles className="w-4 h-4 text-info" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case "positive": return "border-primary/15 bg-primary/5";
      case "warning": return "border-warning/15 bg-warning/5";
      default: return "border-info/15 bg-info/5";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </button>
            {!loading && (logs.length > 0 || injections.length > 0) && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 text-primary-foreground/80 bg-primary-foreground/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-primary-foreground/10 text-xs font-semibold"
              >
                <FileDown className="w-3.5 h-3.5" />
                Exportar PDF
              </button>
            )}
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">Sua Jornada</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Acompanhe sua evolução ao longo do tempo</p>
        </div>
      </header>

      {/* Period filters */}
      <div className="px-5 -mt-3 mb-4 relative z-10">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-1.5 flex gap-1">
          {periodFilters.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn("flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300",
                period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}>
              {p === "Total" ? p : p.replace("d", " dias")}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-pulse h-32" />
            ))}
          </div>
        ) : logs.length === 0 && injections.length === 0 ? (
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
            {/* Narrative card */}
            <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-primary-foreground" />
                </div>
                <h2 className="font-bold text-sm">Resumo da Jornada</h2>
              </div>
              <div className="space-y-2.5">
                {initialWeight && (
                  <p className="text-sm text-muted-foreground">
                    Você começou com <span className="font-bold text-foreground">{initialWeight} kg</span>.
                  </p>
                )}
                {currentWeight && (
                  <p className="text-sm text-muted-foreground">
                    Hoje está com <span className="font-bold text-foreground">{currentWeight} kg</span>.
                  </p>
                )}
                {totalLost !== null && totalLost > 0 && (
                  <p className="text-sm font-semibold text-primary">
                    Já perdeu {totalLost.toFixed(1)} kg! 🎉
                  </p>
                )}
                {totalLost !== null && totalLost <= 0 && currentWeight && (
                  <p className="text-sm text-muted-foreground">
                    Continue registrando — cada dia conta para entender seu progresso.
                  </p>
                )}
                {injections.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {injections.length} {injections.length === 1 ? "aplicação registrada" : "aplicações registradas"} no período.
                  </p>
                )}
              </div>
            </div>

            {/* Weekly comparison */}
            {thisWeekLogs.length > 0 && lastWeekLogs.length > 0 && (
              <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
                <h3 className="font-bold text-sm mb-3">Comparação semanal</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Weight comparison */}
                  {(() => {
                    const thisW = thisWeekLogs.find((l: any) => l.weight)?.weight;
                    const lastW = lastWeekLogs.find((l: any) => l.weight)?.weight;
                    if (!thisW || !lastW) return null;
                    const diff = thisW - lastW;
                    return (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1">Peso</p>
                        <p className="text-lg font-bold">{thisW} kg</p>
                        <p className={cn("text-[11px] font-semibold", diff <= 0 ? "text-primary" : "text-secondary")}>
                          {diff <= 0 ? "" : "+"}{diff.toFixed(1)} kg vs semana anterior
                        </p>
                      </div>
                    );
                  })()}
                  {/* Symptoms comparison */}
                  {thisWeekSymptoms !== null && lastWeekSymptoms !== null && (
                    <div>
                      <p className="text-[10px] text-muted-foreground mb-1">Sintomas (média)</p>
                      <p className="text-lg font-bold">{thisWeekSymptoms.toFixed(1)}</p>
                      <p className={cn("text-[11px] font-semibold", thisWeekSymptoms <= lastWeekSymptoms ? "text-primary" : "text-secondary")}>
                        {thisWeekSymptoms <= lastWeekSymptoms ? "Melhorando ✨" : "Mais intensos"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weight chart */}
            {weightData.length > 1 && (
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-primary" /> Evolução do Peso
                </h3>
                <ChartContainer config={chartConfig} className="h-[160px] w-full">
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
            )}

            {/* Dose timeline */}
            {injections.length > 0 && (
              <div className="bg-card rounded-2xl shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
                <div className="p-4 pb-2">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-primary" /> Linha do tempo de doses
                  </h3>
                </div>
                <div className="px-4 pb-4">
                  {injections.slice(0, 6).map((inj: any, i: number) => (
                    <div key={inj.id} className="flex gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-3 h-3 rounded-full border-2 mt-1.5", i === 0 ? "border-primary bg-primary/20" : "border-muted-foreground/30 bg-muted")} />
                        {i < Math.min(injections.length, 6) - 1 && <div className="w-px flex-1 bg-border my-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-semibold">{inj.dose}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(inj.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                          {inj.site && <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{inj.site}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inline insights */}
            {insights.length > 0 && (
              <div className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm">O que seus dados mostram</h3>
                </div>
                <div className="space-y-3">
                  {insights.map((insight, i) => (
                    <div key={i} className={cn("rounded-2xl p-4 border shadow-card", getInsightBg(insight.type))}>
                      <div className="flex items-center gap-2 mb-1.5">
                        {getInsightIcon(insight.type)}
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Min data notice */}
            {allLogs.length < 7 && (
              <div className="bg-muted/50 rounded-2xl p-4 text-center animate-fade-in-up" style={{ animationDelay: "300ms" }}>
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
