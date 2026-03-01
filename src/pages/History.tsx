import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Calendar, TrendingUp, Activity, Syringe } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

const periodFilters = ["7d", "30d", "90d", "Total"] as const;
type Period = (typeof periodFilters)[number];

const chartConfig = {
  peso: { label: "Peso (kg)", color: "hsl(162, 38%, 40%)" },
  nausea: { label: "Náusea", color: "hsl(12, 76%, 64%)" },
  fadiga: { label: "Fadiga", color: "hsl(38, 88%, 58%)" },
  energia: { label: "Energia", color: "hsl(215, 65%, 52%)" },
};

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");
  const [logs, setLogs] = useState<any[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const now = new Date();
      let since: Date | null = null;
      if (period === "7d") since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (period === "30d") since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      else if (period === "90d") since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      let logsQuery = supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: true });
      let injQuery = supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false });

      if (since) {
        const sinceStr = since.toISOString().split("T")[0];
        logsQuery = logsQuery.gte("date", sinceStr);
        injQuery = injQuery.gte("date", sinceStr);
      }

      const [logsRes, injRes] = await Promise.all([logsQuery, injQuery]);
      setLogs((logsRes.data as any[]) || []);
      setInjections((injRes.data as any[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user, period]);

  const weightData = logs.filter((l) => l.weight).map((l) => ({
    date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    peso: l.weight,
  }));

  const symptomData = logs.map((l) => ({
    date: new Date(l.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    nausea: l.symptom_nausea || 0,
    fadiga: l.symptom_fatigue || 0,
    energia: l.energy || 0,
  }));

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Histórico</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Seus registros ao longo do tempo</p>
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

      <div className="px-5 space-y-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-pulse h-48" />
            ))}
          </div>
        ) : (
          <>
            {/* Injections */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Syringe className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold">Aplicações ({injections.length})</h2>
              </div>
              {injections.length === 0 ? (
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 text-center">
                  <Syringe className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhuma aplicação registrada</p>
                </div>
              ) : (
                <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
                  {injections.slice(0, 5).map((inj, i) => (
                    <div key={inj.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 last:border-0">
                      <div className="relative flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full border-2 ${i === 0 ? "border-primary bg-primary/20" : "border-muted-foreground/30 bg-muted"}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{inj.dose}</p>
                          {inj.site && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{inj.site}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(inj.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Weight chart */}
            {weightData.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="text-base font-bold">Evolução do Peso</h2>
                </div>
                <div className="bg-card rounded-2xl shadow-card border border-border/50 p-4">
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
            )}

            {/* Symptoms chart */}
            {symptomData.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-warning" />
                  <h2 className="text-base font-bold">Sintomas</h2>
                </div>
                <div className="bg-card rounded-2xl shadow-card border border-border/50 p-4">
                  <ChartContainer config={chartConfig} className="h-[180px] w-full">
                    <BarChart data={symptomData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(200, 12%, 90%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 10]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="nausea" fill="hsl(12, 76%, 64%)" radius={[4, 4, 0, 0]} barSize={8} />
                      <Bar dataKey="fadiga" fill="hsl(38, 88%, 58%)" radius={[4, 4, 0, 0]} barSize={8} />
                      <Bar dataKey="energia" fill="hsl(215, 65%, 52%)" radius={[4, 4, 0, 0]} barSize={8} />
                    </BarChart>
                  </ChartContainer>
                  <div className="flex gap-4 mt-3">
                    {[
                      { label: "Náusea", color: "bg-secondary" },
                      { label: "Fadiga", color: "bg-warning" },
                      { label: "Energia", color: "bg-info" },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${l.color}`} />
                        <span className="text-[10px] text-muted-foreground">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Empty state */}
            {logs.length === 0 && injections.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">Nenhum registro ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Comece registrando seu primeiro dia!</p>
                <button
                  onClick={() => navigate("/registrar")}
                  className="mt-4 gradient-hero text-primary-foreground font-bold py-3 px-6 rounded-2xl text-sm shadow-elevated"
                >
                  Registrar agora
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;
