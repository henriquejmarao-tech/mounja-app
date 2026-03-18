import { useState } from "react";
import { ChevronLeft, ChevronDown, Pill, Pen, Syringe, Bell, Scale, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useApplicationData } from "@/hooks/useApplicationData";
import WeightPickerDrawer from "@/components/WeightPickerDrawer";
import mascotImg from "@/assets/mascot-pointing.png";

type WeightDrawer = "start" | "goal" | null;

const TreatmentPlan = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [weightDrawer, setWeightDrawer] = useState<WeightDrawer>(null);

  const saveWeight = async (weight: number) => {
    if (!user || !weightDrawer) return;
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

  const treatmentItems = [
    {
      icon: Pill,
      label: "Medicamento",
      value: profile?.medication || "Não definido",
      gradBg: "linear-gradient(135deg, hsl(150,40%,95%), hsl(170,35%,95%))",
      iconColor: "hsl(160,40%,45%)",
      action: () => navigate("/tratamento/medicamento"),
    },
    {
      icon: Pen,
      label: "Dosagem",
      value: profile?.current_dose || "Não definida",
      gradBg: "linear-gradient(135deg, hsl(30,50%,95%), hsl(15,45%,95%))",
      iconColor: "hsl(20,50%,50%)",
      action: () => navigate("/tratamento/dosagem"),
    },
    {
      icon: Syringe,
      label: "Local de aplicação",
      value: "Configurar",
      gradBg: "linear-gradient(135deg, hsl(270,80%,96%), hsl(330,60%,96%))",
      iconColor: "hsl(270,60%,55%)",
      action: () => navigate("/tratamento/local"),
    },
    {
      icon: Bell,
      label: "Agenda",
      value: profile?.application_frequency === "daily"
        ? "Diário"
        : profile?.application_frequency === "custom"
        ? `A cada ${profile?.application_interval_days || 7} dias`
        : "Semanal",
      gradBg: "linear-gradient(135deg, hsl(200,60%,95%), hsl(220,50%,95%))",
      iconColor: "hsl(210,50%,50%)",
      action: () => navigate("/tratamento/agenda"),
    },
  ];

  const weightItems = [
    {
      icon: Scale,
      label: "Peso inicial",
      value: profile?.current_weight ? `${profile.current_weight} kg` : "Não definido",
      gradBg: "linear-gradient(135deg, hsl(340,50%,96%), hsl(15,45%,96%))",
      iconColor: "hsl(340,55%,55%)",
      action: () => setWeightDrawer("start"),
    },
    {
      icon: Flag,
      label: "Peso meta",
      value: profile?.weight_goal ? `${profile.weight_goal} kg` : "Não definida",
      gradBg: "linear-gradient(135deg, hsl(160,45%,95%), hsl(140,40%,95%))",
      iconColor: "hsl(150,45%,42%)",
      action: () => setWeightDrawer("goal"),
    },
  ];

  return (
    <div
      className="min-h-screen pb-nav"
      style={{ background: "linear-gradient(180deg, hsl(20, 30%, 97%) 0%, hsl(36, 25%, 97%) 40%, hsl(0, 0%, 98%) 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-safe pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6 text-foreground/70" />
        </button>
        <div className="flex-1" />
        <div className="w-10" />
      </div>

      {/* Title with mascot */}
      <div className="px-6 pb-2 flex items-end gap-4">
        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight leading-tight">
            Plano de Tratamento
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Personalize seu tratamento</p>
        </div>
        <img
          src={mascotImg}
          alt=""
          className="w-16 h-16 object-contain opacity-90 shrink-0"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}
        />
      </div>

      {/* Treatment cards */}
      <div className="px-5 mt-5 space-y-3">
        {treatmentItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: item.gradBg }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.iconColor }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{item.label}</p>
              <p className="text-[15px] font-semibold text-foreground mt-0.5">{item.value}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground/40 -rotate-90" />
          </button>
        ))}
      </div>

      {/* Weight section */}
      <div className="px-5 mt-6 space-y-3">
        <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider px-1">Peso</p>
        {weightItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: item.gradBg }}
            >
              <item.icon className="w-5 h-5" style={{ color: item.iconColor }} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{item.label}</p>
              <p className="text-[15px] font-semibold text-foreground mt-0.5">{item.value}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground/40 -rotate-90" />
          </button>
        ))}
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
