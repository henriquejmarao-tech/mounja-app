import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn, localDateStr } from "@/lib/utils";

const doses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];
const goals = [
  { value: "weight_loss", label: "Perda de peso" },
  { value: "glycemic_control", label: "Controle glicêmico" },
  { value: "other", label: "Outro" },
];
const intervalOptions = [7, 10, 14];

const Triage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

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

  const effectiveInterval = applicationInterval === 0 ? (parseInt(customInterval) || 7) : applicationInterval;

  const canSave = name && currentDose && goal && currentWeight && lastApplicationDate;

  const handleSave = async () => {
    if (!user || !canSave) return;
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
      }

      // Create daily_log with weight from triage
      if (currentWeight) {
        const today = localDateStr();
        const { error: logError } = await supabase.from("daily_logs").insert({
          user_id: user.id,
          date: today,
          weight: parseFloat(currentWeight),
        });
        if (logError) console.error("[Triagem] Error creating daily_log:", logError.message);
      }

      await refreshProfile();
      toast.success("Triagem completa! 🎉");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar triagem.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <h1 className="text-lg font-bold">Vamos começar 🌿</h1>
        <p className="text-xs text-muted-foreground mt-1">Preencha o essencial — leva menos de 1 minuto.</p>
      </header>

      <div className="flex-1 px-5 pb-4 overflow-y-auto space-y-4">
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
          <input type="date" value={lastApplicationDate} max={localDateStr()} onChange={(e) => setLastApplicationDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
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

      <div className="px-5 pb-8 pt-2">
        <button onClick={handleSave} disabled={saving || !canSave}
          className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 disabled:opacity-50">
          {saving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>Começar <Check className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default Triage;
