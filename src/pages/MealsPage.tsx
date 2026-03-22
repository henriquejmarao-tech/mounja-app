import { useState, useEffect, useCallback, useRef } from "react";
import { Minus, Plus, Droplets, ChevronRight, Flame, Beef, Leaf, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EditGoalsDrawer from "@/components/meals/EditGoalsDrawer";
import AddMealDrawer from "@/components/meals/AddMealDrawer";
import MealCard from "@/components/meals/MealCard";
import MealCreditsBar from "@/components/meals/MealCreditsBar";
import LimitReachedSheet from "@/components/meals/LimitReachedSheet";
import PremiumGateModal from "@/components/PremiumGateModal";

const DAYS_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];
const ML_PER_GLASS = 250;

/* ── Progress Ring ─────────────────────────────── */
interface RingProps {
  value: number;
  goal: number;
  size?: number;
  stroke?: number;
  label: string;
  unit: string;
  color: string;
  iconColor: string;
  icon: React.ReactNode;
}

const ProgressRing = ({ value, goal, size = 100, stroke = 8, label, unit, color, iconColor, icon }: RingProps) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / (goal || 1), 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={stroke}
            opacity={0.5}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-foreground leading-none tabular-nums">
            {value}
          </span>
          <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
            / {goal}{unit}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span style={{ color: iconColor }}>{icon}</span>
        <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

const MealsPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { latestWeight } = useApplicationData();
  const { isFree } = usePlan();
  const navigate = useNavigate();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [limitSheetOpen, setLimitSheetOpen] = useState(false);

  const [currentDate] = useState(new Date());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [weekLogs, setWeekLogs] = useState<any[]>([]);

  const [goalsOpen, setGoalsOpen] = useState(false);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);

  // Credits state
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsMax, setCreditsMax] = useState(2);

  const dateStr = localDateStr(currentDate);

  // Goals from profile
  const caloriesGoal = profile?.calories_goal || 1650;
  const proteinGoal = profile?.protein_goal || 107;
  const fiberGoal = profile?.fiber_goal || 25;
  const glassesGoal = profile?.water_glasses_goal || 11;

  // Current values computed from meal_logs
  const caloriesCurrent = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const proteinCurrent = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
  const fiberCurrent = meals.reduce((sum, m) => sum + (Number(m.fiber) || 0), 0);

  const todayLabel = currentDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const weekStart = getWeekStart(currentDate);
  const weekStartStr = localDateStr(weekStart);
  const todayDayIndex = (() => {
    const now = new Date();
    const ws = getWeekStart(now);
    return Math.floor((now.getTime() - ws.getTime()) / 86400000);
  })();

  const fetchData = useCallback(async () => {
    if (!user) return;

    const weekEnd = new Date(weekStartStr + "T00:00:00");
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = localDateStr(weekEnd);

    const [logRes, weekRes, mealsRes] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .limit(1),
      supabase
        .from("daily_logs")
        .select("date, food_quality, water_ml")
        .eq("user_id", user.id)
        .gte("date", weekStartStr)
        .lte("date", weekEndStr),
      supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .order("meal_time", { ascending: true }),
    ]);

    const log = (logRes.data as any[])?.[0] || null;
    setTodayLog(log);
    setWaterGlasses(log?.water_ml ? Math.round(log.water_ml / ML_PER_GLASS) : 0);
    setWeekLogs((weekRes.data as any[]) || []);
    setMeals((mealsRes.data as any[]) || []);
  }, [user, dateStr, weekStartStr]);

  // Fetch / upsert credits for today
  const fetchCredits = useCallback(async () => {
    if (!user) return;
    // Upsert so the row exists
    const { data } = await supabase
      .from("daily_meal_credits" as any)
      .upsert(
        { user_id: user.id, date: dateStr, credits_used: 0, credits_max: 2 },
        { onConflict: "user_id,date", ignoreDuplicates: true }
      )
      .select()
      .single();
    if (data) {
      setCreditsUsed((data as any).credits_used);
      setCreditsMax((data as any).credits_max);
    } else {
      // Fallback: read existing
      const { data: existing } = await supabase
        .from("daily_meal_credits" as any)
        .select("credits_used, credits_max")
        .eq("user_id", user.id)
        .eq("date", dateStr)
        .limit(1)
        .single();
      if (existing) {
        setCreditsUsed((existing as any).credits_used);
        setCreditsMax((existing as any).credits_max);
      }
    }
  }, [user, dateStr]);

  useEffect(() => {
    fetchData();
    fetchCredits();
  }, [fetchData, fetchCredits]);

  // Debounced water save
  const waterRef = useRef(waterGlasses);
  const waterDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const savingWaterRef = useRef(false);

  const updateWater = (delta: number) => {
    if (!user) return;
    const newGlasses = Math.max(0, waterGlasses + delta);
    setWaterGlasses(newGlasses);
    waterRef.current = newGlasses;

    clearTimeout(waterDebounceRef.current);

    waterDebounceRef.current = setTimeout(async () => {
      if (savingWaterRef.current) return;
      savingWaterRef.current = true;
      const ml = waterRef.current * ML_PER_GLASS;
      try {
        if (todayLog) {
          await supabase
            .from("daily_logs")
            .update({ water_ml: ml })
            .eq("id", todayLog.id);
          setTodayLog((prev: any) => prev ? { ...prev, water_ml: ml } : prev);
        } else {
          const { data } = await supabase
            .from("daily_logs")
            .insert({ user_id: user.id, date: dateStr, water_ml: ml })
            .select()
            .single();
          if (data) setTodayLog(data);
        }
      } catch {
        toast.error("Erro ao salvar água");
      }
      savingWaterRef.current = false;
    }, 500);
  };

  const dayHasLog = (dayIndex: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    const ds = localDateStr(d);
    return weekLogs.some((l) => l.date === ds && (l.food_quality || l.water_ml));
  };

  const handleSaveGoals = async (goals: { calories: number; protein: number; fiber: number; water: number }) => {
    if (!user) return;
    await supabase.from("profiles").update({
      calories_goal: goals.calories,
      protein_goal: goals.protein,
      fiber_goal: goals.fiber,
      water_glasses_goal: goals.water,
    } as any).eq("id", user.id);
    await refreshProfile();
  };

  const waterPct = Math.min(waterGlasses / (glassesGoal || 1), 1);

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* ── Header ── */}
      <div className="px-6 pt-safe pb-1">
        <h1 className="text-xl font-bold text-foreground">Hoje • {todayLabel}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vamos manter a consistência hoje</p>
      </div>

      {/* ── Daily Target Card ── */}
      <div className="px-5 mt-5 animate-fade-in-up">
        <div className="bg-card rounded-[22px] border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Sua meta do dia</h2>
            <button
              onClick={() => setGoalsOpen(true)}
              className="text-[11px] text-muted-foreground/50 font-semibold flex items-center gap-0.5"
            >
              Editar <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center justify-around">
            <ProgressRing
              value={caloriesCurrent}
              goal={caloriesGoal}
              color="hsl(15, 65%, 65%)"
              iconColor="hsl(15, 65%, 60%)"
              icon={<Flame className="w-3.5 h-3.5" />}
              label="Calorias"
              unit=""
              size={100}
              stroke={9}
            />
            <ProgressRing
              value={proteinCurrent}
              goal={proteinGoal}
              color="hsl(295, 45%, 50%)"
              iconColor="hsl(295, 45%, 50%)"
              icon={<Beef className="w-3.5 h-3.5" />}
              label="Proteína"
              unit="g"
              size={88}
              stroke={7}
            />
            <ProgressRing
              value={fiberCurrent}
              goal={fiberGoal}
              color="hsl(160, 40%, 50%)"
              iconColor="hsl(160, 40%, 50%)"
              icon={<Leaf className="w-3.5 h-3.5" />}
              label="Fibra"
              unit="g"
              size={88}
              stroke={7}
            />
          </div>
        </div>
      </div>

      {/* ── Water Section ── */}
      <div className="px-5 mt-4 animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <div className="bg-card rounded-[22px] border border-border/50 shadow-card px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-foreground">Consumo de água</h3>
            </div>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {waterGlasses} de {glassesGoal} copos
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-3 bg-muted/50 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${waterPct * 100}%`,
                background: "linear-gradient(to right, hsl(200, 70%, 55%), hsl(260, 55%, 55%))",
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => updateWater(-1)}
              disabled={waterGlasses <= 0}
              className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            >
              <Minus className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-1">
              <Droplets className="w-5 h-5 text-sky-400" />
              <span className="text-2xl font-extrabold text-foreground tabular-nums">{waterGlasses}</span>
            </div>
            <button
              onClick={() => updateWater(1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "linear-gradient(to right, hsl(200, 70%, 92%), hsl(260, 55%, 92%))" }}
            >
              <Plus className="w-4 h-4 text-sky-600" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Meals Section ── */}
      <div className="px-5 mt-6 animate-fade-in-up" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-foreground">Refeições de hoje</h2>
          {meals.length > 0 && (
            <span className="text-[11px] font-semibold text-muted-foreground/50">
              {meals.length} {meals.length === 1 ? "refeição" : "refeições"}
            </span>
          )}
        </div>

        {meals.length > 0 ? (
          <div className="space-y-3">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onDelete={async (id) => {
                  await supabase.from("meal_logs").delete().eq("id", id);
                  toast.success("Refeição removida");
                  fetchData();
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-[22px] p-6 border border-border/50 shadow-card text-center">
            <p className="text-3xl mb-3">🍽️</p>
            <p className="text-base font-bold text-foreground mb-1">Nenhuma refeição registrada</p>
            <p className="text-sm text-muted-foreground mb-5">Comece sua sequência hoje</p>
            <button
              onClick={() => isFree ? setPremiumModalOpen(true) : setAddMealOpen(true)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold active:scale-95 transition-transform inline-flex items-center gap-2",
                isFree ? "bg-muted text-muted-foreground" : "gradient-hero text-primary-foreground"
              )}
              style={!isFree ? { boxShadow: "0px 6px 16px rgba(128, 0, 128, 0.12)" } : undefined}
            >
              {isFree && <Lock className="w-3.5 h-3.5" />}
              Registrar primeira refeição
            </button>
          </div>
        )}
      </div>

      {/* ── Weekly Streak ── */}
      <div className="px-5 mt-6 mb-4 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <h2 className="text-sm font-bold text-foreground mb-3">Sua sequência semanal</h2>
        <div className="bg-card rounded-[22px] border border-border/50 shadow-card px-5 py-4">
          <div className="flex items-center justify-between">
            {DAYS_LABELS.map((day, i) => {
              const hasLog = dayHasLog(i);
              const isCurrent = i === todayDayIndex;
              const isFuture = i > todayDayIndex;

              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground">{day}</span>
                  <div
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      isCurrent
                        ? "gradient-hero text-primary-foreground shadow-elevated"
                        : hasLog && !isFuture
                          ? "bg-primary/12 text-primary"
                          : "bg-muted/50 text-muted-foreground/40"
                    )}
                  >
                    {hasLog && !isFuture && !isCurrent ? "✓" : (
                      (() => {
                        const d = new Date(weekStart);
                        d.setDate(d.getDate() + i);
                        return d.getDate();
                      })()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Floating Action Button ── */}
      <button
        onClick={() => isFree ? setPremiumModalOpen(true) : setAddMealOpen(true)}
        className={cn(
          "fixed right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform touch-manipulation animate-cta-entrance",
          isFree ? "bg-muted/80 text-muted-foreground" : "gradient-hero text-primary-foreground"
        )}
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
          boxShadow: isFree ? "0px 4px 12px rgba(0,0,0,0.08)" : "0px 8px 24px rgba(128, 0, 128, 0.2)",
        }}
      >
        {isFree ? <Lock className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
      </button>

      {/* ── Drawers ── */}
      <EditGoalsDrawer
        open={goalsOpen}
        onOpenChange={setGoalsOpen}
        goals={{ calories: caloriesGoal, protein: proteinGoal, fiber: fiberGoal, water: glassesGoal }}
        onSave={handleSaveGoals}
      />
      {user && (
        <AddMealDrawer
          open={addMealOpen}
          onOpenChange={setAddMealOpen}
          userId={user.id}
          date={dateStr}
          onMealAdded={fetchData}
        />
      )}

      {/* Premium Gate Modal */}
      <PremiumGateModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
        title="Recurso premium"
        description="O registro de refeições com foto está disponível no plano premium."
        ctaLabel="Fazer upgrade"
      />
    </div>
  );
};

export default MealsPage;
