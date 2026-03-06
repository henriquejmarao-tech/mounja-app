import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, localDateStr } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown, Calendar, Target } from "lucide-react";

type Period = "30d" | "90d" | "180d" | "all";

const ProgressPage = () => {
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [weightData, setWeightData] = useState<{ date: string; peso: number; label: string }[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const periodDays: Record<Period, number | null> = { "30d": 30, "90d": 90, "180d": 180, all: null };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const days = periodDays[period];
    const since = days ? localDateStr(new Date(Date.now() - days * 86400000)) : undefined;

    let logsQ = supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).not("weight", "is", null).order("date", { ascending: true });
    let injQ = supabase.from("injections").select("date, dose").eq("user_id", user.id).order("date", { ascending: false });

    if (since) {
      logsQ = logsQ.gte("date", since);
      injQ = injQ.gte("date", since);
    }

    const [logsRes, injRes] = await Promise.all([logsQ, injQ]);
    const logs = (logsRes.data as any[]) || [];
    const inj = (injRes.data as any[]) || [];

    setWeightData(
      logs.map((l) => ({
        date: l.date,
        peso: Number(l.weight),
        label: new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }))
    );
    setInjections(inj);
    setLoading(false);
  }, [user, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const initialWeight = profile?.current_weight;
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].peso : null;
  const goalWeight = profile?.goal ? parseFloat(profile.goal) : null;
  const totalLost = initialWeight && currentWeight ? initialWeight - Number(currentWeight) : null;

  const startDate = profile?.mounjaro_start_date ? new Date(profile.mounjaro_start_date + "T12:00:00") : null;
  const daysOnTreatment = startDate ? Math.floor((Date.now() - startDate.getTime()) / 86400000) : null;

  const periods: { value: Period; label: string }[] = [
    { value: "30d", label: "30 dias" },
    { value: "90d", label: "90 dias" },
    { value: "180d", label: "180 dias" },
    { value: "all", label: "Tudo" },
  ];

  return (
    <div className="min-h-screen pb-nav bg-background">
      <div className="px-6 pt-safe pb-2">
        <h1 className="text-2xl font-bold text-foreground">Progresso</h1>
        <p className="text-sm text-muted-foreground">Acompanhe sua evolução</p>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground">Peso inicial</p>
            <p className="text-xl font-bold text-foreground">{initialWeight ?? "—"}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground">Peso atual</p>
            <p className="text-xl font-bold text-primary">{currentWeight?.toFixed(1) ?? "—"}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground">Objetivo</p>
            <p className="text-xl font-bold text-foreground">{goalWeight ?? "—"}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground">Dias no tratamento</p>
            <p className="text-xl font-bold text-foreground">{daysOnTreatment ?? "—"}</p>
          </div>
        </div>

        {/* Total lost banner */}
        {totalLost !== null && totalLost > 0 && (
          <div className="bg-primary/10 rounded-2xl p-4 flex items-center gap-3 animate-fade-in-up border border-primary/20">
            <TrendingDown className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm font-bold text-primary">-{totalLost.toFixed(1)} kg perdidos</p>
              <p className="text-xs text-primary/70">Desde o início do tratamento</p>
            </div>
          </div>
        )}

        {/* Period filter */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Weight chart */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Evolução do peso</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : weightData.length >= 2 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} tickLine={false} axisLine={false} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 13%, 91%)",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Line type="monotone" dataKey="peso" stroke="hsl(168, 56%, 42%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(168, 56%, 42%)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              <p>Registre seu peso para ver o gráfico</p>
            </div>
          )}
        </div>

        {/* Injection timeline */}
        {injections.length > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Histórico de aplicações</p>
            <div className="space-y-3">
              {injections.slice(0, 10).map((inj, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">{inj.dose}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(inj.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
