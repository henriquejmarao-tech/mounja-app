import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { Syringe, Scale, Camera, Utensils, Smile, Zap, Frown, Meh, Plus, TrendingDown, Lightbulb } from "lucide-react";
import { cn, localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

const moodEmojis = [
  { value: 1, icon: Frown, label: "Ruim", color: "text-destructive" },
  { value: 2, icon: Meh, label: "Ok", color: "text-warning" },
  { value: 3, icon: Smile, label: "Bem", color: "text-primary" },
  { value: 4, icon: Zap, label: "Ótimo", color: "text-primary" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { dose, latestWeight, refresh: refreshSSoT } = useApplicationData();

  const [todayLog, setTodayLog] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<{ date: string; peso: number }[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [loading, setLoading] = useState(true);

  const firstName = profile?.name?.split(" ")[0] || "Olá";

  const daysUntilNext = dose.nextApplicationAt
    ? Math.max(0, Math.ceil((new Date(dose.nextApplicationAt).getTime() - Date.now()) / 86400000))
    : null;

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const today = localDateStr();
      const [logRes, weightRes] = await Promise.all([
        supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", today).limit(1),
        supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).not("weight", "is", null).order("date", { ascending: true }).limit(30),
      ]);
      const tLog = (logRes.data as any[])?.[0] || null;
      setTodayLog(tLog);
      const wData = ((weightRes.data as any[]) || []).map((l) => ({
        date: l.date,
        peso: Number(l.weight),
      }));
      setWeightHistory(wData);

      // Simple insight
      if (wData.length >= 3) {
        const last3 = wData.slice(-3);
        const diff = last3[0].peso - last3[last3.length - 1].peso;
        if (diff > 0) {
          setInsight(`Você perdeu ${diff.toFixed(1)} kg nos últimos registros. Continue assim! 💪`);
        }
      }
      if (!insight && wData.length >= 2) {
        const recent = wData[wData.length - 1].peso;
        const prev = wData[wData.length - 2].peso;
        if (recent < prev) {
          setInsight(`Seu último peso registrado mostra uma queda de ${(prev - recent).toFixed(1)} kg. Bom progresso!`);
        }
      }

      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleQuickCheckin = async (field: string, value: number) => {
    if (!user || savingCheckin) return;
    setSavingCheckin(true);
    const today = localDateStr();
    try {
      if (todayLog) {
        await supabase.from("daily_logs").update({ [field]: value } as any).eq("id", todayLog.id);
        setTodayLog({ ...todayLog, [field]: value });
      } else {
        const { data } = await supabase.from("daily_logs").insert({
          user_id: user.id,
          date: today,
          [field]: value,
        } as any).select().single();
        if (data) setTodayLog(data);
      }
      toast.success("Registrado ✓");
    } catch {
      toast.error("Erro ao salvar");
    }
    setSavingCheckin(false);
  };

  const initialWeight = profile?.current_weight;
  const goalWeight = profile?.goal ? parseFloat(profile.goal) : null;
  const currentWeight = latestWeight || (weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].peso : null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* Header */}
      <div className="px-6 pt-safe pb-2">
        <p className="text-muted-foreground text-sm">Olá,</p>
        <h1 className="text-2xl font-bold text-foreground">{firstName} 👋</h1>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* Next Injection Card */}
        <div
          className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => navigate("/log")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Próxima aplicação</p>
              <p className="text-lg font-bold text-foreground mt-1">
                {dose.currentDose ? `Mounjaro ${dose.currentDose}` : "Nenhuma dose registrada"}
              </p>
              <p className="text-sm text-primary font-semibold mt-0.5">
                {daysUntilNext !== null
                  ? daysUntilNext === 0
                    ? "Hoje"
                    : daysUntilNext === 1
                    ? "Amanhã"
                    : `em ${daysUntilNext} dias`
                  : "—"}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Syringe className="w-7 h-7 text-primary" />
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate("/log"); }}
            className="mt-4 w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <Plus className="w-4 h-4" />
            Registrar aplicação
          </button>
        </div>

        {/* Daily Check-in */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Check-in de hoje</p>
          <div className="grid grid-cols-4 gap-2">
            {moodEmojis.map((m) => {
              const isSelected = todayLog?.mood === m.value;
              return (
                <button
                  key={m.value}
                  onClick={() => handleQuickCheckin("mood", m.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all active:scale-95",
                    isSelected
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/50 border-transparent hover:bg-secondary"
                  )}
                >
                  <m.icon className={cn("w-6 h-6", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-[11px] font-medium", isSelected ? "text-primary" : "text-muted-foreground")}>{m.label}</span>
                </button>
              );
            })}
          </div>
          {/* Quick symptom buttons */}
          <div className="flex gap-2 mt-3">
            {[
              { label: "Apetite", field: "appetite", icon: "🍽️" },
              { label: "Energia", field: "energy", icon: "⚡" },
              { label: "Náusea", field: "symptom_nausea", icon: "🤢" },
            ].map((s) => {
              const val = todayLog?.[s.field];
              return (
                <button
                  key={s.field}
                  onClick={() => handleQuickCheckin(s.field, val ? 0 : 3)}
                  className={cn(
                    "flex-1 py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 border transition-all active:scale-95",
                    val ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/50 border-transparent text-muted-foreground"
                  )}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Ações rápidas</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Scale, label: "Atualizar peso", color: "text-info", bg: "bg-info/10", action: () => navigate("/log") },
              { icon: Syringe, label: "Registrar sintomas", color: "text-primary", bg: "bg-primary/10", action: () => navigate("/log") },
              { icon: Camera, label: "Foto de progresso", color: "text-accent-foreground", bg: "bg-accent", action: () => navigate("/progress") },
              { icon: Utensils, label: "Registrar refeição", color: "text-warning", bg: "bg-warning/10", action: () => navigate("/log") },
            ].map((a, i) => (
              <button
                key={i}
                onClick={a.action}
                className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center gap-3 active:scale-[0.97] transition-transform text-left"
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", a.bg)}>
                  <a.icon className={cn("w-5 h-5", a.color)} />
                </div>
                <span className="text-sm font-medium text-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Snapshot */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso</p>
            <button onClick={() => navigate("/progress")} className="text-xs text-primary font-semibold">Ver tudo →</button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground">Inicial</p>
              <p className="text-lg font-bold text-foreground">{initialWeight ? `${initialWeight}` : "—"}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground">Atual</p>
              <p className="text-lg font-bold text-primary">{currentWeight ? `${Number(currentWeight).toFixed(1)}` : "—"}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground">Objetivo</p>
              <p className="text-lg font-bold text-foreground">{goalWeight ? `${goalWeight}` : "—"}<span className="text-xs text-muted-foreground ml-0.5">kg</span></p>
            </div>
          </div>
          {weightHistory.length >= 2 && (
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightHistory.slice(-10)}>
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
                  <Line type="monotone" dataKey="peso" stroke="hsl(168, 56%, 42%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Insights */}
        {insight && (
          <div className="bg-accent rounded-2xl p-4 border border-primary/10 animate-fade-in-up flex items-start gap-3" style={{ animationDelay: "240ms" }}>
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">{insight}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
