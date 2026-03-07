import { useState, useEffect, useCallback } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { localDateStr, cn } from "@/lib/utils";
import { toast } from "sonner";
import { X, ChevronDown, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WeightPickerDrawer from "@/components/WeightPickerDrawer";
import PhotoDrawer from "@/components/PhotoDrawer";
import SymptomCheckinDrawer from "@/components/SymptomCheckinDrawer";

interface CalendarDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DayData {
  injection: { dose: string; site: string | null; notes: string | null } | null;
  hasLog: boolean;
}

const CalendarDrawer = ({ open, onOpenChange }: CalendarDrawerProps) => {
  const { user } = useAuth();
  const { setConfirmedApplication, refresh } = useApplicationData();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [injectionDates, setInjectionDates] = useState<Record<string, any>>({});
  const [logDates, setLogDates] = useState<string[]>([]);
  const [dayData, setDayData] = useState<DayData>({ injection: null, hasLog: false });

  const [weightPickerOpen, setWeightPickerOpen] = useState(false);
  const [symptomDrawerOpen, setSymptomDrawerOpen] = useState(false);
  const [photoDrawerOpen, setPhotoDrawerOpen] = useState(false);

  const dateStr = localDateStr(selectedDate);
  const isToday = dateStr === localDateStr(new Date());
  const isFuture = selectedDate > new Date() && !isToday;

  const dateLabel = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Fetch all injections and log dates for calendar indicators
  const fetchCalendarData = useCallback(async () => {
    if (!user) return;
    const [injRes, logRes] = await Promise.all([
      supabase.from("injections").select("date, dose, site, notes").eq("user_id", user.id),
      supabase.from("daily_logs").select("date").eq("user_id", user.id),
    ]);

    const injMap: Record<string, any> = {};
    ((injRes.data as any[]) || []).forEach((inj) => {
      injMap[inj.date] = inj;
    });
    setInjectionDates(injMap);
    setLogDates(((logRes.data as any[]) || []).map((l) => l.date));
  }, [user]);

  useEffect(() => {
    if (open) fetchCalendarData();
  }, [open, fetchCalendarData]);

  // Load data for selected date
  useEffect(() => {
    const inj = injectionDates[dateStr] || null;
    const hasLog = logDates.includes(dateStr);
    setDayData({ injection: inj, hasLog });
  }, [dateStr, injectionDates, logDates]);

  const handleAddTreatment = () => {
    // Navigate to register injection page — could pass date as state
    onOpenChange(false);
    navigate("/registrar-aplicacao", { state: { date: dateStr } });
  };

  const handleWeightSave = async (weight: number) => {
    if (!user) return;
    const { data } = await supabase
      .from("daily_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .limit(1);
    const existing = (data as any[])?.[0];
    if (existing) {
      await supabase.from("daily_logs").update({ weight }).eq("id", existing.id);
    } else {
      await supabase.from("daily_logs").insert({ user_id: user.id, date: dateStr, weight });
    }
    toast.success("Peso atualizado ✓");
    await refresh();
  };

  // Modifiers for calendar
  const injectionDays = Object.keys(injectionDates).map((d) => new Date(d + "T12:00:00"));
  const logDays = logDates.map((d) => new Date(d + "T12:00:00"));

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <div />
            <h2 className="text-base font-bold text-foreground">Calendário</h2>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="px-4 overflow-y-auto max-h-[60vh]">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              modifiers={{
                hasInjection: injectionDays,
                hasLog: logDays,
              }}
              modifiersStyles={{
                hasInjection: { fontWeight: 700 },
              }}
              className="w-full"
            />
          </div>

          {/* Bottom section with selected date info */}
          <div className="bg-muted/30 border-t border-border/50 px-5 pt-4 pb-safe">
            <button className="flex items-center gap-1 mb-3">
              <span className="text-base font-bold text-foreground">{dateLabel}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Treatment info or add treatment */}
            {dayData.injection ? (
              <div className="bg-card rounded-2xl p-4 border border-border/50 mb-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {dayData.injection.dose} of Mounjaro®
                  </p>
                  {dayData.injection.site && (
                    <p className="text-xs text-muted-foreground">{dayData.injection.site}</p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={handleAddTreatment}
                disabled={isFuture}
                className="w-full bg-card rounded-2xl p-4 border border-border/50 mb-3 flex items-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-40"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Add treatment</span>
              </button>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[
                {
                  label: "Log side\neffects",
                  emoji: "📋",
                  action: () => setSymptomDrawerOpen(true),
                },
                {
                  label: "Update\nweight",
                  emoji: "⚖️",
                  action: () => setWeightPickerOpen(true),
                },
                {
                  label: "Progress\nphoto",
                  emoji: "📸",
                  action: () => setPhotoDrawerOpen(true),
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  disabled={isFuture}
                  className="bg-card rounded-2xl p-4 border border-border/50 flex flex-col items-center gap-2 active:scale-95 transition-transform disabled:opacity-40"
                >
                  <span className="text-xs font-semibold text-foreground text-center whitespace-pre-line leading-tight">
                    {item.label}
                  </span>
                  <span className="text-2xl">{item.emoji}</span>
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <WeightPickerDrawer
        open={weightPickerOpen}
        onOpenChange={setWeightPickerOpen}
        initialWeight={74}
        onSave={handleWeightSave}
      />
      <SymptomCheckinDrawer
        open={symptomDrawerOpen}
        onOpenChange={setSymptomDrawerOpen}
      />
      <PhotoDrawer
        open={photoDrawerOpen}
        onOpenChange={setPhotoDrawerOpen}
      />
    </>
  );
};

export default CalendarDrawer;
