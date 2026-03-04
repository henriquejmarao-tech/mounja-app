import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const feelingOptions = [
  { value: 1, emoji: "😞", label: "Mal" },
  { value: 2, emoji: "😐", label: "Mais ou menos" },
  { value: 3, emoji: "🙂", label: "Bem" },
  { value: 4, emoji: "😊", label: "Muito bem" },
];

const DailyLogForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [weight, setWeight] = useState("");
  const [feeling, setFeeling] = useState<number | null>(null);

  // Symptoms (now in main area)
  const [nausea, setNausea] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [headache, setHeadache] = useState(0);
  const [diarrhea, setDiarrhea] = useState(0);
  const [constipation, setConstipation] = useState(0);
  const [injPain, setInjPain] = useState(0);
  const [otherSymptoms, setOtherSymptoms] = useState("");

  // Optional
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [waterL, setWaterL] = useState("");
  const [foodQuality, setFoodQuality] = useState("");
  const [notes, setNotes] = useState("");

  const renderScale = (value: number, onChange: (v: number) => void, label: string, emoji: string) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? 0 : n)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border",
              value === n
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                : n <= value
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  const handleSave = async () => {
    if (!user) return;
    if (!weight && feeling === null) {
      toast.error("Informe pelo menos seu peso ou como está se sentindo.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("daily_logs").insert({
      user_id: user.id, date: logDate,
      weight: weight ? parseFloat(weight) : null,
      waist_cm: waistCm ? parseFloat(waistCm) : null,
      body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
      symptom_nausea: nausea, symptom_fatigue: fatigue,
      symptom_headache: headache, symptom_diarrhea: diarrhea,
      symptom_constipation: constipation, symptom_injection_pain: injPain,
      mood: feeling ? feeling * 2 + 1 : 5,
      energy: feeling ? feeling * 2 + 1 : 5,
      appetite: 5, satiety: 5,
      water_ml: waterL ? Math.round(parseFloat(waterL) * 1000) : null,
      food_quality: foodQuality || null,
      notes: [notes, otherSymptoms].filter(Boolean).join(" | ") || null,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Registro salvo! ✅"); navigate("/"); }
    setSaving(false);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Date */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</label>
        <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>

      {/* Weight */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Peso (kg) *</label>
        <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ex: 85.5" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-center" />
      </div>

      {/* Feeling */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-3">Como você está se sentindo hoje? *</label>
        <div className="grid grid-cols-4 gap-2">
          {feelingOptions.map((f) => (
            <button key={f.value} type="button" onClick={() => setFeeling(f.value)}
              className={cn("py-3 rounded-xl border transition-all flex flex-col items-center gap-1.5", feeling === f.value ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border hover:border-primary/30")}>
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-semibold">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms - now in main area */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <h3 className="font-semibold text-sm mb-3">Sintomas</h3>
        {renderScale(nausea, setNausea, "Náusea", "🤢")}
        {renderScale(fatigue, setFatigue, "Fadiga", "😴")}
        {renderScale(headache, setHeadache, "Dor de cabeça", "🤕")}
        {renderScale(diarrhea, setDiarrhea, "Diarreia", "💧")}
        {renderScale(constipation, setConstipation, "Constipação", "😣")}
        {renderScale(injPain, setInjPain, "Dor no local", "💉")}

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">✏️</span>
            <span className="text-xs font-semibold">Outros</span>
          </div>
          <textarea
            value={otherSymptoms}
            onChange={(e) => setOtherSymptoms(e.target.value)}
            placeholder="Descreva outros sintomas..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* Food quality - main area */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <h3 className="font-semibold text-sm mb-3">Alimentação</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "good", label: "Boa", emoji: "😊" },
            { value: "ok", label: "Mais ou menos", emoji: "😐" },
            { value: "bad", label: "Ruim", emoji: "😞" },
          ].map((fq) => (
            <button key={fq.value} type="button" onClick={() => setFoodQuality(fq.value)}
              className={cn("py-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1", foodQuality === fq.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/30")}>
              <span className="text-lg">{fq.emoji}</span>
              {fq.label}
            </button>
          ))}
        </div>
      </div>

      {/* More details toggle */}
      <button onClick={() => setShowOptional(!showOptional)} className="w-full flex items-center justify-between bg-card rounded-2xl p-4 shadow-card border border-border/50 text-sm">
        <div>
          <p className="font-semibold text-left">Mais detalhes</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Mais dados = personalização melhor</p>
        </div>
        {showOptional ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>

      {showOptional && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Water - liters, previous day */}
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Água consumida <span className="font-black text-foreground">ontem</span> (litros)</label>
            <input type="number" step="0.1" value={waterL} onChange={(e) => setWaterL(e.target.value)} placeholder="Ex: 2.0" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-center" />
          </div>

          {/* Measurements */}
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="font-semibold text-sm mb-3">Medidas</h3>
            <div className="grid grid-cols-2 gap-3">
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

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo mais?" rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
        {saving ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Check className="w-5 h-5" /> Salvar Registro</>}
      </button>
    </div>
  );
};

export default DailyLogForm;
