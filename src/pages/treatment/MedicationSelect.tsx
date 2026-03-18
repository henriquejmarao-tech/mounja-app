import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

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

  const handleSelect = async (med: string) => {
    if (!user) return;
    await supabase.from("profiles").update({ medication: med } as any).eq("id", user.id);
    await refreshProfile();
    await refresh();
    toast.success(`${med} selecionado`);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="px-6 pt-safe">
        <div className="flex items-center gap-3 mt-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <Progress value={33} className="flex-1 h-2" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground text-center mt-6 mb-8">
          Qual medicamento você usa?
        </h1>

        <div className="space-y-3">
          {medications.map((med) => (
            <button
              key={med}
              onClick={() => handleSelect(med)}
              className="w-full py-4 px-6 rounded-full bg-muted text-base font-semibold text-foreground text-center active:scale-[0.98] transition-transform hover:border-primary/30 border border-transparent"
            >
              {med}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicationSelect;
