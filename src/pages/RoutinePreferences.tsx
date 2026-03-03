import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RoutinePreferences = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { refresh } = useApplicationData();
  const [saving, setSaving] = useState(false);

  const [dailyWaterMl, setDailyWaterMl] = useState("");
  const [avgSleepHours, setAvgSleepHours] = useState("");
  const [weeklyWorkouts, setWeeklyWorkouts] = useState("");
  const [trackingPreference, setTrackingPreference] = useState("weekly");

  useEffect(() => {
    if (!profile) return;
    setDailyWaterMl(profile.daily_water_ml?.toString() || "");
    setAvgSleepHours(profile.avg_sleep_hours?.toString() || "");
    setWeeklyWorkouts(profile.weekly_workouts?.toString() || "");
    setTrackingPreference(profile.tracking_preference || "weekly");
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          daily_water_ml: dailyWaterMl ? parseInt(dailyWaterMl) : null,
          avg_sleep_hours: avgSleepHours ? parseFloat(avgSleepHours) : null,
          weekly_workouts: weeklyWorkouts ? parseInt(weeklyWorkouts) : null,
          tracking_preference: trackingPreference,
          routine_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      await refresh();
      toast.success("Rotina salva! ✅");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Rotina e Preferências</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Informações para montar seu plano personalizado.</p>
        </div>
      </header>

      <div className="px-5 mt-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Água por dia (ml estimado)</label>
            <input type="number" value={dailyWaterMl} onChange={(e) => setDailyWaterMl(e.target.value)} placeholder="Ex: 2000" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Sono médio (horas)</label>
            <input type="number" step="0.5" value={avgSleepHours} onChange={(e) => setAvgSleepHours(e.target.value)} placeholder="Ex: 7" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Treinos por semana</label>
            <input type="number" value={weeklyWorkouts} onChange={(e) => setWeeklyWorkouts(e.target.value)} placeholder="Ex: 3" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Preferência de acompanhamento</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "daily", label: "Diário" },
                { value: "weekly", label: "Semanal" },
              ].map((p) => (
                <button key={p.value} type="button" onClick={() => setTrackingPreference(p.value)}
                  className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", trackingPreference === p.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
          {saving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <><Check className="w-5 h-5" /> Salvar</>
          )}
        </button>
      </div>
    </div>
  );
};

export default RoutinePreferences;
