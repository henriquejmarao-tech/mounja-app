import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const doses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];
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
const intervalOptions = [7, 10, 14];

const TOTAL_STEPS = 4;

const Triage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Identification + treatment basics
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [goal, setGoal] = useState("");
  const [currentDose, setCurrentDose] = useState("");
  const [lastApplicationDate, setLastApplicationDate] = useState("");
  const [applicationInterval, setApplicationInterval] = useState<number>(7);
  const [customInterval, setCustomInterval] = useState("");
  const [hasMedicalGuidance, setHasMedicalGuidance] = useState<boolean | null>(null);
  const [medicalSpecialty, setMedicalSpecialty] = useState("");

  // Step 2: Dose history
  const [hasIncreasedDose, setHasIncreasedDose] = useState<boolean | null>(null);
  const [doseIncreaseDetails, setDoseIncreaseDetails] = useState("");
  const [appetiteEffect, setAppetiteEffect] = useState(5);
  const [satietyEffect, setSatietyEffect] = useState(5);
  const [compulsionEffect, setCompulsionEffect] = useState(5);
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [sideEffectsImprovement, setSideEffectsImprovement] = useState("");
  const [sideEffectsWorsening, setSideEffectsWorsening] = useState("");

  // Step 3: Health
  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState("");

  // Step 4: Routine
  const [dailyWaterMl, setDailyWaterMl] = useState("");
  const [avgSleepHours, setAvgSleepHours] = useState("");
  const [weeklyWorkouts, setWeeklyWorkouts] = useState("");
  const [trackingPreference, setTrackingPreference] = useState("weekly");

  const toggleInArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const effectiveInterval = applicationInterval === 0 ? (parseInt(customInterval) || 7) : applicationInterval;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          age: age ? parseInt(age) : null,
          sex: sex || null,
          height_cm: heightCm ? parseFloat(heightCm) : null,
          current_weight: currentWeight ? parseFloat(currentWeight) : null,
          goal,
          current_dose: currentDose,
          application_interval_days: effectiveInterval,
          has_medical_guidance: hasMedicalGuidance,
          medical_specialty: medicalSpecialty || null,
          has_increased_dose: hasIncreasedDose,
          dose_increase_details: doseIncreaseDetails || null,
          appetite_effect: appetiteEffect,
          satiety_effect: satietyEffect,
          compulsion_effect: compulsionEffect,
          common_side_effects: selectedSideEffects,
          side_effects_improvement: sideEffectsImprovement || null,
          side_effects_worsening: sideEffectsWorsening || null,
          health_conditions: healthConditions,
          medications: medications || null,
          dietary_restrictions: dietaryRestrictions,
          activity_level: activityLevel,
          daily_water_ml: dailyWaterMl ? parseInt(dailyWaterMl) : null,
          avg_sleep_hours: avgSleepHours ? parseFloat(avgSleepHours) : null,
          weekly_workouts: weeklyWorkouts ? parseInt(weeklyWorkouts) : null,
          tracking_preference: trackingPreference,
          triage_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;

      // Create confirmed injection from triage
      if (currentDose && lastApplicationDate) {
        const { error: injError } = await supabase.from("injections").insert({
          user_id: user.id,
          date: lastApplicationDate,
          dose: currentDose,
          site: null,
          notes: "Registrado via triagem inicial",
        });
        if (injError) console.error("[Triagem] Error creating injection:", injError.message);
        else if (import.meta.env.DEV) console.log(`[Triagem] created confirmed application dose = ${currentDose} date = ${lastApplicationDate}`);
      }

      // Create daily_log with weight from triage
      if (currentWeight) {
        const today = new Date().toISOString().split("T")[0];
        const { error: logError } = await supabase.from("daily_logs").insert({
          user_id: user.id,
          date: today,
          weight: parseFloat(currentWeight),
        });
        if (logError) console.error("[Triagem] Error creating daily_log:", logError.message);
        else if (import.meta.env.DEV) console.log(`[Triagem] created daily_log weight = ${currentWeight}`);
      }

      await refreshProfile();
      toast.success("Triagem completa! 🎉");
      // Navigate to dashboard — tutorial will trigger automatically there
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar triagem.");
    } finally {
      setSaving(false);
    }
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return name && currentDose && goal && currentWeight && lastApplicationDate;
      case 1: return true;
      case 2: return activityLevel;
      case 3: return true;
      default: return true;
    }
  };

  const renderSlider = (value: number, onChange: (v: number) => void, label: string) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold text-primary">{value}/10</span>
      </div>
      <input
        type="range" min="0" max="10" value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  );

  const renderChipSelect = (options: string[], selected: string[], toggle: (item: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={cn("px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-200",
            selected.includes(opt) ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-foreground hover:border-primary/30")}>
          {opt}
        </button>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-lg font-bold">Identificação e Tratamento</h2>
            <p className="text-xs text-muted-foreground">Vamos conhecer você e seu tratamento atual.</p>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Nome *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Idade</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ex: 35" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Sexo (opcional)</label>
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
                <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="Ex: 165" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Peso atual (kg) *</label>
                <input type="number" step="0.1" value={currentWeight} onChange={(e) => setCurrentWeight(e.target.value)} placeholder="Ex: 85.5" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Objetivo principal *</label>
              <div className="grid grid-cols-3 gap-2">
                {goals.map((g) => (
                  <button key={g.value} type="button" onClick={() => setGoal(g.value)}
                    className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", goal === g.value ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Dose atual *</label>
              <div className="grid grid-cols-3 gap-2">
                {doses.map((d) => (
                  <button key={d} type="button" onClick={() => setCurrentDose(d)}
                    className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", currentDose === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data da última aplicação *</label>
              <input type="date" value={lastApplicationDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => setLastApplicationDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              <p className="text-[10px] text-muted-foreground mt-1">Usada para criar seu primeiro registro de aplicação.</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Intervalo entre aplicações (dias)</label>
              <div className="grid grid-cols-4 gap-2">
                {intervalOptions.map((d) => (
                  <button key={d} type="button" onClick={() => { setApplicationInterval(d); setCustomInterval(""); }}
                    className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", applicationInterval === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {d} dias
                  </button>
                ))}
                <button type="button" onClick={() => setApplicationInterval(0)}
                  className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", applicationInterval === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                  Outro
                </button>
              </div>
              {applicationInterval === 0 && (
                <input type="number" min="1" value={customInterval} onChange={(e) => setCustomInterval(e.target.value)} placeholder="Ex: 21" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none mt-2" />
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tem acompanhamento médico?</label>
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} type="button" onClick={() => setHasMedicalGuidance(v)}
                    className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", hasMedicalGuidance === v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {v ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
            </div>

            {hasMedicalGuidance && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Especialidade (opcional)</label>
                <input value={medicalSpecialty} onChange={(e) => setMedicalSpecialty(e.target.value)} placeholder="Ex: Endocrinologista" className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-lg font-bold">Histórico de Dose e Resposta</h2>
            <p className="text-xs text-muted-foreground">Como está sendo sua experiência até agora?</p>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Já aumentou a dose?</label>
              <div className="grid grid-cols-2 gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} type="button" onClick={() => setHasIncreasedDose(v)}
                    className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", hasIncreasedDose === v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {v ? "Sim" : "Não"}
                  </button>
                ))}
              </div>
            </div>

            {hasIncreasedDose && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Detalhes (quando e por quê)</label>
                <textarea value={doseIncreaseDetails} onChange={(e) => setDoseIncreaseDetails(e.target.value)} placeholder="Ex: Aumentei de 2.5 para 5mg na semana 5..." rows={3} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
              </div>
            )}

            {renderSlider(appetiteEffect, setAppetiteEffect, "Redução de apetite")}
            {renderSlider(satietyEffect, setSatietyEffect, "Saciedade aumentada")}
            {renderSlider(compulsionEffect, setCompulsionEffect, "Redução de compulsão")}

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Efeitos colaterais mais comuns</label>
              {renderChipSelect(sideEffectsList, selectedSideEffects, (item) => setSelectedSideEffects(toggleInArray(selectedSideEffects, item)))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">O que melhora os colaterais?</label>
              <textarea value={sideEffectsImprovement} onChange={(e) => setSideEffectsImprovement(e.target.value)} placeholder="Ex: Comer devagar, alimentos frios..." rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">O que piora?</label>
              <textarea value={sideEffectsWorsening} onChange={(e) => setSideEffectsWorsening(e.target.value)} placeholder="Ex: Comida gordurosa, porções grandes..." rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-lg font-bold">Saúde e Restrições</h2>
            <p className="text-xs text-muted-foreground">Informações que ajudam a personalizar suas recomendações.</p>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Condições de saúde relevantes</label>
              {renderChipSelect(healthConditionsList, healthConditions, (item) => setHealthConditions(toggleInArray(healthConditions, item)))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Medicamentos em uso</label>
              <textarea value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="Liste os medicamentos que você usa..." rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Restrições alimentares</label>
              {renderChipSelect(dietaryRestrictionsList, dietaryRestrictions, (item) => setDietaryRestrictions(toggleInArray(dietaryRestrictions, item)))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Nível de atividade física *</label>
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
        );

      case 3:
        return (
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-lg font-bold">Rotina e Preferências</h2>
            <p className="text-xs text-muted-foreground">Últimas informações para montar seu plano.</p>

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
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <div className="flex items-center justify-between mb-4">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-sm text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          ) : (
            <div />
          )}
          <span className="text-xs font-semibold text-muted-foreground">
            {step + 1} de {TOTAL_STEPS}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="h-full gradient-hero rounded-full transition-all duration-500 ease-out" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 px-5 pb-4 overflow-y-auto">
        {renderStep()}
      </div>

      <div className="px-5 pb-8 pt-2">
        {step < TOTAL_STEPS - 1 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canAdvance()}
            className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
            Continuar <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving}
            className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
            {saving ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>Finalizar Triagem <Check className="w-5 h-5" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Triage;
