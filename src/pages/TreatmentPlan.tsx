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
            onClick={() => openWeightDrawer("start")}
            className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-muted-foreground" />
              <span className="text-base font-medium text-foreground">Alterar peso inicial</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => openWeightDrawer("goal")}
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

      {/* Weight Picker Drawer */}
      <Drawer open={weightDrawer !== null} onOpenChange={(open) => !open && setWeightDrawer(null)}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <DrawerHeader className="px-0 pt-2 pb-4">
              <DrawerTitle className="text-lg font-bold text-center">
                {weightDrawer === "start" ? "Atualizar peso inicial" : "Atualizar peso meta"}
              </DrawerTitle>
            </DrawerHeader>

            {/* Unit selector (visual only - always kg) */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 mb-8">
              <div className="flex-1 py-2 rounded-lg text-sm font-semibold text-center text-muted-foreground">lbs</div>
              <div className="flex-1 py-2 rounded-lg text-sm font-bold text-center bg-card text-foreground shadow-sm">kg</div>
              <div className="flex-1 py-2 rounded-lg text-sm font-semibold text-center text-muted-foreground">st</div>
            </div>

            {/* Weight picker */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {/* Integer part */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setWeightInt((v) => v + 1)}
                  className="text-sm text-muted-foreground/50 h-6"
                >
                  {weightInt + 2}
                </button>
                <button
                  onClick={() => setWeightInt((v) => v + 1)}
                  className="text-base text-muted-foreground h-6"
                >
                  {weightInt + 1}
                </button>
                <div className="bg-muted rounded-xl px-8 py-3">
                  <span className="text-2xl font-bold text-foreground">{weightInt}</span>
                </div>
                <button
                  onClick={() => setWeightInt((v) => Math.max(30, v - 1))}
                  className="text-base text-muted-foreground h-6"
                >
                  {weightInt - 1}
                </button>
                <button
                  onClick={() => setWeightInt((v) => Math.max(30, v - 1))}
                  className="text-sm text-muted-foreground/50 h-6"
                >
                  {weightInt - 2}
                </button>
              </div>

              <span className="text-2xl font-bold text-foreground">.</span>

              {/* Decimal part */}
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => setWeightDec((v) => (v + 1) % 10)}
                  className="text-sm text-muted-foreground/50 h-6"
                >
                  {(weightDec + 2) % 10}
                </button>
                <button
                  onClick={() => setWeightDec((v) => (v + 1) % 10)}
                  className="text-base text-muted-foreground h-6"
                >
                  {(weightDec + 1) % 10}
                </button>
                <div className="bg-muted rounded-xl px-8 py-3">
                  <span className="text-2xl font-bold text-foreground">{weightDec}</span>
                </div>
                <button
                  onClick={() => setWeightDec((v) => (v - 1 + 10) % 10)}
                  className="text-base text-muted-foreground h-6"
                >
                  {(weightDec - 1 + 10) % 10}
                </button>
                <button
                  onClick={() => setWeightDec((v) => (v - 1 + 10) % 10)}
                  className="text-sm text-muted-foreground/50 h-6"
                >
                  {(weightDec - 2 + 10) % 10}
                </button>
              </div>

              <span className="text-lg font-semibold text-muted-foreground ml-1">kg</span>
            </div>

            <button
              onClick={saveWeight}
              className="w-full py-4 rounded-full gradient-hero text-primary-foreground text-base font-bold active:scale-[0.98] transition-transform shadow-elevated"
            >
              Salvar
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default TreatmentPlan;
