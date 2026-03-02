import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { ArrowLeft, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const goals = [
  { value: "weight_loss", label: "Perda de peso" },
  { value: "glycemic_control", label: "Controle glicêmico" },
  { value: "other", label: "Outro" },
];
const activityLevels = [
  { value: "sedentary", label: "Sedentário" },
  { value: "light", label: "Leve" },
  { value: "moderate", label: "Moderado" },
  { value: "high", label: "Alto" },
];
const sideEffectsList = ["Náusea", "Fadiga", "Dor de cabeça", "Diarreia", "Constipação", "Dor no local", "Azia", "Tontura"];
const healthConditionsList = ["Diabetes tipo 2", "Pré-diabetes", "Hipotireoidismo", "Hipertensão", "Colesterol alto", "SOP"];
const dietaryRestrictionsList = ["Vegetariana", "Vegana", "Sem glúten", "Sem lactose", "Low carb", "Sem restrições"];

const MyTriage = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { refresh } = useApplicationData();
  const [saving, setSaving] = useState(false);

  // Editable fields (NO dose, NO application date)
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [dailyWaterMl, setDailyWaterMl] = useState("");
  const [avgSleepHours, setAvgSleepHours] = useState("");
  const [weeklyWorkouts, setWeeklyWorkouts] = useState("");
  const [trackingPreference, setTrackingPreference] = useState("weekly");

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || "");
    setAge(profile.age?.toString() || "");
    setSex(profile.sex || "");
    setHeightCm(profile.height_cm?.toString() || "");
    setCurrentWeight(profile.current_weight?.toString() || "");
    setGoal(profile.goal || "");
    setActivityLevel(profile.activity_level || "");
    setHealthConditions((profile.health_conditions as string[]) || []);
    setMedications(profile.medications || "");
    setDietaryRestrictions((profile.dietary_restrictions as string[]) || []);
    setSelectedSideEffects((profile.common_side_effects as string[]) || []);
    setDailyWaterMl(profile.daily_water_ml?.toString() || "");
    setAvgSleepHours(profile.avg_sleep_hours?.toString() || "");
    setWeeklyWorkouts(profile.weekly_workouts?.toString() || "");
    setTrackingPreference(profile.tracking_preference || "weekly");
  }, [profile]);

  const toggleInArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const newWeight = currentWeight ? parseFloat(currentWeight) : null;
      const weightChanged = newWeight !== profile?.current_weight;

      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          age: age ? parseInt(age) : null,
          sex: sex || null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          current_weight: newWeight,
          goal,
          activity_level: activityLevel,
          health_conditions: healthConditions,
          medications: medications || null,
          dietary_restrictions: dietaryRestrictions,
          common_side_effects: selectedSideEffects,
          daily_water_ml: dailyWaterMl ? parseInt(dailyWaterMl) : null,
          avg_sleep_hours: avgSleepHours ? parseFloat(avgSleepHours) : null,
          weekly_workouts: weeklyWorkouts ? parseInt(weeklyWorkouts) : null,
          tracking_preference: trackingPreference,
        } as any)
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      // Recalculate SSOT (dose, metas, ranking)
      await refresh();

      toast.success("Dados atualizados com sucesso. ✅");
      navigate("/configuracoes");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const renderChipSelect = (options: string[], selected: string[], toggle: (item: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            "px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200",
            selected.includes(opt)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border text-foreground hover:border-primary/30"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Minha Triagem</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Edite seus dados pessoais e preferências</p>
        </div>
      </header>

      <div className="px-5 -mt-2 space-y-4">
        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Para alterar dose ou aplicações, use o <span className="font-semibold text-foreground">Histórico</span>.
          </p>
        </div>

        {/* Personal data */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 space-y-4">
          <h2 className="font-bold text-sm">Dados pessoais</h2>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Idade</label>
              <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Sexo</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                <option value="">Selecione</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Altura (cm)</label>
              <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Peso atual (kg)</label>
              <input type="number" step="0.1" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>
        </div>

        {/* Goal */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 space-y-3">
          <h2 className="font-bold text-sm">Objetivo</h2>
          <div className="grid grid-cols-3 gap-2">
            {goals.map((g) => (
              <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", goal === g.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Health */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 space-y-4">
          <h2 className="font-bold text-sm">Saúde</h2>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Condições de saúde</label>
            {renderChipSelect(healthConditionsList, healthConditions, (item) => setHealthConditions(toggleInArray(healthConditions, item)))}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Medicamentos</label>
            <textarea value={medications} onChange={(e) => setMedications(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Restrições alimentares</label>
            {renderChipSelect(dietaryRestrictionsList, dietaryRestrictions, (item) => setDietaryRestrictions(toggleInArray(dietaryRestrictions, item)))}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Efeitos colaterais comuns</label>
            {renderChipSelect(sideEffectsList, selectedSideEffects, (item) => setSelectedSideEffects(toggleInArray(selectedSideEffects, item)))}
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Nível de atividade física</label>
            <div className="grid grid-cols-2 gap-2">
              {activityLevels.map((l) => (
                <button key={l.value} type="button" onClick={() => setActivityLevel(l.value)}
                  className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", activityLevel === l.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Routine */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 space-y-4">
          <h2 className="font-bold text-sm">Rotina</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Água/dia (ml)</label>
              <input type="number" value={dailyWaterMl} onChange={(e) => setDailyWaterMl(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Sono (h)</label>
              <input type="number" step="0.5" value={avgSleepHours} onChange={(e) => setAvgSleepHours(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Treinos por semana</label>
            <input type="number" value={weeklyWorkouts} onChange={(e) => setWeeklyWorkouts(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">Acompanhamento</label>
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

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
          {saving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <><Check className="w-5 h-5" /> Salvar alterações</>
          )}
        </button>
      </div>
    </div>
  );
};

export default MyTriage;
