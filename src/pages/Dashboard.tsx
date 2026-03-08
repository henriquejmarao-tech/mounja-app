import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { Scale, Camera, ClipboardList, Lightbulb, CalendarDays, Newspaper } from "lucide-react";
import { cn, localDateStr } from "@/lib/utils";
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
    if (logs) setWeightHistory((logs as any[]).map((l) => ({ date: l.date, peso: l.weight })));
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

      const [logRes, weightRes, injRes] = await Promise.all([
        supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", today).limit(1),
        supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).not("weight", "is", null).order("date", { ascending: true }).limit(30),
        supabase.from("injections").select("date").eq("user_id", user.id).gte("date", localDateStr(monday)).lte("date", localDateStr(sunday)),
      ]);
      setTodayLog((logRes.data as any[])?.[0] || null);
      const wData = ((weightRes.data as any[]) || []).map((l) => ({ date: l.date, peso: Number(l.weight) }));
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

  const hasTreatment = !!dose.currentDose;
  const selectedDayHasInjection = weekInjections.has(selectedDateStr);
  const selectedIsInPast = selectedDateStr < localDateStr(new Date());
  const initialWeight = profile?.current_weight;
  const goalWeight = profile?.goal ? parseFloat(profile.goal) : null;
  const currentWeight = latestWeight || (weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].peso : null);

  // Calculate days until next injection from selected date perspective
  const daysUntilNextFromSelected = useMemo(() => {
    if (!dose.nextApplicationAt) return null;
    const nextDate = new Date(dose.nextApplicationAt);
    const diffMs = nextDate.getTime() - selectedDate.getTime();
    return Math.max(0, Math.ceil(diffMs / 86400000));
  }, [dose.nextApplicationAt, selectedDate]);

  // Hero card state: 3 modes
  // 1. Injection day (vibrant) — selected day has injection record
  // 2. Past without injection (muted) — can log a past injection
  // 3. Present/future without injection (muted) — shows countdown
  const heroGradient = selectedDayHasInjection
    ? "linear-gradient(160deg, hsl(314, 16%, 42%) 0%, hsl(11, 40%, 62%) 50%, hsl(11, 55%, 70%) 100%)"
    : "linear-gradient(160deg, hsl(314, 16%, 82%) 0%, hsl(280, 18%, 85%) 50%, hsl(250, 20%, 88%) 100%)";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* ── Header with icons + month ── */}
      <div className="pt-safe px-5 pb-1 flex items-center justify-between">
        <button
          onClick={() => setWhatsNewOpen(true)}
          className="p-2 -ml-2 active:scale-90 transition-transform"
        >
          <Newspaper className="w-[22px] h-[22px] text-primary" />
        </button>
        <p className="text-base font-bold text-foreground">{monthLabel}</p>
        <button
          onClick={() => setCalendarDrawerOpen(true)}
          className="p-2 -mr-2 active:scale-90 transition-transform"
        >
          <CalendarDays className="w-[22px] h-[22px] text-primary" />
        </button>
      </div>

      {/* Week strip */}
      <div className="px-5 mt-2 mb-4">
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

      <div className="px-5 mb-5 animate-fade-in-up">
        <div
          className="rounded-3xl overflow-hidden relative transition-all duration-500"
          style={{
            background: heroGradient,
            minHeight: "220px",
          }}
        >
          {/* Decorative wave shapes */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 20% 80%, hsla(0,0%,100%,0.15) 0%, transparent 60%),
                radial-gradient(ellipse 60% 40% at 80% 20%, hsla(0,0%,100%,0.1) 0%, transparent 50%)
              `,
            }}
          />

          <div className="relative flex flex-col items-center justify-center text-center px-6 py-10">
            {hasTreatment ? (
              selectedDayHasInjection ? (
                /* ── STATE 1: Injection day (vibrant) ── */
                <>
                  <p className="text-primary-foreground/90 text-base font-semibold tracking-wide">Mounjaro®</p>
                  <p className="text-primary-foreground text-5xl font-extrabold mt-1 tracking-tight">
                    {dose.currentDose}
                  </p>
                  <button
                    onClick={() => navigate("/plano-tratamento")}
                    className="mt-5 bg-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-bold shadow-elevated active:scale-95 transition-transform"
                  >
                    Editar Tratamento
                  </button>
                </>
              ) : selectedIsInPast ? (
                /* ── STATE 2: Past day without injection (muted) ── */
                <>
                  <p className="text-secondary text-base font-semibold tracking-wide">
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
                /* ── STATE 3: Present/future without injection (muted) ── */
                <>
                  <p className="text-secondary text-base font-semibold tracking-wide">Próxima aplicação</p>
                  <p className="text-foreground text-5xl font-extrabold mt-1 tracking-tight">
                    {daysUntilNextFromSelected !== null
                      ? daysUntilNextFromSelected === 0
                        ? "Hoje"
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
            },
            {
              label: "Atualizar\npeso",
              emoji: "⚖️",
              bg: "bg-card",
              action: () => setWeightPickerOpen(true),
            },
            {
              label: "Fotos de\nprogresso",
              emoji: "📸",
              bg: "bg-card",
              action: () => setPhotoDrawerOpen(true),
            },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className={cn(
                "rounded-2xl p-4 shadow-card flex flex-col items-center gap-3 active:scale-95 transition-transform border border-border/50",
                item.bg
              )}
            >
              <span className="text-sm font-semibold text-foreground text-center whitespace-pre-line leading-tight">
                {item.label}
              </span>
              <span className="text-3xl">{item.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Análise de Medicação (Em breve) ── */}
      <div className="px-5 mb-4 animate-fade-in-up" style={{ animationDelay: "140ms" }}>
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Análise de Medicação</h3>
              <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Em breve</span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-6 opacity-50">
            <span className="text-4xl mb-3">💊</span>
            <p className="text-sm text-muted-foreground text-center">Acompanhe a evolução do seu tratamento com análises inteligentes</p>
          </div>
        </div>
      </div>

      {/* ── Weight Trends ── */}
      <div className="px-5 mb-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <WeightTrendsCard weightHistory={weightHistory} />
      </div>

      {/* ── Milestones ── */}
      <div className="px-5 mb-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
        <MilestonesCard
          initialWeight={initialWeight}
          currentWeight={currentWeight}
          goalWeight={goalWeight}
        />
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
