import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Freq = "daily" | "weekly" | "custom";

const SchedulePage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [freq, setFreq] = useState<Freq>(
    profile?.application_frequency === "daily"
      ? "daily"
      : profile?.application_frequency === "custom"
      ? "custom"
      : "weekly"
  );
  const [intervalDays, setIntervalDays] = useState(profile?.application_interval_days || 7);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(30);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        application_frequency: freq,
        application_interval_days: freq === "daily" ? 1 : freq === "weekly" ? 7 : intervalDays,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Agenda atualizada");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="px-6 pt-safe">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mt-4 mb-4 active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Agenda</h1>

        {/* Frequency card */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 mb-4">
          <p className="text-sm font-bold text-foreground mb-3">Frequência</p>
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {(["daily", "weekly", "custom"] as Freq[]).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFreq(f);
                  if (f === "daily") setIntervalDays(1);
                  if (f === "weekly") setIntervalDays(7);
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

          {freq === "custom" && (
            <>
              <div className="border-t border-border/30 my-4" />
              <p className="text-sm font-bold text-foreground mb-3">Frequência do tratamento</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-base font-medium text-foreground">A cada</span>
                <div className="flex flex-col items-center gap-1">
                  <button onClick={() => setIntervalDays((d) => Math.min(14, d + 1))} className="text-sm text-muted-foreground/50 h-5">
                    {intervalDays + 2 <= 14 ? intervalDays + 2 : ""}
                  </button>
                  <button onClick={() => setIntervalDays((d) => Math.min(14, d + 1))} className="text-base text-muted-foreground h-6">
                    {intervalDays + 1 <= 14 ? intervalDays + 1 : ""}
                  </button>
                  <div className="bg-muted rounded-xl px-6 py-3 my-1">
                    <span className="text-xl font-bold text-foreground">{intervalDays}</span>
                  </div>
                  <button onClick={() => setIntervalDays((d) => Math.max(1, d - 1))} className="text-base text-muted-foreground h-6">
                    {intervalDays - 1 >= 1 ? intervalDays - 1 : ""}
                  </button>
                  <button onClick={() => setIntervalDays((d) => Math.max(1, d - 1))} className="text-sm text-muted-foreground/50 h-5">
                    {intervalDays - 2 >= 1 ? intervalDays - 2 : ""}
                  </button>
                </div>
                <span className="text-base font-medium text-foreground">dias</span>
              </div>
            </>
          )}

          {/* Delivery time */}
          <div className="border-t border-border/30 my-4" />
          <p className="text-sm font-bold text-foreground mb-4">Horário de aplicação</p>
          <div className="flex items-center justify-center gap-2">
            {/* Hour (24h) */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => setHour((h) => (h + 2) % 24)} className="text-sm text-muted-foreground/50 h-5">
                {String((hour + 2) % 24).padStart(2, "0")}
              </button>
              <button onClick={() => setHour((h) => (h + 1) % 24)} className="text-base text-muted-foreground h-6">
                {String((hour + 1) % 24).padStart(2, "0")}
              </button>
              <div className="bg-muted rounded-xl px-5 py-3 my-1">
                <span className="text-xl font-bold text-foreground">{String(hour).padStart(2, "0")}</span>
              </div>
              <button onClick={() => setHour((h) => (h - 1 + 24) % 24)} className="text-base text-muted-foreground h-6">
                {String((hour - 1 + 24) % 24).padStart(2, "0")}
              </button>
              <button onClick={() => setHour((h) => (h - 2 + 24) % 24)} className="text-sm text-muted-foreground/50 h-5">
                {String((hour - 2 + 24) % 24).padStart(2, "0")}
              </button>
            </div>

            <span className="text-xl font-bold text-foreground">:</span>

            {/* Minute */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={() => setMinute((m) => (m + 10) % 60)} className="text-sm text-muted-foreground/50 h-5">
                {String((minute + 10) % 60).padStart(2, "0")}
              </button>
              <button onClick={() => setMinute((m) => (m + 5) % 60)} className="text-base text-muted-foreground h-6">
                {String((minute + 5) % 60).padStart(2, "0")}
              </button>
              <div className="bg-muted rounded-xl px-5 py-3 my-1">
                <span className="text-xl font-bold text-foreground">{String(minute).padStart(2, "0")}</span>
              </div>
              <button onClick={() => setMinute((m) => (m - 5 + 60) % 60)} className="text-base text-muted-foreground h-6">
                {String((minute - 5 + 60) % 60).padStart(2, "0")}
              </button>
              <button onClick={() => setMinute((m) => (m - 10 + 60) % 60)} className="text-sm text-muted-foreground/50 h-5">
                {String((minute - 10 + 60) % 60).padStart(2, "0")}
              </button>
            </div>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-full gradient-hero text-primary-foreground text-base font-bold active:scale-[0.98] transition-transform mt-4 shadow-elevated"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

export default SchedulePage;
