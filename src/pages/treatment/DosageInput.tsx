import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const DosageInput = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const currentDose = profile?.current_dose?.replace(/[^\d.]/g, "") || "";
  const [dose, setDose] = useState(currentDose || "2.5");

  const handleSave = async () => {
    if (!user) return;
    const doseStr = `${dose} mg`;
    const { error } = await supabase
      .from("profiles")
      .update({ current_dose: doseStr })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Dosagem atualizada");
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <div className="px-6 pt-safe">
        <div className="flex items-center gap-3 mt-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <Progress value={50} className="flex-1 h-2" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground text-center mt-6 mb-4">
          Qual sua dose atual?
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="flex items-center gap-3">
          <input
            type="number"
            step="0.5"
            min="0.5"
            max="100"
            value={dose}
            onChange={(e) => setDose(e.target.value)}
            className="w-24 h-16 text-center text-2xl font-bold text-foreground border-2 border-primary/30 rounded-xl bg-transparent focus:border-primary outline-none"
          />
          <span className="text-xl font-semibold text-muted-foreground">mg</span>
        </div>
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-full bg-primary text-primary-foreground text-base font-bold active:scale-[0.98] transition-transform"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default DosageInput;
