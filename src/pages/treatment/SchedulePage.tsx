import React, { useState } from "react";
import { ChevronLeft, ChevronDown, Bell, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

type Freq = "daily" | "weekly" | "custom";

const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

function ScrollColumn({ items, selected, onChange }: { items: (string | number)[]; selected: string | number; onChange: (v: string | number) => void }) {
  const containerHeight = VISIBLE * ITEM_HEIGHT;
  const ref = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "auto" });
    }
  }, []);

  const handleScroll = () => {
    if (!ref.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const index = Math.round(ref.current!.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      onChange(items[clamped]);
      ref.current!.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
    }, 80);
  };

  return (
    <div className="relative overflow-hidden" style={{ height: containerHeight, flex: 1 }}>
      <div
        className="absolute left-0 right-0 bg-muted/60 rounded-xl pointer-events-none z-10"
        style={{ top: CENTER * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory sc"
        style={{ paddingTop: CENTER * ITEM_HEIGHT, paddingBottom: CENTER * ITEM_HEIGHT, scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.sc::-webkit-scrollbar{display:none}`}</style>
        {items.map((val) => (
          <div
            key={val}
            className={cn(
              "flex items-center justify-center snap-center transition-all",
              val === selected ? "text-foreground text-2xl font-bold" : "text-muted-foreground/50 text-lg"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {val}
          </div>
        ))}
      </div>
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
    </div>
  );
}

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const intervalDaysList = Array.from({ length: 14 }, (_, i) => String(i + 1));

const SchedulePage = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { refresh } = useApplicationData();

  const [freq, setFreq] = useState<Freq>(
    profile?.application_frequency === "daily"
      ? "daily"
      : profile?.application_frequency === "custom"
      ? "custom"
      : "weekly"
  );
  const [intervalDays, setIntervalDays] = useState(String(profile?.application_interval_days || 7));

  const now = new Date();
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(String(now.getMinutes()).padStart(2, "0"));

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showIntervalPicker, setShowIntervalPicker] = useState(false);

  const freqLabel = freq === "daily" ? "Diário" : freq === "weekly" ? "Semanal" : `A cada ${intervalDays} dias`;
  const timeLabel = `${hour}:${minute}`;

  const handleSave = async () => {
    if (!user) return;
    const intDays = freq === "daily" ? 1 : freq === "weekly" ? 7 : Number(intervalDays);
    const { error } = await supabase
      .from("profiles")
      .update({
        application_frequency: freq,
        application_interval_days: intDays,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    await refreshProfile();
    await refresh();
    toast.success("Agenda atualizada");
    navigate(-1);
  };

  return (
    <div
      className="min-h-screen pb-nav flex flex-col"
      style={{ background: "linear-gradient(180deg, hsl(20, 30%, 97%) 0%, hsl(36, 25%, 97%) 40%, hsl(0, 0%, 98%) 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-safe pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6 text-foreground/70" />
        </button>
        <div className="flex-1" />
        <div className="w-10" />
      </div>

      <div className="px-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(200,60%,95%), hsl(220,50%,95%))" }}
          >
            <Bell className="w-5 h-5" style={{ color: "hsl(210,50%,50%)" }} />
          </div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Agenda</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium mt-1 ml-[52px]">Configure frequência e horário</p>
      </div>

      <div className="flex-1 px-5 space-y-3">
        {/* Frequency selector */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-card p-4">
          <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide mb-3">Frequência</p>
          <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
            {(["daily", "weekly", "custom"] as Freq[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFreq(f);
                  if (f === "daily") setIntervalDays("1");
                  if (f === "weekly") setIntervalDays("7");
                }}
                className={cn(
                  "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  freq === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {f === "daily" ? "Diário" : f === "weekly" ? "Semanal" : "Personalizado"}
              </button>
            ))}
          </div>
        </div>

        {/* Custom interval card */}
        {freq === "custom" && (
          <button
            onClick={() => setShowIntervalPicker(true)}
            className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(200,60%,95%), hsl(220,50%,95%))" }}
            >
              <Bell className="w-5 h-5" style={{ color: "hsl(210,50%,50%)" }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Intervalo</p>
              <p className="text-[15px] font-semibold text-foreground mt-0.5">A cada {intervalDays} dias</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
          </button>
        )}

        {/* Time card */}
        <button
          onClick={() => setShowTimePicker(true)}
          className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(200,60%,95%), hsl(220,50%,95%))" }}
          >
            <Clock className="w-5 h-5" style={{ color: "hsl(210,50%,50%)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Horário de aplicação</p>
            <p className="text-[15px] font-semibold text-foreground mt-0.5">{timeLabel}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        </button>
      </div>

      {/* CTA */}
      <div className="px-5 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-all"
          style={{
            background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
            boxShadow: "0 8px 24px hsl(300 60% 50% / 0.2), 0 2px 8px hsl(270 80% 60% / 0.15)",
          }}
        >
          Confirmar
        </button>
      </div>

      {/* Time Picker Drawer */}
      <Drawer open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <h3 className="text-lg font-bold text-foreground text-center pt-2 mb-2">Horário de aplicação</h3>
            <div className="flex items-center justify-center gap-4 py-4">
              <ScrollColumn items={hours} selected={hour} onChange={(v) => setHour(v as string)} />
              <span className="text-2xl font-bold text-foreground">:</span>
              <ScrollColumn items={minutes} selected={minute} onChange={(v) => setMinute(v as string)} />
            </div>
            <button
              onClick={() => setShowTimePicker(false)}
              className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-transform"
              style={{
                background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
                boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)",
              }}
            >
              Confirmar
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Interval Picker Drawer */}
      <Drawer open={showIntervalPicker} onOpenChange={setShowIntervalPicker}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <h3 className="text-lg font-bold text-foreground text-center pt-2 mb-2">Intervalo (dias)</h3>
            <div className="flex items-center justify-center gap-2 py-4">
              <ScrollColumn items={intervalDaysList} selected={intervalDays} onChange={(v) => setIntervalDays(v as string)} />
              <span className="text-lg font-semibold text-muted-foreground ml-2">dias</span>
            </div>
            <button
              onClick={() => setShowIntervalPicker(false)}
              className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-transform"
              style={{
                background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
                boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)",
              }}
            >
              Confirmar
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default SchedulePage;
