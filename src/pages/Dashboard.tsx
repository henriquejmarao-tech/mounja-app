import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell, Shield, Star, TrendingUp, Syringe, Droplets,
  AlertTriangle, Target, Sparkles, ChevronRight, Plus, Activity
} from "lucide-react";
import InsightCard from "@/components/InsightCard";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [injections, setInjections] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [inj, logs] = await Promise.all([
        supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(10),
        supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(7),
      ]);
      setInjections((inj.data as any[]) || []);
      setRecentLogs((logs.data as any[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const firstName = profile?.name?.split(" ")[0] || "Usuário";
  const currentDose = profile?.current_dose || "—";
  const applicationDay = profile?.application_day || "—";
  const hasSideEffects = (profile?.common_side_effects as string[])?.length > 0;
  const hasNausea = (profile?.common_side_effects as string[])?.includes("Náusea");
  const isLowActivity = profile?.activity_level === "sedentary";
  const isWeightLossGoal = profile?.goal === "weight_loss";

  // Calculate days until next application
  const lastInjection = injections[0];
  const daysUntilNext = lastInjection
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(lastInjection.date).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Calculate week number
  const startDate = profile?.mounjaro_start_date;
  const weekNumber = startDate
    ? Math.ceil((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))
    : null;

  // Latest weight
  const latestWeight = recentLogs.find((l) => l.weight)?.weight;
  const prevWeight = recentLogs.filter((l) => l.weight)[1]?.weight;
  const weightChange = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  // Average symptoms this week
  const avgNausea = recentLogs.length
    ? (recentLogs.reduce((sum, l) => sum + (l.symptom_nausea || 0), 0) / recentLogs.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(170,32%,50%,0.4),_transparent_60%)]" />
        <div className="relative px-5 pt-8 pb-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-primary-foreground/80 font-medium tracking-wide">Olá, {firstName} 👋</p>
              <h1 className="text-xl font-bold text-primary-foreground mt-0.5">
                {weekNumber ? `Semana ${weekNumber}` : "Meu Plano"} · {currentDose}
              </h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center relative border border-primary-foreground/10">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </button>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-foreground/10">
            <Shield className="w-3.5 h-3.5 text-primary-foreground/80" />
            <p className="text-[11px] text-primary-foreground/80 font-medium">
              Suporte educacional · Não substitui acompanhamento médico
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-1 space-y-4">
        {/* Meu Plano */}
        <div className="animate-fade-in-up bg-card rounded-2xl p-4 shadow-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-sm">Meu Plano</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-primary">{currentDose}</p>
              <p className="text-[10px] text-muted-foreground">Dose atual</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{applicationDay}</p>
              <p className="text-[10px] text-muted-foreground">Dia de aplicação</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-secondary">
                {daysUntilNext !== null ? `${daysUntilNext}d` : "—"}
              </p>
              <p className="text-[10px] text-muted-foreground">Próxima aplicação</p>
            </div>
          </div>
        </div>

        {/* Quick metrics */}
        {(latestWeight || avgNausea) && (
          <div className="animate-fade-in-up grid grid-cols-2 gap-3" style={{ animationDelay: "60ms" }}>
            {latestWeight && (
              <div className="bg-card rounded-2xl p-3.5 shadow-card border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <span className="text-[10px] text-muted-foreground font-medium">Peso</span>
                </div>
                <p className="text-xl font-bold">{latestWeight} <span className="text-xs text-muted-foreground">kg</span></p>
                {weightChange && (
                  <p className={`text-[10px] font-semibold ${parseFloat(weightChange) <= 0 ? "text-primary" : "text-secondary"}`}>
                    {parseFloat(weightChange) <= 0 ? "" : "+"}{weightChange} kg
                  </p>
                )}
              </div>
            )}
            {avgNausea && (
              <div className="bg-card rounded-2xl p-3.5 shadow-card border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-3.5 h-3.5 text-warning" />
                  <span className="text-[10px] text-muted-foreground font-medium">Náusea média</span>
                </div>
                <p className="text-xl font-bold">{avgNausea}<span className="text-xs text-muted-foreground">/10</span></p>
                <p className="text-[10px] text-muted-foreground">Últimos 7 dias</p>
              </div>
            )}
          </div>
        )}

        {/* Alerts based on profile */}
        {hasSideEffects && avgNausea && parseFloat(avgNausea) >= 6 && (
          <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-start gap-3 bg-warning/8 rounded-2xl p-4 border border-warning/15">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Sintomas elevados</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Seus sintomas estão acima da média. Se persistirem, considere conversar com seu médico.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic cards based on profile */}
        <div className="animate-fade-in-up space-y-3" style={{ animationDelay: "140ms" }}>
          {hasNausea && (
            <InsightCard
              title="Estratégias para náusea"
              description="Prefira refeições frias e leves. Fracione em 5-6 pequenas porções. Mantenha-se hidratada e evite alimentos gordurosos."
            />
          )}

          {isLowActivity && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Sugestão</span>
              </div>
              <p className="text-sm font-semibold">Comece devagar</p>
              <p className="text-xs text-muted-foreground mt-1">
                Uma caminhada de 10 minutos por dia já faz diferença. O hábito importa mais que a intensidade.
              </p>
            </div>
          )}

          {isWeightLossGoal && latestWeight && profile?.current_weight && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Progresso</span>
              </div>
              <p className="text-sm font-semibold">
                {(profile.current_weight - latestWeight).toFixed(1)} kg perdidos desde o início
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                <div className="gradient-hero h-full rounded-full transition-all" style={{ width: `${Math.min(100, ((profile.current_weight - latestWeight) / profile.current_weight) * 100 * 10)}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Weekly checklist */}
        <div className="animate-fade-in-up bg-card rounded-2xl p-4 shadow-card border border-border/50" style={{ animationDelay: "180ms" }}>
          <h3 className="font-bold text-sm mb-3">Checklist Semanal</h3>
          {[
            { label: "Registrar peso", done: recentLogs.some((l) => l.weight) },
            { label: "Registrar sintomas", done: recentLogs.some((l) => l.symptom_nausea > 0) },
            { label: "Registrar aplicação", done: injections.length > 0 && daysUntilNext !== null && daysUntilNext < 7 },
            { label: "Fazer um treino", done: recentLogs.some((l) => l.workout_type) },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? "bg-primary" : "border-2 border-muted-foreground/30"}`}>
                {item.done && <span className="text-[10px] text-primary-foreground">✓</span>}
              </div>
              <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "font-medium"}`}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: "220ms" }}>
          <button
            onClick={() => navigate("/registrar")}
            className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Registrar Agora
          </button>
        </div>

        {/* Social proof */}
        <div className="animate-fade-in-up" style={{ animationDelay: "260ms" }}>
          <div className="flex items-center gap-3 bg-card rounded-xl p-3.5 shadow-card border border-border/50">
            <div className="flex -space-x-2">
              {["C", "M", "A"].map((letter, i) => (
                <div key={i} className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">2.847 mulheres</span> já usam o MounjaroGuia
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
