import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Droplets } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EditGoalsDrawer from "@/components/meals/EditGoalsDrawer";
import AddMealDrawer from "@/components/meals/AddMealDrawer";
import MealCard from "@/components/meals/MealCard";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const ML_PER_GLASS = 250;

/* ── Circular Progress Ring ─────────────────────────────── */
interface RingProps {
  value: number;
  goal: number;
  size?: number;
  stroke?: number;
  color: string;       // HSL track color e.g. "25, 85%, 55%"
  trackColor?: string;
  label: string;
  unit: string;
}

const ProgressRing = ({ value, goal, size = 110, stroke = 8, color, trackColor, label, unit }: RingProps) => {
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
            stroke={trackColor || `hsla(${color}, 0.12)`}
            strokeWidth={stroke}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`hsl(${color})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-extrabold text-foreground leading-none">
            {value}{unit}
          </span>
          <span className="text-[9px] font-medium text-muted-foreground mt-0.5">
            de {goal}{unit}
          </span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
    </div>
  );
};

const MealsPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { latestWeight } = useApplicationData();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [weekLogs, setWeekLogs] = useState<any[]>([]);
  
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [meals, setMeals] = useState<any[]>([]);

  const dateStr = localDateStr(currentDate);
  const isToday = dateStr === localDateStr(new Date());

  // Goals from profile
  const caloriesGoal = profile?.calories_goal || 1650;
  const proteinGoal = profile?.protein_goal || 107;
  const fiberGoal = profile?.fiber_goal || 25;
  const glassesGoal = profile?.water_glasses_goal || 11;

  // Current values computed from meal_logs
  const caloriesCurrent = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const proteinCurrent = meals.reduce((sum, m) => sum + (Number(m.protein) || 0), 0);
  const fiberCurrent = meals.reduce((sum, m) => sum + (Number(m.fiber) || 0), 0);

  const dateLabel = isToday
    ? "Hoje"
    : currentDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });

  const navigateDate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced water save — optimistic UI, single DB write
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
    return weekLogs.some((l) => l.date === ds && l.food_quality);
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
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-safe">
        <button onClick={() => navigateDate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">{dateLabel}</h1>
        <button onClick={() => navigateDate(1)} className="p-2 -mr-2 active:scale-90 transition-transform">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* ── Macro Rings ─────────────────────────────── */}
      <div className="px-5 mt-4">
        <div className="bg-card rounded-[20px] border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-around">
            <ProgressRing
              value={caloriesCurrent}
              goal={caloriesGoal}
              color="25, 85%, 55%"
              label="Calorias"
              unit=""
              size={105}
              stroke={9}
            />
            <ProgressRing
              value={proteinCurrent}
              goal={proteinGoal}
              color="350, 50%, 42%"
              label="Proteína"
              unit="g"
              size={90}
              stroke={7}
            />
            <ProgressRing
              value={fiberCurrent}
              goal={fiberGoal}
              color="145, 55%, 42%"
              label="Fibra"
              unit="g"
              size={90}
              stroke={7}
            />
          </div>
          <button
            onClick={() => setGoalsOpen(true)}
            className="mt-4 w-full text-center text-xs font-semibold text-muted-foreground active:scale-95 transition-transform"
          >
            Editar metas →
          </button>
        </div>
      </div>

      {/* ── Water Card ──────────────────────────────── */}
      <div className="px-5 mt-3">
        <div className="bg-card rounded-[20px] border border-border/50 shadow-card px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: `conic-gradient(hsl(200, 70%, 55%) ${waterPct * 360}deg, hsl(200, 30%, 92%) 0deg)` }}
            >
              <div className="w-7 h-7 rounded-full bg-card flex items-center justify-center">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {waterGlasses} de {glassesGoal} copos
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">consumo de água</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateWater(-1)}
              disabled={waterGlasses <= 0}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
            >
              <Minus className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => updateWater(1)}
              className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4 text-sky-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">
            {isToday ? "Refeições de Hoje" : `Refeições de ${currentDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`}
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {meals.length} {meals.length === 1 ? "refeição" : "refeições"}
          </span>
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
          <div className="bg-card rounded-[20px] p-6 border border-border/50 shadow-card text-center">
            <p className="text-base font-bold text-foreground mb-1">Comece sua sequência!</p>
            <p className="text-sm text-muted-foreground mb-4">Registre refeições diariamente para criar o hábito</p>

            <div className="flex items-center justify-center gap-2">
              {DAYS.map((day, i) => {
                const hasLog = dayHasLog(i);
                const isCurrent = i === todayDayIndex;
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                      isCurrent
                        ? "border-2 border-primary text-primary"
                        : hasLog
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddMealOpen(true)}
        className="fixed right-5 z-40 w-14 h-14 rounded-full gradient-hero text-primary-foreground shadow-elevated flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Drawers */}
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
    </div>
  );
};

export default MealsPage;
