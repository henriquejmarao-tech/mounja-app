import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const activityLevels = [
  { value: "sedentary", label: "Sedentário" },
  { value: "light", label: "Leve" },
  { value: "moderate", label: "Moderado" },
  { value: "high", label: "Alto" },
];
const healthConditionsList = ["Diabetes tipo 2", "Pré-diabetes", "Hipotireoidismo", "Hipertensão", "Colesterol alto", "SOP"];
const dietaryRestrictionsList = ["Vegetariana", "Vegana", "Sem glúten", "Sem lactose", "Low carb", "Sem restrições"];

const HealthInfo = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { refresh } = useApplicationData();
  const [saving, setSaving] = useState(false);

  const [healthConditions, setHealthConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [activityLevel, setActivityLevel] = useState("");

  useEffect(() => {
    if (!profile) return;
    setHealthConditions((profile.health_conditions as string[]) || []);
    setMedications(profile.medications || "");
    setDietaryRestrictions((profile.dietary_restrictions as string[]) || []);
    setActivityLevel(profile.activity_level || "");
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
          health_conditions: healthConditions,
          medications: medications || null,
          dietary_restrictions: dietaryRestrictions,
          activity_level: activityLevel,
          health_info_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;
      await refreshProfile();
      await refresh();
      toast.success("Informações de saúde salvas! ✅");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

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
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Saúde e Restrições</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Informações que personalizam suas recomendações.</p>
        </div>
      </header>

      <div className="px-5 mt-4 space-y-4">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 space-y-4">
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

export default HealthInfo;
