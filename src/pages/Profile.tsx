import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flame, Trophy, Target, Calendar, Syringe, TrendingDown, Check, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { differenceInDays, differenceInWeeks } from "date-fns";
import { toast } from "sonner";

const badges = [
  { id: "first", label: "Primeiro registro", emoji: "🌱", threshold: 1, description: "Registrou o primeiro dia" },
  { id: "3days", label: "3 dias seguidos", emoji: "⚡", threshold: 3, description: "Consistência inicial" },
  { id: "7days", label: "1 semana", emoji: "🏅", threshold: 7, description: "Uma semana completa" },
  { id: "14days", label: "2 semanas", emoji: "🌟", threshold: 14, description: "Duas semanas de dedicação" },
  { id: "30days", label: "1 mês", emoji: "🏆", threshold: 30, description: "Um mês inteiro!" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { dose } = useApplicationData();

  const [streak, setStreak] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalInjections, setTotalInjections] = useState(0);
  const [weightLost, setWeightLost] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (profile) {
      setNameInput(profile.name || "");
    }
  }, [profile]);

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

  const handleSaveName = async () => {
    if (!user) return;
    const cleaned = nameInput.trim();
    if (!cleaned || cleaned.length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres.");
      return;
    }
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ name: cleaned }).eq("id", user.id);
    if (error) {
      toast.error("Erro ao salvar nome.");
    } else {
      toast.success("Nome atualizado! ✨");
      setNameInput(cleaned);
      setEditingName(false);
      await refreshProfile();
    }
    setSavingName(false);
  };

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
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pb-8" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground text-3xl font-bold border-2 border-primary-foreground/15 mb-3">
              {profile?.name?.[0]?.toUpperCase() || "U"}
            </div>
            {/* Name display/edit */}
            {editingName ? (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Seu nome"
                  maxLength={40}
                  autoFocus
                  className="bg-primary-foreground/15 backdrop-blur-sm text-primary-foreground text-lg font-bold outline-none rounded-xl px-4 py-2 border border-primary-foreground/10 text-center w-48 placeholder:text-primary-foreground/30"
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="w-9 h-9 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/10 disabled:opacity-50"
                >
                  {savingName ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="flex items-center gap-1.5 group"
              >
                <h1 className="text-xl font-bold text-primary-foreground">{profile?.name || "Seu nome"}</h1>
                <Pencil className="w-3.5 h-3.5 text-primary-foreground/40 group-hover:text-primary-foreground/70 transition-colors" />
              </button>
            )}

            {weeksOnMounjaro !== null && (
              <p className="text-[11px] text-primary-foreground/50 mt-1">
                {weeksOnMounjaro > 0 ? `${weeksOnMounjaro} semana${weeksOnMounjaro !== 1 ? "s" : ""} de jornada` : `${daysOnMounjaro} dia${daysOnMounjaro !== 1 ? "s" : ""} de jornada`}
              </p>
            )}
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
      </div>
    </div>
  );
};

export default Profile;
