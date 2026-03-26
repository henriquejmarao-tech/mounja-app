import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { usePlan } from "@/hooks/usePlan";
import { useStreak } from "@/hooks/useStreak";
import { Scale, Camera, ClipboardList, Lightbulb, Bell, Sparkles, Check, ChevronRight, Lock } from "lucide-react";
import PremiumGateModal from "@/components/PremiumGateModal";
import FireIcon from "@/components/FireIcon";
import StreakModal from "@/components/StreakModal";

import { cn, localDateStr, diffCalendarDays } from "@/lib/utils";
import { toast } from "sonner";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import WeightTrendsCard from "@/components/dashboard/WeightTrendsCard";
import MilestonesCard from "@/components/dashboard/MilestonesCard";
import SideEffectHistoryCard from "@/components/dashboard/SideEffectHistoryCard";
import WeightPickerDrawer from "@/components/WeightPickerDrawer";
import SymptomCheckinDrawer from "@/components/SymptomCheckinDrawer";
import PhotoDrawer from "@/components/PhotoDrawer";
import CalendarDrawer from "@/components/dashboard/CalendarDrawer";
import WhatsNewDrawer from "@/components/dashboard/WhatsNewDrawer";
import WeightTrendsDrawer from "@/components/dashboard/WeightTrendsDrawer";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { dose, latestWeight, refresh: refreshAppData } = useApplicationData();
  const { isFree } = usePlan();
  const { streakCount, checkedInToday, isActive: streakActive, markCheckedIn, refresh: refreshStreak } = useStreak();
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [streakModalOpen, setStreakModalOpen] = useState(false);

  const [todayLog, setTodayLog] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<{ date: string; peso: number }[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [photoDrawerOpen, setPhotoDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weightPickerOpen, setWeightPickerOpen] = useState(false);
  const [symptomDrawerOpen, setSymptomDrawerOpen] = useState(false);
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [bellRead, setBellRead] = useState(() => localStorage.getItem("bell_free_meals_read") === "1");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekInjections, setWeekInjections] = useState<Set<string>>(new Set());
  const [hasPhotoToday, setHasPhotoToday] = useState(false);
  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false);

  const selectedDateStr = localDateStr(selectedDate);
  const isSelectedToday = selectedDateStr === localDateStr(new Date());

  const refreshTodayLog = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", selectedDateStr).limit(1);
    setTodayLog((data as any[])?.[0] || null);
  }, [user, selectedDateStr]);

  const handleWeightSave = useCallback(async (weight: number) => {
    if (!user) return;
    const dateStr = selectedDateStr;
    const { data } = await supabase.from("daily_logs").select("id").eq("user_id", user.id).eq("date", dateStr).limit(1);
    const existing = (data as any[])?.[0];
    if (existing) {
      await supabase.from("daily_logs").update({ weight }).eq("id", existing.id);
    } else {
      await supabase.from("daily_logs").insert({ user_id: user.id, date: dateStr, weight });
    }
    toast.success("Peso atualizado ✓");
    // Refresh weight history
    const { data: logs } = await supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).not("weight", "is", null).order("date", { ascending: true });
    if (logs) {
      const byDate = new Map<string, number>();
      for (const l of logs as any[]) byDate.set(l.date, Number(l.weight));
      setWeightHistory(Array.from(byDate, ([date, peso]) => ({ date, peso })).sort((a, b) => a.date.localeCompare(b.date)));
    }
    await refreshTodayLog();
    await refreshAppData();
    await checkAndMarkStreak();
  }, [user, selectedDateStr, refreshTodayLog]);

  // Check if all 3 daily actions are done, then mark streak
  const checkAndMarkStreak = useCallback(async () => {
    if (!user || !streakActive || checkedInToday) return;
    const todayStr = localDateStr(new Date());
    const [logRes, photoRes] = await Promise.all([
      supabase.from("daily_logs").select("weight, symptom_nausea").eq("user_id", user.id).eq("date", todayStr).limit(1),
      supabase.from("progress_photos").select("id").eq("user_id", user.id).eq("date", todayStr).limit(1),
    ]);
    const log = (logRes.data as any[])?.[0];
    const hasSymptoms = log?.symptom_nausea !== null && log?.symptom_nausea !== undefined;
    const hasWeight = !!log?.weight;
    const hasPhoto = ((photoRes.data as any[]) || []).length > 0;
    if (hasSymptoms && hasWeight && hasPhoto) {
      await markCheckedIn();
      await refreshStreak();
    }
  }, [user, streakActive, checkedInToday, markCheckedIn, refreshStreak]);

  // Week strip data
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    const days = [];
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push({
        label: labels[i],
        date: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
        full: d,
      });
    }
    return days;
  }, []);

  const monthLabel = useMemo(() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }, []);

  // Refetch todayLog + hasPhotoToday when selected date changes
  useEffect(() => {
    if (!user) return;
    const fetchForDate = async () => {
      const [logRes, photoRes] = await Promise.all([
        supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", selectedDateStr).limit(1),
        supabase.from("progress_photos").select("id").eq("user_id", user.id).eq("date", selectedDateStr).limit(1),
      ]);
      setTodayLog((logRes.data as any[])?.[0] || null);
      setHasPhotoToday(((photoRes.data as any[]) || []).length > 0);
    };
    fetchForDate();
  }, [user, selectedDateStr]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const today = localDateStr();

      // Get week boundaries for injection dots
      const todayDate = new Date();
      const dayOfWeek = todayDate.getDay();
      const monday = new Date(todayDate);
      monday.setDate(todayDate.getDate() - ((dayOfWeek + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const [weightRes, injRes] = await Promise.all([
        supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).not("weight", "is", null).order("date", { ascending: true }).limit(30),
        supabase.from("injections").select("date").eq("user_id", user.id).gte("date", localDateStr(monday)).lte("date", localDateStr(sunday)),
      ]);
      // Deduplicate by date — keep last entry per day
      const wRaw = ((weightRes.data as any[]) || []).map((l) => ({ date: l.date, peso: Number(l.weight) }));
      const byDate = new Map<string, number>();
      for (const w of wRaw) byDate.set(w.date, w.peso);
      const wData = Array.from(byDate, ([date, peso]) => ({ date, peso })).sort((a, b) => a.date.localeCompare(b.date));
      setWeightHistory(wData);
      setWeekInjections(new Set(((injRes.data as any[]) || []).map((i) => i.date)));

      if (wData.length >= 3) {
        const diff = wData[0].peso - wData[wData.length - 1].peso;
        if (diff > 0) setInsight(`Você perdeu ${diff.toFixed(1)} kg desde o início. Continue assim! 💪`);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Show streak modal once per day
  useEffect(() => {
    if (!streakActive || checkedInToday || loading) return;
    const key = `streak_modal_shown_${localDateStr(new Date())}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    // Small delay so dashboard renders first
    const t = setTimeout(() => setStreakModalOpen(true), 600);
    return () => clearTimeout(t);
  }, [streakActive, checkedInToday, loading]);

  const hasTreatment = !!dose.currentDose;
  const selectedDayHasInjection = weekInjections.has(selectedDateStr);
  const selectedIsInPast = selectedDateStr < localDateStr(new Date());
  const initialWeight = profile?.current_weight;
  const goalWeight = (profile as any)?.weight_goal ? parseFloat((profile as any).weight_goal) : null;
  const currentWeight = latestWeight || (weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].peso : null);

  // Calculate days until next injection from selected date perspective
  const daysUntilNextFromSelected = useMemo(() => {
    if (!dose.nextApplicationAt) return null;
    return diffCalendarDays(selectedDate, new Date(dose.nextApplicationAt));
  }, [dose.nextApplicationAt, selectedDate]);

  // Days since last application
  const daysSinceLastApplication = useMemo(() => {
    if (!dose.lastApplicationAt) return null;
    return diffCalendarDays(new Date(dose.lastApplicationAt), selectedDate);
  }, [dose.lastApplicationAt, selectedDate]);

  const isAfterNextApplication = daysUntilNextFromSelected !== null && daysUntilNextFromSelected < 0;

  // Check if selected future/today date IS the scheduled injection day
  const isScheduledInjectionDay = useMemo(() => {
    if (!dose.nextApplicationAt) return false;
    const nextDateStr = localDateStr(new Date(dose.nextApplicationAt));
    return selectedDateStr === nextDateStr;
  }, [dose.nextApplicationAt, selectedDateStr]);

  // Vibrant state: recorded injection OR scheduled injection day
  const isInjectionDayVisual = selectedDayHasInjection || isScheduledInjectionDay;

  // ── APPLICATION DAY MODE ──
  // Only activate the special hero for TODAY when it's an application day
  const todayStr = localDateStr(new Date());
  const isTodayApplicationDay = useMemo(() => {
    if (!dose.nextApplicationAt) return false;
    const nextDateStr = localDateStr(new Date(dose.nextApplicationAt));
    return todayStr === nextDateStr || nextDateStr <= todayStr;
  }, [dose.nextApplicationAt, todayStr]);

  const todayHasInjection = weekInjections.has(todayStr);
  
  // Application day mode ONLY for today
  const showApplicationDayMode = isSelectedToday && (isTodayApplicationDay || todayHasInjection);
  const applicationDayCompleted = isSelectedToday && todayHasInjection;

  // Background: only special gradient when today is application day AND viewing today
  const heroGradient = showApplicationDayMode
    ? applicationDayCompleted
      ? "linear-gradient(180deg, hsl(150, 20%, 96%) 0%, hsl(150, 15%, 97%) 40%, hsl(36, 20%, 97%) 100%)"
      : "linear-gradient(180deg, hsl(20, 40%, 96%) 0%, hsl(340, 20%, 96%) 40%, hsl(36, 25%, 97%) 100%)"
    : "linear-gradient(180deg, hsl(36, 30%, 96%) 0%, hsl(36, 25%, 97%) 40%, hsl(36, 33%, 95%) 100%)";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-nav relative transition-all duration-500 overflow-hidden"
      style={{ background: heroGradient }}
    >
        {/* ── Header ── */}
        <div className="relative pt-safe px-5 pb-1 flex items-center justify-between">
          <button
            onClick={() => navigate("/perfil")}
            className="text-base font-bold text-foreground/60 active:scale-90 transition-transform relative"
          >
            {(profile?.username?.[0] || profile?.name?.[0] || "U").toUpperCase()}
            {/* Streak badge */}
            {streakActive && streakCount > 0 && (
              <div
                className="absolute flex items-center gap-0.5 px-1 py-0.5 rounded-full"
                style={{
                  bottom: "-3px",
                  right: "-8px",
                  background: "white",
                  border: "2px solid hsl(var(--background))",
                  fontSize: "9px",
                  lineHeight: 1,
                }}
              >
                <FireIcon width={9} height={11} opacity={checkedInToday ? 1 : 0.4} />
                <span className="font-bold text-foreground" style={{ fontSize: "9px" }}>{streakCount}</span>
              </div>
            )}
          </button>
          {showApplicationDayMode && !applicationDayCompleted ? (
            <div className="flex flex-col items-center">
              <p className="text-sm font-bold text-foreground">Hoje é dia de aplicação</p>
              <p className="text-[10px] text-muted-foreground font-medium">Mantenha sua consistência semanal</p>
            </div>
          ) : (
            <button
              onClick={() => setCalendarDrawerOpen(true)}
              className="bg-muted/60 px-4 py-1.5 rounded-full active:scale-95 transition-all shadow-sm"
            >
              <p className="text-sm font-bold text-foreground">{monthLabel}</p>
            </button>
          )}
          <button
            onClick={() => {
              setBellRead(true);
              localStorage.setItem("bell_free_meals_read", "1");
              setWhatsNewOpen(true);
            }}
            className="p-2 -mr-2 active:scale-90 transition-transform relative"
          >
            <Bell className="w-[22px] h-[22px] text-foreground/60" />
            {!bellRead && (
              <span className="absolute top-1 right-0 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Week strip */}
        <div className="relative px-5 mt-2 mb-4">
          <div className="flex items-center justify-between">
            {weekDays.map((d, i) => {
              const isSelected = localDateStr(d.full) === selectedDateStr;
              const hasInjection = weekInjections.has(localDateStr(d.full));
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d.full)}
                  className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                >
                  <span className="text-[11px] font-semibold text-muted-foreground">{d.label}</span>
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                      isSelected
                        ? "gradient-hero text-primary-foreground shadow-elevated"
                        : d.isToday
                          ? "ring-2 ring-primary/30 text-foreground"
                          : "text-foreground/70"
                    )}
                  >
                    {d.date}
                  </div>
                  {/* Injection dot indicator */}
                  <div className={cn("w-1.5 h-1.5 rounded-full transition-all", hasInjection ? "bg-primary" : "bg-transparent")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── APPLICATION DAY MODE HERO ── */}
        {showApplicationDayMode && hasTreatment ? (
          <div className="relative animate-fade-in-up pb-4 px-5">
            {applicationDayCompleted ? (
              /* ── Completed state ── */
              <div className="rounded-3xl p-6 text-center"
                style={{ background: "linear-gradient(135deg, hsl(150, 35%, 94%) 0%, hsl(160, 25%, 96%) 100%)" }}>
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center animate-scale-in shadow-sm">
                    <Check className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-xl font-extrabold text-foreground tracking-tight">
                  Aplicação registrada ✓
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  Próxima dose em {dose.applicationIntervalDays} dias
                </p>
                <button
                  onClick={() => navigate("/plano-tratamento")}
                  className="mt-4 bg-white text-foreground px-7 py-2.5 rounded-full text-[13px] font-bold border border-border/50 shadow-sm active:scale-95 transition-transform"
                >
                  Ver plano de tratamento
                </button>
              </div>
            ) : (
              /* ── Active application day — gradient hero card ── */
              <div className="rounded-3xl p-6 pb-7 text-center relative overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #7B2FF7 0%, #C64BAF 50%, #F857A6 100%)",
                  boxShadow: "0 12px 32px rgba(123, 47, 247, 0.2), 0 4px 12px rgba(248, 87, 166, 0.15)",
                }}>
                {/* Subtle inner glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full opacity-20 pointer-events-none"
                  style={{ background: "radial-gradient(circle, white 0%, transparent 70%)", filter: "blur(40px)" }} />
                

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                  <span className="text-xs">💉</span>
                  <span className="text-[11px] font-bold text-white/90">Dia importante</span>
                </div>

                <p className="text-white text-[22px] font-extrabold tracking-tight leading-tight">
                  Hoje é dia de{"\n"}aplicação
                </p>
                <p className="text-white/70 text-[13px] mt-1.5 font-medium">
                  Mantenha sua rotina em dia e registre sua dose
                </p>

                {/* Dose */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  <span className="text-[13px] font-bold text-white">
                    {dose.currentDose} de {profile?.medication || "Mounjaro®"}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-5">
                  <button
                    onClick={() => navigate("/registrar-aplicacao")}
                    className="w-full py-4 rounded-2xl text-[15px] font-bold active:scale-[0.97] transition-all"
                    style={{
                      background: "white",
                      color: "#7B2FF7",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    }}
                  >
                    Registrar aplicação
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => navigate("/progress")}
              className="mt-2 w-full text-center text-foreground/40 text-[11px] font-medium opacity-60"
            >
              Ver tudo
            </button>
          </div>
        ) : (
          <>

            {/* Normal Hero content */}
            <div className="relative animate-fade-in-up pb-10">
              <div className="flex flex-col items-center justify-center text-center px-6 py-10">
                {hasTreatment ? (
                  selectedIsInPast ? (
                    selectedDayHasInjection ? (
                      <>
                        <p className="text-foreground/40 text-base font-semibold tracking-wide">
                          {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                        </p>
                        <p className="text-foreground text-2xl font-extrabold mt-2 leading-tight">
                          Aplicação registrada ✓
                        </p>
                        <p className="text-muted-foreground text-sm mt-1 font-medium">
                          {dose.currentDose} de {profile?.medication || "Mounjaro®"}
                        </p>
                        <button
                          onClick={() => navigate("/plano-tratamento")}
                          className="mt-6 gradient-hero text-primary-foreground px-10 py-3.5 rounded-full text-[15px] font-bold active:scale-95 transition-transform animate-cta-entrance"
                          style={{ boxShadow: "0px 8px 20px rgba(128, 0, 128, 0.15)" }}
                        >
                          Ver plano de tratamento
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-foreground/40 text-base font-semibold tracking-wide">
                          {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                        </p>
                        <p className="text-foreground text-2xl font-extrabold mt-2 leading-tight">
                          Sem aplicação registrada
                        </p>
                        <button
                          onClick={() => navigate("/registrar-aplicacao")}
                          className="mt-6 gradient-hero text-primary-foreground px-10 py-3.5 rounded-full text-[15px] font-bold active:scale-95 transition-transform animate-cta-entrance"
                          style={{ boxShadow: "0px 8px 20px rgba(128, 0, 128, 0.15)" }}
                        >
                          Registrar aplicação
                        </button>
                      </>
                    )
                  ) : isSelectedToday ? (
                    <>
                      <p className="text-foreground/40 text-base font-semibold tracking-wide">
                        Próxima aplicação
                      </p>
                      <p className="text-foreground text-5xl font-extrabold mt-1 tracking-tight">
                        {daysUntilNextFromSelected !== null
                          ? daysUntilNextFromSelected === 0
                            ? "Hoje"
                            : daysUntilNextFromSelected === 1
                            ? "Amanhã"
                            : `${daysUntilNextFromSelected} dias`
                          : "—"}
                      </p>
                      <button
                        onClick={() => navigate("/registrar-aplicacao")}
                        className="mt-6 gradient-hero text-primary-foreground px-10 py-3.5 rounded-full text-[15px] font-bold active:scale-95 transition-transform animate-cta-entrance"
                        style={{ boxShadow: "0px 8px 20px rgba(128, 0, 128, 0.15)" }}
                      >
                        Registrar aplicação
                      </button>
                    </>
                  ) : (
                    /* Future day */
                    <>
                      <p className="text-foreground/40 text-base font-semibold tracking-wide">
                        Última aplicação
                      </p>
                      <p className="text-foreground text-5xl font-extrabold mt-1 tracking-tight">
                        {daysSinceLastApplication !== null
                          ? daysSinceLastApplication === 0
                            ? "Hoje"
                            : daysSinceLastApplication === 1
                            ? "Ontem"
                            : `${daysSinceLastApplication} dias atrás`
                          : "—"}
                      </p>
                      <button
                        onClick={() => navigate("/registrar-aplicacao")}
                        className="mt-6 gradient-hero text-primary-foreground px-10 py-3.5 rounded-full text-[15px] font-bold active:scale-95 transition-transform animate-cta-entrance"
                        style={{ boxShadow: "0px 8px 20px rgba(128, 0, 128, 0.15)" }}
                      >
                        Registrar aplicação
                      </button>
                    </>
                  )
                ) : (
                  <>
                    <p className="text-foreground text-2xl font-extrabold leading-tight">
                      Registre seu{"\n"}primeiro tratamento
                    </p>
                    <button
                      onClick={() => navigate("/log")}
                      className="mt-6 gradient-hero text-primary-foreground px-10 py-3.5 rounded-full text-[15px] font-bold active:scale-95 transition-transform animate-cta-entrance"
                      style={{ boxShadow: "0px 8px 20px rgba(128, 0, 128, 0.15)" }}
                    >
                      Registrar tratamento
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate("/progress")}
                  className="mt-2 text-foreground/40 text-[11px] font-medium opacity-60"
                >
                  Ver tudo
                </button>
              </div>
            </div>
          </>
        )}

      {/* ── My daily check-in ── */}
      <div className="px-5 mb-6 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
        <h2 className="text-lg font-bold text-foreground mb-3">
          {isSelectedToday ? "Meu check-in diário" : `Check-in de ${selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Registrar\nsintomas",
              emoji: "📋",
              bg: "bg-card",
              action: () => setSymptomDrawerOpen(true),
              done: todayLog?.symptom_nausea !== null && todayLog?.symptom_nausea !== undefined,
            },
            {
              label: "Atualizar\npeso",
              emoji: "⚖️",
              bg: "bg-card",
              action: () => setWeightPickerOpen(true),
              done: !!todayLog?.weight,
            },
            {
              label: "Progresso\nvisual",
              emoji: "📸",
              bg: "bg-card",
              action: () => setPhotoDrawerOpen(true),
              done: hasPhotoToday,
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className={cn(
                "rounded-2xl p-3.5 shadow-card flex flex-col items-center gap-2 active:scale-95 transition-all relative",
                item.bg,
                item.done ? "border border-border/50" : "gradient-border-spin"
              )}
              style={item.done ? { background: "hsl(var(--primary) / 0.06)" } : undefined}
            >
              <span className="text-sm font-semibold text-foreground text-center whitespace-pre-line leading-tight">
                {item.label}
              </span>
              <span className="text-xl">{item.emoji}</span>
              {/* Checkbox */}
              <div
                className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center transition-all",
                  item.done
                    ? "bg-transparent"
                    : "border-2 border-border/60 bg-transparent"
                )}
              >
                {item.done && (
                  <div className="w-5 h-5 rounded-md gradient-hero flex items-center justify-center animate-scale-in">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Análise de Medicação ── */}
      <div className="px-5 mb-6 animate-fade-in-up" style={{ animationDelay: "140ms" }}>
        <button
          onClick={() => isFree ? setPremiumModalOpen(true) : navigate("/analise-medicacao")}
          className={cn(
            "w-full bg-card rounded-2xl p-5 border border-border/50 shadow-card active:scale-[0.98] transition-transform text-left relative overflow-hidden",
            isFree && "opacity-80"
          )}
        >
          {isFree && (
            <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl">
              <Lock className="w-5 h-5 text-muted-foreground mb-1.5" />
              <span className="text-[11px] font-semibold text-muted-foreground">Disponível no plano premium</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground" style={{ color: "hsl(0 0% 12%)" }}>Análise de Medicação</h3>
            <div className="w-8 h-8 rounded-xl gradient-hero flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Análise inteligente da evolução do seu tratamento com sugestões de dose e comportamento</p>
          <div className="flex items-center gap-1 mt-3">
            <span className="text-xs font-semibold text-muted-foreground/50">Ver análise</span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          </div>
        </button>
      </div>

      {/* Premium Gate Modal */}
      <PremiumGateModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
        title="Funcionalidade premium"
        description="A análise inteligente da sua medicação está disponível apenas para usuários premium."
      />

      {/* ── Weight Trends ── */}
      <div className="px-5 mb-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <WeightTrendsCard weightHistory={weightHistory} onExpand={() => setWeightDrawerOpen(true)} onRegisterWeight={() => setWeightPickerOpen(true)} />
      </div>


      {/* ── Side Effect History ── */}
      <div className="px-5 mb-6 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
        <SideEffectHistoryCard selectedDate={selectedDateStr} />
      </div>

      {/* ── Insight ── */}
      {insight && (
        <div className="px-5 mb-4 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
          <div className="bg-accent rounded-2xl p-4 border border-primary/10 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      <WeightPickerDrawer
        open={weightPickerOpen}
        onOpenChange={setWeightPickerOpen}
        initialWeight={currentWeight ? Number(currentWeight) : 74}
        onSave={handleWeightSave}
      />
      <SymptomCheckinDrawer
        open={symptomDrawerOpen}
        onOpenChange={(open) => {
          setSymptomDrawerOpen(open);
          if (!open) refreshTodayLog();
        }}
        date={selectedDate}
        onCheckinSaved={async () => {
          await refreshTodayLog();
          await checkAndMarkStreak();
        }}
      />
      <PhotoDrawer
        open={photoDrawerOpen}
        onOpenChange={async (open) => {
          setPhotoDrawerOpen(open);
          if (!open) {
            // Re-check photo status after closing
            if (user) {
              const { data } = await supabase.from("progress_photos").select("id").eq("user_id", user.id).eq("date", selectedDateStr).limit(1);
              const hasPhoto = ((data as any[]) || []).length > 0;
              setHasPhotoToday(hasPhoto);
              await checkAndMarkStreak();
            }
          }
        }}
        date={selectedDate}
      />
      <CalendarDrawer
        open={calendarDrawerOpen}
        onOpenChange={setCalendarDrawerOpen}
      />
      <WhatsNewDrawer
        open={whatsNewOpen}
        onOpenChange={setWhatsNewOpen}
      />
      <WeightTrendsDrawer
        open={weightDrawerOpen}
        onOpenChange={setWeightDrawerOpen}
        weightHistory={weightHistory}
      />
      <StreakModal
        open={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streakCount={streakCount}
        onCheckin={() => {
          setStreakModalOpen(false);
          setSymptomDrawerOpen(true);
        }}
      />
    </div>
  );
};

export default Dashboard;
