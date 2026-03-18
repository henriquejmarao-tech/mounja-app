import { useState } from "react";
import { ChevronLeft, Check, Pill } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const medications = [
  "Zepbound®",
  "Mounjaro®",
  "Tirzepatida",
  "Wegovy®",
  "Ozempic®",
  "Semaglutida",
  "Retatrutida",
];

const MedicationSelect = () => {
  const navigate = useNavigate();
  const { profile, user, refreshProfile } = useAuth();
  const { refresh } = useApplicationData();
  const [selected, setSelected] = useState(profile?.medication || "");

  const handleSave = async () => {
    if (!user || !selected) return;
    await supabase.from("profiles").update({ medication: selected } as any).eq("id", user.id);
    await refreshProfile();
    await refresh();
    toast.success(`${selected} selecionado`);
    navigate(-1);
  };

  return (
    <div
      className="min-h-screen pb-nav flex flex-col"
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

      <div className="px-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(150,40%,95%), hsl(170,35%,95%))" }}
          >
            <Pill className="w-5 h-5" style={{ color: "hsl(160,40%,45%)" }} />
          </div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Medicamento</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium mt-1 ml-[52px]">Qual medicamento você usa?</p>
      </div>

      {/* Medication list */}
      <div className="flex-1 px-5 space-y-2.5">
        {medications.map((med) => {
          const isSelected = selected === med;
          return (
            <button
              key={med}
              onClick={() => setSelected(med)}
              className={cn(
                "w-full bg-card rounded-2xl border px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-all",
                isSelected
                  ? "border-transparent shadow-elevated"
                  : "border-border/40 shadow-card"
              )}
              style={isSelected ? {
                boxShadow: "0 0 0 2px hsl(295 55% 42% / 0.3), 0 4px 16px hsl(300 60% 50% / 0.1)",
              } : undefined}
            >
              <span className={cn(
                "text-[15px] font-semibold",
                isSelected ? "text-foreground" : "text-foreground/80"
              )}>
                {med}
              </span>
              {isSelected && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, hsl(295 55% 42%), hsl(340 65% 62%))" }}
                >
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="px-5 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <button
          onClick={handleSave}
          disabled={!selected}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
            boxShadow: "0 8px 24px hsl(300 60% 50% / 0.2), 0 2px 8px hsl(270 80% 60% / 0.15)",
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default MedicationSelect;
