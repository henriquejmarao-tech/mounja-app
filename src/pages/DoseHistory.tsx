import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const sideEffectsList = ["Náusea", "Fadiga", "Dor de cabeça", "Diarreia", "Constipação", "Dor no local", "Azia", "Tontura"];

const DoseHistory = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const [hasIncreasedDose, setHasIncreasedDose] = useState<boolean | null>(null);
  const [doseIncreaseDetails, setDoseIncreaseDetails] = useState("");
  const [appetiteEffect, setAppetiteEffect] = useState(5);
  const [satietyEffect, setSatietyEffect] = useState(5);
  const [compulsionEffect, setCompulsionEffect] = useState(5);
  const [selectedSideEffects, setSelectedSideEffects] = useState<string[]>([]);
  const [sideEffectsImprovement, setSideEffectsImprovement] = useState("");
  const [sideEffectsWorsening, setSideEffectsWorsening] = useState("");

  useEffect(() => {
    if (!profile) return;
    setHasIncreasedDose(profile.has_increased_dose ?? null);
    setDoseIncreaseDetails(profile.dose_increase_details || "");
    setAppetiteEffect(profile.appetite_effect ?? 5);
    setSatietyEffect(profile.satiety_effect ?? 5);
    setCompulsionEffect(profile.compulsion_effect ?? 5);
    setSelectedSideEffects((profile.common_side_effects as string[]) || []);
    setSideEffectsImprovement(profile.side_effects_improvement || "");
    setSideEffectsWorsening(profile.side_effects_worsening || "");
  }, [profile]);

  const toggleInArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          has_increased_dose: hasIncreasedDose,
          dose_increase_details: doseIncreaseDetails || null,
          appetite_effect: appetiteEffect,
          satiety_effect: satietyEffect,
          compulsion_effect: compulsionEffect,
          common_side_effects: selectedSideEffects,
          side_effects_improvement: sideEffectsImprovement || null,
          side_effects_worsening: sideEffectsWorsening || null,
          dose_history_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Histórico de dose salvo! ✅");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-background pb-nav">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Histórico de Dose</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Como está sendo sua experiência com o tratamento?</p>
        </div>
      </header>

      <div className="px-5 mt-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 space-y-4">
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

export default DoseHistory;
