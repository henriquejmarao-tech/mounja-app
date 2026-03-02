import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Plus, Sparkles, Flame, Award, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const badges = [
  { id: "first", label: "Primeiro registro", emoji: "🌱", threshold: 1 },
  { id: "3days", label: "3 dias seguidos", emoji: "⚡", threshold: 3 },
  { id: "7days", label: "1 semana seguida", emoji: "🏅", threshold: 7 },
  { id: "14days", label: "2 semanas seguidas", emoji: "🌟", threshold: 14 },
  { id: "30days", label: "1 mês seguido", emoji: "🏆", threshold: 30 },
];

const streakMessages = [
  { min: 0, max: 0, message: "Comece a registrar hoje e inicie sua sequência! 🌱" },
  { min: 1, max: 1, message: "Primeiro passo dado! Continue amanhã para manter a sequência. ✨" },
  { min: 2, max: 2, message: "Dois dias seguidos! O hábito está se formando. 💫" },
  { min: 3, max: 6, message: "Você está criando um hábito incrível! Continue assim! ⚡" },
  { min: 7, max: 13, message: "Uma semana inteira! Isso mostra dedicação real. 🏅" },
  { min: 14, max: 29, message: "Duas semanas! Você já é referência em consistência. 🌟" },
  { min: 30, max: Infinity, message: "Um mês seguido! Você é inspiração pura. 🏆" },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [lastInjection, setLastInjection] = useState<any>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [injRes, logsRes] = await Promise.all([
        supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(1),
        supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
      ]);

      const inj = (injRes.data as any[]) || [];
      const logs = (logsRes.data as any[]) || [];

      setLastInjection(inj[0] || null);
      setTotalLogs(logs.length);
      const wLog = logs.find((l) => l.weight);
      setLatestWeight(wLog?.weight ?? null);

      // Calculate streak
      let s = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < logs.length; i++) {
        const d = new Date(logs[i].date);
        d.setHours(0, 0, 0, 0);
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        if (d.getTime() === expected.getTime()) s++;
        else break;
      }
      setStreak(s);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const firstName = profile?.name?.split(" ")[0] || "Olá";
  const currentDose = profile?.current_dose || null;

  const daysUntilNext = lastInjection
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(lastInjection.date).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const initialWeight = profile?.current_weight;
  const weightLost = initialWeight && latestWeight ? initialWeight - latestWeight : null;

  const getStreakMessage = () => {
    const msg = streakMessages.find((m) => streak >= m.min && streak <= m.max);
    return msg?.message || streakMessages[0].message;
  };

  const getProgressPhrase = () => {
    if (weightLost && weightLost > 0) {
      return `Você já perdeu ${weightLost.toFixed(1)} kg. Continue assim! 💪`;
    }
    return "Cada registro conta. Vamos acompanhar sua jornada! 🌱";
  };

  // Next badge to earn
  const nextBadge = badges.find((b) => streak < b.threshold);
  const earnedBadges = badges.filter((b) => streak >= b.threshold);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-8 pb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-primary-foreground/80 font-medium">{firstName} 👋</p>
              <h1 className="text-lg font-bold text-primary-foreground mt-0.5">Sua jornada</h1>
            </div>
            <button
              onClick={() => navigate("/configuracoes")}
              className="w-9 h-9 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10"
            >
              <Settings className="w-4.5 h-4.5 text-primary-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-3 space-y-4 relative z-10">
        {/* Key metrics card */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Dose atual</p>
              <p className="text-xl font-bold text-primary">{currentDose || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Próxima aplicação</p>
              <p className="text-xl font-bold">
                {daysUntilNext !== null ? (
                  daysUntilNext === 0 ? (
                    <span className="text-secondary">Hoje!</span>
                  ) : (
                    <>{daysUntilNext} <span className="text-sm font-medium text-muted-foreground">dias</span></>
                  )
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Peso atual</p>
              <p className="text-xl font-bold">
                {latestWeight ? (
                  <>{latestWeight} <span className="text-sm font-medium text-muted-foreground">kg</span></>
                ) : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Total de registros</p>
              <p className="text-xl font-bold">{totalLogs}</p>
            </div>
          </div>
        </div>

        {/* Streak card */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center",
              streak >= 7 ? "gradient-hero" : streak >= 3 ? "bg-warning/15" : "bg-muted"
            )}>
              <Flame className={cn(
                "w-6 h-6",
                streak >= 7 ? "text-primary-foreground" : streak >= 3 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {streak} <span className="text-sm font-medium text-muted-foreground">{streak === 1 ? "dia" : "dias"} seguidos</span>
              </p>
              <p className="text-xs text-muted-foreground">{getStreakMessage()}</p>
            </div>
          </div>

          {/* Streak dots visualization */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 rounded-full transition-all",
                  i < Math.min(streak, 7) ? "gradient-hero" : "bg-muted"
                )}
              />
            ))}
          </div>
          {nextBadge && streak < 7 && (
            <p className="text-[10px] text-muted-foreground mt-2">
              Mais {nextBadge.threshold - streak} dia{nextBadge.threshold - streak !== 1 ? "s" : ""} para ganhar: {nextBadge.emoji} {nextBadge.label}
            </p>
          )}
        </div>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Conquistas</h3>
            </div>
            <div className="flex gap-2 flex-wrap">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-center gap-1.5 bg-primary/8 rounded-xl px-3 py-2 border border-primary/10"
                >
                  <span className="text-lg">{badge.emoji}</span>
                  <span className="text-[10px] font-semibold text-primary">{badge.label}</span>
                </div>
              ))}
            </div>
            {nextBadge && (
              <div className="mt-3 flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2">
                <span className="text-lg opacity-40">{nextBadge.emoji}</span>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">Próxima conquista</p>
                  <p className="text-[11px] font-semibold">{nextBadge.label} — falta{nextBadge.threshold - streak !== 1 ? "m" : ""} {nextBadge.threshold - streak} dia{nextBadge.threshold - streak !== 1 ? "s" : ""}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress phrase */}
        {weightLost && weightLost > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up flex items-start gap-3" style={{ animationDelay: "140ms" }}>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground leading-relaxed">{getProgressPhrase()}</p>
          </div>
        )}

        {/* Big register button */}
        <button
          onClick={() => navigate("/registrar")}
          className="w-full gradient-hero text-primary-foreground font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 animate-fade-in-up text-base"
          style={{ animationDelay: "180ms" }}
        >
          <Plus className="w-6 h-6" />
          Registrar hoje
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
