import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Syringe, Scale, Activity, Droplets, Dumbbell, UtensilsCrossed, Brain, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LogType = "injection" | "daily";

const injectionSites = ["Coxa esquerda", "Coxa direita", "Abdômen esquerdo", "Abdômen direito", "Braço esquerdo", "Braço direito"];
const doses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];
const foodQualities = [
  { value: "good", label: "Boa", emoji: "😊" },
  { value: "ok", label: "Mais ou menos", emoji: "😐" },
  { value: "bad", label: "Ruim", emoji: "😞" },
];

const Register = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logType, setLogType] = useState<LogType>("daily");
  const [saving, setSaving] = useState(false);

  // Injection fields
  const [injDate, setInjDate] = useState(new Date().toISOString().split("T")[0]);
  const [injDose, setInjDose] = useState("");
  const [injSite, setInjSite] = useState("");
  const [injNotes, setInjNotes] = useState("");

  // Daily log fields
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [nausea, setNausea] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [headache, setHeadache] = useState(0);
  const [diarrhea, setDiarrhea] = useState(0);
  const [constipation, setConstipation] = useState(0);
  const [injPain, setInjPain] = useState(0);
  const [appetite, setAppetite] = useState(5);
  const [satiety, setSatiety] = useState(5);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [waterMl, setWaterMl] = useState("");
  const [workoutType, setWorkoutType] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [foodQuality, setFoodQuality] = useState("");
  const [foodNotes, setFoodNotes] = useState("");
  const [notes, setNotes] = useState("");

  const renderSlider = (value: number, onChange: (v: number) => void, label: string, icon: React.ReactNode) => (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        <span className="text-xs font-bold text-primary">{value}/10</span>
      </div>
      <input
        type="range" min="0" max="10" value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
      />
    </div>
  );

  const handleSaveInjection = async () => {
    if (!user || !injDose) {
      toast.error("Selecione a dose.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("injections").insert({
      user_id: user.id,
      date: injDate,
      dose: injDose,
      site: injSite || null,
      notes: injNotes || null,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Aplicação registrada! 💉");
      navigate("/");
    }
    setSaving(false);
  };

  const handleSaveDailyLog = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("daily_logs").insert({
      user_id: user.id,
      date: logDate,
      weight: weight ? parseFloat(weight) : null,
      waist_cm: waistCm ? parseFloat(waistCm) : null,
      body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
      symptom_nausea: nausea,
      symptom_fatigue: fatigue,
      symptom_headache: headache,
      symptom_diarrhea: diarrhea,
      symptom_constipation: constipation,
      symptom_injection_pain: injPain,
      appetite,
      satiety,
      mood,
      energy,
      water_ml: waterMl ? parseInt(waterMl) : null,
      workout_type: workoutType || null,
      workout_duration: workoutDuration ? parseInt(workoutDuration) : null,
      food_quality: foodQuality || null,
      food_notes: foodNotes || null,
      notes: notes || null,
    } as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Registro salvo! ✅");
      navigate("/");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-xl font-bold">Registrar</h1>
        <p className="text-sm text-muted-foreground mt-1">Registre rapidamente seus dados do dia.</p>
      </header>

      {/* Type selector */}
      <div className="px-5 mb-5">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-1.5 flex gap-1">
          {[
            { value: "daily" as LogType, label: "Registro Diário", icon: Activity },
            { value: "injection" as LogType, label: "Aplicação", icon: Syringe },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setLogType(t.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300",
                logType === t.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        {logType === "injection" ? (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</label>
              <input type="date" value={injDate} onChange={(e) => setInjDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Dose *</label>
              <div className="grid grid-cols-3 gap-2">
                {doses.map((d) => (
                  <button key={d} type="button" onClick={() => setInjDose(d)}
                    className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", injDose === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Local (opcional)</label>
              <div className="grid grid-cols-2 gap-2">
                {injectionSites.map((s) => (
                  <button key={s} type="button" onClick={() => setInjSite(s)}
                    className={cn("py-2.5 rounded-xl text-[11px] font-semibold border transition-all", injSite === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Observações</label>
              <textarea value={injNotes} onChange={(e) => setInjNotes(e.target.value)} placeholder="Como foi a aplicação?" rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
            </div>

            <button onClick={handleSaveInjection} disabled={saving || !injDose}
              className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
              {saving ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Check className="w-5 h-5" /> Salvar Aplicação</>}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</label>
              <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>

            {/* Body */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Scale className="w-4 h-4 text-primary" /> Medidas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Peso (kg)</label>
                  <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="85.5" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Cintura (cm)</label>
                  <input type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} placeholder="90" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Gordura (%)</label>
                  <input type="number" step="0.1" value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)} placeholder="28" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-warning" /> Sintomas</h3>
              {renderSlider(nausea, setNausea, "Náusea", <span className="text-xs">🤢</span>)}
              {renderSlider(fatigue, setFatigue, "Fadiga", <span className="text-xs">😴</span>)}
              {renderSlider(headache, setHeadache, "Dor de cabeça", <span className="text-xs">🤕</span>)}
              {renderSlider(diarrhea, setDiarrhea, "Diarreia", <span className="text-xs">💧</span>)}
              {renderSlider(constipation, setConstipation, "Constipação", <span className="text-xs">😣</span>)}
              {renderSlider(injPain, setInjPain, "Dor no local", <span className="text-xs">💉</span>)}
            </div>

            {/* Wellbeing */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-info" /> Bem-estar</h3>
              {renderSlider(appetite, setAppetite, "Apetite", <span className="text-xs">🍽️</span>)}
              {renderSlider(satiety, setSatiety, "Saciedade", <span className="text-xs">😌</span>)}
              {renderSlider(mood, setMood, "Humor", <span className="text-xs">😊</span>)}
              {renderSlider(energy, setEnergy, "Energia", <span className="text-xs">⚡</span>)}
            </div>

            {/* Habits */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Droplets className="w-4 h-4 text-info" /> Hábitos</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Água (ml)</label>
                  <input type="number" value={waterMl} onChange={(e) => setWaterMl(e.target.value)} placeholder="2000" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Treino (min)</label>
                  <input type="number" value={workoutDuration} onChange={(e) => setWorkoutDuration(e.target.value)} placeholder="30" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Tipo de treino</label>
                <input value={workoutType} onChange={(e) => setWorkoutType(e.target.value)} placeholder="Ex: Caminhada, Musculação..." className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            {/* Food */}
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-secondary" /> Alimentação</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {foodQualities.map((fq) => (
                  <button key={fq.value} type="button" onClick={() => setFoodQuality(fq.value)}
                    className={cn("py-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1", foodQuality === fq.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/30")}>
                    <span className="text-lg">{fq.emoji}</span>
                    {fq.label}
                  </button>
                ))}
              </div>
              <textarea value={foodNotes} onChange={(e) => setFoodNotes(e.target.value)} placeholder="Notas sobre alimentação..." rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Notas gerais</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo mais que queira registrar?" rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>

            <button onClick={handleSaveDailyLog} disabled={saving}
              className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
              {saving ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Check className="w-5 h-5" /> Salvar Registro</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
