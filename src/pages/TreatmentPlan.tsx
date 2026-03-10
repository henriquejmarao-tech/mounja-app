import { useState } from "react";
import { ChevronLeft, ChevronRight, Pill, Pen, Syringe, Bell, Scale, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import WeightPickerDrawer from "@/components/WeightPickerDrawer";

type WeightDrawer = "start" | "goal" | null;

const TreatmentPlan = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [weightDrawer, setWeightDrawer] = useState<WeightDrawer>(null);

  const saveWeight = async (weight: number) => {
    if (!user || !weightDrawer) return;
    const field = weightDrawer === "start" ? "current_weight" : "weight_goal";
    const updateData = weightDrawer === "start"
      ? { current_weight: weight }
      : { weight_goal: weight };

    const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);
    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    await refreshProfile();
    toast.success(weightDrawer === "start" ? "Peso inicial atualizado" : "Peso meta atualizado");
    setWeightDrawer(null);
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
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Plano de Tratamento</h1>

        <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
          {[
            { icon: Pill, label: "Medicamento", action: () => navigate("/tratamento/medicamento") },
            { icon: Pen, label: "Dosagem", action: () => navigate("/tratamento/dosagem") },
            { icon: Syringe, label: "Local de aplicação", action: () => navigate("/tratamento/local") },
            { icon: Bell, label: "Agenda", action: () => navigate("/tratamento/agenda") },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-base font-medium text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50 mt-4">
          <button
            onClick={() => setWeightDrawer("start")}
            className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-muted-foreground" />
              <span className="text-base font-medium text-foreground">Alterar peso inicial</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => setWeightDrawer("goal")}
            className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Flag className="w-5 h-5 text-muted-foreground" />
              <span className="text-base font-medium text-foreground">Alterar peso meta</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
        </div>
      </div>

      <WeightPickerDrawer
        open={weightDrawer !== null}
        onOpenChange={(open) => !open && setWeightDrawer(null)}
        initialWeight={
          weightDrawer === "start"
            ? (profile?.current_weight ? Number(profile.current_weight) : 74)
            : (profile?.weight_goal ? Number(profile.weight_goal) : 65)
        }
        onSave={saveWeight}
      />
    </div>
  );
};

export default TreatmentPlan;
