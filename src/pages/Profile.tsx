import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Target, Calendar, Weight, Syringe, TrendingDown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { differenceInDays, differenceInWeeks } from "date-fns";

const badges = [
  { id: "first", label: "Primeiro registro", emoji: "🌱", threshold: 1, description: "Registrou o primeiro dia" },
  { id: "3days", label: "3 dias seguidos", emoji: "⚡", threshold: 3, description: "Consistência inicial" },
  { id: "7days", label: "1 semana", emoji: "🏅", threshold: 7, description: "Uma semana completa" },
  { id: "14days", label: "2 semanas", emoji: "🌟", threshold: 14, description: "Duas semanas de dedicação" },
  { id: "30days", label: "1 mês", emoji: "🏆", threshold: 30, description: "Um mês inteiro!" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { dose } = useApplicationData();

  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalInjections, setTotalInjections] = useState(0);
  const [weightLost, setWeightLost] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [logsRes, workoutsRes, injectionsRes] = await Promise.all([
        supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).order("date", { ascending: false }).limit(200),
        supabase.from("workouts").select("id").eq("user_id", user.id),
        supabase.from("injections").select("id").eq("user_id", user.id),
      ]);

      const logs = (logsRes.data as any[]) || [];
      setTotalLogs(logs.length);
      setTotalWorkouts((workoutsRes.data as any[])?.length || 0);
      setTotalInjections((injectionsRes.data as any[])?.length || 0);

      // Streak
      let s = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 0; i < logs.length; i++) {
        const d = new Date(logs[i].date + "T12:00:00");
        d.setHours(0, 0, 0, 0);
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        if (d.getTime() === expected.getTime()) s++;
        else break;
      }
      setStreak(s);

      // Weight lost
      const withWeight = logs.filter((l: any) => l.weight);
      if (withWeight.length >= 2) {
        const first = withWeight[withWeight.length - 1].weight;
        const last = withWeight[0].weight;
        if (first > last) setWeightLost(+(first - last).toFixed(1));
      }

      setLoading(false);
    };
    fetch();
  }, [user]);

  const firstName = profile?.name?.split(" ")[0] || "Usuário";
  const startDate = profile?.mounjaro_start_date;
  const weeksOnMounjaro = startDate ? differenceInWeeks(new Date(), new Date(startDate)) : null;
  const daysOnMounjaro = startDate ? differenceInDays(new Date(), new Date(startDate)) : null;

  const earnedBadges = badges.filter((b) => streak >= b.threshold);
  const nextBadge = badges.find((b) => streak < b.threshold);
  const progressToNext = nextBadge ? Math.min((streak / nextBadge.threshold) * 100, 100) : 100;

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
        <div className="relative px-5 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-18 h-18 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground text-2xl font-bold border border-primary-foreground/10"
              style={{ width: 72, height: 72 }}>
              {profile?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-primary-foreground">{profile?.name || "Usuário"}</h1>
              {profile?.goal && (
                <p className="text-sm text-primary-foreground/70 mt-0.5">
                  {profile.goal === "lose_weight" ? "🎯 Emagrecimento" : profile.goal === "health" ? "🫀 Saúde" : profile.goal === "maintain" ? "⚖️ Manutenção" : profile.goal}
                </p>
              )}
              {weeksOnMounjaro !== null && (
                <p className="text-xs text-primary-foreground/60 mt-1">
                  {weeksOnMounjaro > 0 ? `${weeksOnMounjaro} semana${weeksOnMounjaro !== 1 ? "s" : ""} de jornada` : `${daysOnMounjaro} dia${daysOnMounjaro !== 1 ? "s" : ""} de jornada`}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-3 space-y-4 relative z-10">
        {/* Streak Hero */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              streak >= 7 ? "gradient-hero" : streak >= 3 ? "bg-warning/15" : "bg-muted"
            )}>
              <Flame className={cn(
                "w-7 h-7",
                streak >= 7 ? "text-primary-foreground" : streak >= 3 ? "text-warning" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="text-3xl font-bold">{streak}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {streak === 1 ? "dia seguido" : "dias seguidos"}
              </p>
            </div>
          </div>
          {/* Progress to next badge */}
          {nextBadge && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Próxima conquista: {nextBadge.emoji} {nextBadge.label}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">{streak}/{nextBadge.threshold}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full gradient-hero rounded-full transition-all duration-700" style={{ width: `${progressToNext}%` }} />
              </div>
            </div>
          )}
          {!nextBadge && (
            <div className="flex items-center gap-2 text-primary">
              <Trophy className="w-4 h-4" />
              <p className="text-xs font-semibold">Todas as conquistas desbloqueadas! 🎉</p>
            </div>
          )}
        </div>

        {/* Badges Grid */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Conquistas</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {badges.map((badge) => {
              const earned = streak >= badge.threshold;
              return (
                <div key={badge.id} className="flex flex-col items-center gap-1.5">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all",
                    earned ? "bg-primary/10 border border-primary/20 scale-100" : "bg-muted/60 border border-border/50 opacity-40 grayscale"
                  )}>
                    {badge.emoji}
                  </div>
                  <span className={cn("text-[9px] font-semibold text-center leading-tight", earned ? "text-foreground" : "text-muted-foreground")}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalLogs}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Registros</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalWorkouts}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Treinos</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Syringe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold">{totalInjections}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Aplicações</p>
            </div>
          </div>
          {weightLost !== null && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">-{weightLost} kg</p>
                <p className="text-[10px] text-muted-foreground font-medium">Perdidos</p>
              </div>
            </div>
          )}
        </div>

        {/* Personal Info */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">Sobre você</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "Dose atual", value: dose.currentDose || profile?.current_dose },
              { label: "Peso atual", value: profile?.current_weight ? `${profile.current_weight} kg` : null },
              { label: "Altura", value: (profile as any)?.height_cm ? `${(profile as any).height_cm} cm` : null },
              { label: "Idade", value: (profile as any)?.age ? `${(profile as any).age} anos` : null },
              { label: "Nível de atividade", value: profile?.activity_level === "sedentary" ? "Sedentário" : profile?.activity_level === "light" ? "Leve" : profile?.activity_level === "moderate" ? "Moderado" : profile?.activity_level === "active" ? "Ativo" : null },
            ].filter(item => item.value).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
