import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { Scale, Camera, ClipboardList, Lightbulb, Bell, Sparkles, Check } from "lucide-react";
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
  const { dose, latestWeight } = useApplicationData();

  const [todayLog, setTodayLog] = useState<any>(null);
  const [weightHistory, setWeightHistory] = useState<{ date: string; peso: number }[]>([]);
  const [insight, setInsight] = useState<string | null>(null);
  const [photoDrawerOpen, setPhotoDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weightPickerOpen, setWeightPickerOpen] = useState(false);
  const [symptomDrawerOpen, setSymptomDrawerOpen] = useState(false);
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekInjections, setWeekInjections] = useState<Set<string>>(new Set());
  const [hasPhotoToday, setHasPhotoToday] = useState(false);
  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false);

  const selectedDateStr = localDateStr(selectedDate);
  const isSelectedToday = selectedDateStr === localDateStr(new Date());

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
  }, [user]);


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

      const [logRes, weightRes, injRes, photoRes] = await Promise.all([
        supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", today).limit(1),
        supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).not("weight", "is", null).order("date", { ascending: true }).limit(30),
        supabase.from("injections").select("date").eq("user_id", user.id).gte("date", localDateStr(monday)).lte("date", localDateStr(sunday)),
        supabase.from("progress_photos").select("id").eq("user_id", user.id).eq("date", today).limit(1),
      ]);
      setTodayLog((logRes.data as any[])?.[0] || null);
      // Deduplicate by date — keep last entry per day
      const wRaw = ((weightRes.data as any[]) || []).map((l) => ({ date: l.date, peso: Number(l.weight) }));
      const byDate = new Map<string, number>();
      for (const w of wRaw) byDate.set(w.date, w.peso);
      const wData = Array.from(byDate, ([date, peso]) => ({ date, peso })).sort((a, b) => a.date.localeCompare(b.date));
      setWeightHistory(wData);
      setWeekInjections(new Set(((injRes.data as any[]) || []).map((i) => i.date)));
      setHasPhotoToday(((photoRes.data as any[]) || []).length > 0);

      if (wData.length >= 3) {
        const diff = wData[0].peso - wData[wData.length - 1].peso;
        if (diff > 0) setInsight(`Você perdeu ${diff.toFixed(1)} kg desde o início. Continue assim! 💪`);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

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

  const heroGradient = isInjectionDayVisual
    ? "linear-gradient(160deg, hsl(314, 16%, 42%) 0%, hsl(11, 40%, 62%) 50%, hsl(11, 55%, 70%) 100%)"
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
      {/* ── Animated floating blobs — only on injection days ── */}
      {isInjectionDayVisual && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Top-center glow */}
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full opacity-30 animate-[blob-breathe_12s_ease-in-out_infinite]"
            style={{
              background: "radial-gradient(circle, hsl(11, 55%, 60%) 0%, hsl(314, 20%, 50%) 40%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />
          {/* Top-left aurora streak */}
          <div
            className="absolute -top-10 -left-16 w-[300px] h-[200px] rounded-full opacity-25 animate-[blob-drift_18s_ease-in-out_infinite]"
            style={{
              background: "radial-gradient(ellipse 70% 50%, hsl(340, 30%, 55%) 0%, transparent 70%)",
              filter: "blur(25px)",
            }}
          />
          {/* Top-right warm accent */}
          <div
            className="absolute -top-6 -right-10 w-[260px] h-[220px] rounded-full opacity-20 animate-[blob-orbit_22s_ease-in-out_infinite_reverse]"
            style={{
              background: "radial-gradient(ellipse 60% 70%, hsl(25, 50%, 58%) 0%, transparent 70%)",
              filter: "blur(28px)",
            }}
          />
          {/* Mid-left floating blob */}
          <div
            className="absolute top-[35%] -left-8 w-[200px] h-[200px] rounded-full opacity-12 animate-[blob-float_15s_ease-in-out_infinite_2s]"
            style={{
              background: "radial-gradient(circle, hsl(25, 55%, 60%) 0%, transparent 70%)",
              filter: "blur(30px)",
            }}
          />
          {/* Bottom-right cool accent */}
          <div
            className="absolute top-[55%] -right-16 w-[280px] h-[280px] rounded-full opacity-10 animate-[blob-drift_20s_ease-in-out_infinite_4s]"
            style={{
              background: "radial-gradient(circle, hsl(340, 20%, 50%) 0%, transparent 70%)",
              filter: "blur(45px)",
            }}
          />
          {/* Bottom shimmer */}
          <div
            className="absolute bottom-[10%] left-[20%] w-[180px] h-[180px] rounded-full opacity-8 animate-[blob-orbit_25s_ease-in-out_infinite_6s]"
            style={{
              background: "radial-gradient(circle, hsl(11, 45%, 70%) 0%, transparent 70%)",
              filter: "blur(35px)",
            }}
          />
          {/* Noise texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              backgroundSize: "128px 128px",
            }}
          />
        </div>
      )}

        {/* ── Header with avatar + month + notifications ── */}
        <div className="relative pt-safe px-5 pb-1 flex items-center justify-between">
          <button
            onClick={() => navigate("/perfil")}
            className="text-base font-bold text-foreground/60 active:scale-90 transition-transform"
          >
            {(profile?.username?.[0] || profile?.name?.[0] || "U").toUpperCase()}
          </button>
          <button
            onClick={() => setCalendarDrawerOpen(true)}
            className="bg-muted/60 px-4 py-1.5 rounded-full active:scale-95 transition-all shadow-sm"
          >
            <p className="text-sm font-bold text-foreground">{monthLabel}</p>
          </button>
          <button
            onClick={() => setWhatsNewOpen(true)}
            className="p-2 -mr-2 active:scale-90 transition-transform"
          >
            <Bell className="w-[22px] h-[22px] text-foreground/60" />
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
                        ? "bg-primary text-primary-foreground shadow-elevated"
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

        {/* Hero content */}
        <div className="relative animate-fade-in-up pb-8">
          <div className="flex flex-col items-center justify-center text-center px-6 py-10">
            {hasTreatment ? (
              isInjectionDayVisual ? (
                <>
                  <p className="text-primary-foreground/90 text-base font-semibold tracking-wide">Mounjaro®</p>
                  <p className="text-primary-foreground text-5xl font-extrabold mt-1 tracking-tight">
                    {dose.currentDose}
                  </p>
                  <button
                    onClick={() => selectedDayHasInjection ? navigate("/plano-tratamento") : navigate("/registrar-aplicacao")}
                    className="mt-5 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-bold shadow-elevated active:scale-95 transition-transform"
                  >
                    {selectedDayHasInjection ? "Editar Tratamento" : "Registrar aplicação"}
                  </button>
                </>
              ) : selectedIsInPast ? (
                <>
                  <p className="text-foreground/40 text-base font-semibold tracking-wide">
                    {selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                  </p>
                  <p className="text-foreground text-2xl font-extrabold mt-2 leading-tight">
                    Sem aplicação registrada
                  </p>
                  <button
                    onClick={() => navigate("/registrar-aplicacao")}
                    className="mt-5 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-bold shadow-elevated active:scale-95 transition-transform"
                  >
                    Registrar aplicação
                  </button>
                </>
              ) : (
                <>
                  <p className="text-foreground/40 text-base font-semibold tracking-wide">
                    {isAfterNextApplication ? "Última aplicação" : "Próxima aplicação"}
                  </p>
                  <p className="text-foreground text-5xl font-extrabold mt-1 tracking-tight">
                    {isAfterNextApplication
                      ? daysSinceLastApplication !== null
                        ? daysSinceLastApplication === 0
                          ? "Hoje"
                          : daysSinceLastApplication === 1
                          ? "Ontem"
                          : `${daysSinceLastApplication} dias atrás`
                        : "—"
                      : daysUntilNextFromSelected !== null
                      ? daysUntilNextFromSelected === 0
                        ? "Hoje"
                        : daysUntilNextFromSelected === 1
                        ? "Amanhã"
                        : `${daysUntilNextFromSelected} dias`
                      : "—"}
                  </p>
                  <button
                    onClick={() => navigate("/registrar-aplicacao")}
                    className="mt-5 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-bold shadow-elevated active:scale-95 transition-transform"
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
                  className="mt-6 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-bold shadow-elevated active:scale-95 transition-transform"
                >
                  Registrar tratamento
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/progress")}
              className="mt-2 text-foreground/40 text-xs font-medium"
            >
              Ver tudo
            </button>
          </div>
        </div>

      {/* ── My daily check-in ── */}
      <div className="px-5 mb-5 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
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
              done: !!(todayLog?.symptom_nausea || todayLog?.symptom_fatigue || todayLog?.symptom_headache || todayLog?.symptom_constipation || todayLog?.symptom_diarrhea || todayLog?.symptom_injection_pain),
            },
            {
              label: "Atualizar\npeso",
              emoji: "⚖️",
              bg: "bg-card",
              action: () => setWeightPickerOpen(true),
              done: !!todayLog?.weight,
            },
            {
              label: "Fotos de\nprogresso",
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
                "rounded-2xl p-4 shadow-card flex flex-col items-center gap-2 active:scale-95 transition-transform border border-border/50 relative",
                item.bg
              )}
            >
              <span className="text-sm font-semibold text-foreground text-center whitespace-pre-line leading-tight">
                {item.label}
              </span>
              <span className="text-xl">{item.emoji}</span>
              {/* Checkbox */}
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  item.done
                    ? "border-transparent"
                    : "border-border/60 bg-transparent"
                )}
                style={item.done ? { background: "hsl(15, 75%, 75%)" } : undefined}
              >
                {item.done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Análise de Medicação ── */}
      <div className="px-5 mb-4 animate-fade-in-up" style={{ animationDelay: "140ms" }}>
        <button
          onClick={() => navigate("/analise-medicacao")}
          className="w-full bg-card rounded-2xl p-5 border border-border/50 shadow-card active:scale-[0.98] transition-transform text-left"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">Análise de Medicação</h3>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Análise inteligente da evolução do seu tratamento com sugestões de dose e comportamento</p>
        </button>
      </div>

      {/* ── Weight Trends ── */}
      <div className="px-5 mb-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <WeightTrendsCard weightHistory={weightHistory} />
      </div>


      {/* ── Side Effect History ── */}
      <div className="px-5 mb-4 animate-fade-in-up" style={{ animationDelay: "240ms" }}>
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
        onOpenChange={setSymptomDrawerOpen}
        date={selectedDate}
      />
      <PhotoDrawer
        open={photoDrawerOpen}
        onOpenChange={setPhotoDrawerOpen}
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
    </div>
  );
};

export default Dashboard;
