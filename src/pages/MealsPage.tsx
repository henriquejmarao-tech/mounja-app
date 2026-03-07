import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, Droplets } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EditGoalsDrawer from "@/components/meals/EditGoalsDrawer";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const ML_PER_GLASS = 250;

const MealsPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { latestWeight } = useApplicationData();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [todayLog, setTodayLog] = useState<any>(null);
  const [weekLogs, setWeekLogs] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  const [goalsOpen, setGoalsOpen] = useState(false);

  const dateStr = localDateStr(currentDate);
  const isToday = dateStr === localDateStr(new Date());

  // Goals from profile
  const caloriesGoal = profile?.calories_goal || 1650;
  const proteinGoal = profile?.protein_goal || 107;
  const fiberGoal = profile?.fiber_goal || 25;
  const glassesGoal = profile?.water_glasses_goal || 11;

  // Current values from today's log
  const caloriesCurrent = todayLog?.calories || 0;
  const proteinCurrent = todayLog?.protein || 0;
  const fiberCurrent = todayLog?.fiber || 0;

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
  const todayDayIndex = (() => {
    const now = new Date();
    const ws = getWeekStart(now);
    return Math.floor((now.getTime() - ws.getTime()) / 86400000);
  })();

  const fetchData = useCallback(async () => {
    if (!user) return;

    const weekStartStr = localDateStr(weekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = localDateStr(weekEnd);

    const [logRes, weekRes] = await Promise.all([
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
    ]);

    const log = (logRes.data as any[])?.[0] || null;
    setTodayLog(log);
    setWaterGlasses(log?.water_ml ? Math.round(log.water_ml / ML_PER_GLASS) : 0);
    setWeekLogs((weekRes.data as any[]) || []);
  }, [user, dateStr, weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateWater = async (delta: number) => {
    if (!user) return;
    const newGlasses = Math.max(0, waterGlasses + delta);
    setWaterGlasses(newGlasses);
    setSaving(true);

    try {
      const ml = newGlasses * ML_PER_GLASS;
      if (todayLog) {
        await supabase
          .from("daily_logs")
          .update({ water_ml: ml })
          .eq("id", todayLog.id);
      } else {
        await supabase.from("daily_logs").insert({
          user_id: user.id,
          date: dateStr,
          water_ml: ml,
        });
      }
      await fetchData();
    } catch {
      toast.error("Erro ao salvar água");
    }
    setSaving(false);
  };

  const dayHasLog = (dayIndex: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    const ds = localDateStr(d);
    return weekLogs.some((l) => l.date === ds && l.food_quality);
  };

  const dayBarHeight = (dayIndex: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dayIndex);
    const ds = localDateStr(d);
    const log = weekLogs.find((l) => l.date === ds);
    if (!log?.food_quality) return 0;
    const map: Record<string, number> = { great: 100, good: 75, regular: 50, poor: 25 };
    return map[log.food_quality] || 0;
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
    toast.success("Metas atualizadas!");
  };

  const macros = [
    { key: "calories", value: caloriesCurrent, goal: caloriesGoal, label: `de ${caloriesGoal.toLocaleString()} calorias`, suffix: "" },
    { key: "protein", value: proteinCurrent, goal: proteinGoal, label: `de ${proteinGoal}g proteína`, suffix: "g" },
    { key: "fiber", value: fiberCurrent, goal: fiberGoal, label: `de ${fiberGoal}g fibra`, suffix: "g" },
  ];

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <button onClick={() => navigateDate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground">{dateLabel}</h1>
        <button onClick={() => navigateDate(1)} className="p-2 -mr-2 active:scale-90 transition-transform">
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Hero card */}
      <div className="px-5 mt-3">
        <div
          className="rounded-[24px] p-5 space-y-4"
          style={{
            background: "linear-gradient(145deg, hsl(25, 85%, 55%) 0%, hsl(30, 90%, 50%) 50%, hsl(20, 80%, 45%) 100%)",
          }}
        >
          {/* Macros row */}
          <div className="flex items-start">
            {macros.map((m) => (
              <button
                key={m.key}
                onClick={() => setSelectedMacro(selectedMacro === m.key ? null : m.key)}
                className={cn(
                  "flex-1 text-center pt-2 transition-all duration-200 rounded-2xl",
                  selectedMacro === m.key
                    ? "bg-white/20 backdrop-blur-sm px-4 py-3"
                    : ""
                )}
              >
                <p className="text-2xl font-extrabold text-white">
                  {m.value}{m.suffix}
                </p>
                <p className="text-[11px] text-white/80 font-medium">{m.label}</p>
              </button>
            ))}
          </div>

          {/* Water intake */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="w-5 h-5 text-white/80" />
              <div>
                <p className="text-base font-bold text-white">
                  {waterGlasses} de {glassesGoal} copos
                </p>
                <p className="text-[11px] text-white/65 font-medium">consumo de água</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateWater(-1)}
                disabled={saving || waterGlasses <= 0}
                className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => updateWater(1)}
                disabled={saving}
                className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-white">Esta Semana</p>
              <button
                onClick={() => setGoalsOpen(true)}
                className="text-xs font-semibold text-white/80 flex items-center gap-1 active:scale-95 transition-transform"
              >
                Editar metas <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="relative h-16 mb-2">
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-white/25"
                style={{ top: "20%" }}
              />
              <div className="flex items-end justify-between h-full px-1">
                {DAYS.map((_, i) => {
                  const height = dayBarHeight(i);
                  return (
                    <div key={i} className="flex-1 flex justify-center relative">
                      {i === todayDayIndex && (
                        <div className="absolute -top-2 w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                      <div
                        className={cn(
                          "w-8 rounded-lg transition-all duration-300",
                          height > 0 ? "bg-white/30" : "bg-white/10"
                        )}
                        style={{ height: `${Math.max(height * 0.6, 8)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between px-1">
              {DAYS.map((day, i) => (
                <div key={i} className="flex-1 text-center">
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      i === todayDayIndex ? "text-white" : "text-white/50"
                    )}
                  >
                    {day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meals */}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Refeições de Hoje</h2>

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
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/nutrition")}
        className="fixed right-5 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-elevated flex items-center justify-center active:scale-90 transition-transform"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Edit Goals Drawer */}
      <EditGoalsDrawer
        open={goalsOpen}
        onOpenChange={setGoalsOpen}
        goals={{ calories: caloriesGoal, protein: proteinGoal, fiber: fiberGoal, water: glassesGoal }}
        onSave={handleSaveGoals}
      />
    </div>
  );
};

export default MealsPage;
