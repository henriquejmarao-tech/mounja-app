import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Plus, Sparkles } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [lastInjection, setLastInjection] = useState<any>(null);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [injRes, logsRes] = await Promise.all([
        supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(1),
        supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
      ]);

      const inj = (injRes.data as any[]) || [];
      const logs = (logsRes.data as any[]) || [];

      setLastInjection(inj[0] || null);
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

  // Days until next injection
  const daysUntilNext = lastInjection
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(lastInjection.date).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  // Progress phrase
  const initialWeight = profile?.current_weight;
  const weightLost = initialWeight && latestWeight ? initialWeight - latestWeight : null;

  const getProgressPhrase = () => {
    if (weightLost && weightLost > 0) {
      return `Você já perdeu ${weightLost.toFixed(1)} kg. Continue assim! 💪`;
    }
    if (streak >= 7) return "Uma semana inteira registrando! Incrível! 🌟";
    if (streak >= 3) return `${streak} dias seguidos registrando. Você está no ritmo! ✨`;
    return "Cada registro conta. Vamos acompanhar sua jornada! 🌱";
  };

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
            {/* Current dose */}
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Dose atual</p>
              <p className="text-xl font-bold text-primary">{currentDose || "—"}</p>
            </div>
            {/* Next application */}
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
            {/* Current weight */}
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Peso atual</p>
              <p className="text-xl font-bold">
                {latestWeight ? (
                  <>{latestWeight} <span className="text-sm font-medium text-muted-foreground">kg</span></>
                ) : "—"}
              </p>
            </div>
            {/* Streak */}
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Sequência</p>
              <p className="text-xl font-bold">
                {streak > 0 ? (
                  <>{streak} <span className="text-sm font-medium text-muted-foreground">{streak === 1 ? "dia" : "dias"}</span> 🔥</>
                ) : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress phrase */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 animate-fade-in-up flex items-start gap-3" style={{ animationDelay: "60ms" }}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm text-foreground leading-relaxed">{getProgressPhrase()}</p>
        </div>

        {/* Big register button */}
        <button
          onClick={() => navigate("/registrar")}
          className="w-full gradient-hero text-primary-foreground font-bold py-5 rounded-2xl flex items-center justify-center gap-3 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 animate-fade-in-up text-base"
          style={{ animationDelay: "120ms" }}
        >
          <Plus className="w-6 h-6" />
          Registrar hoje
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
