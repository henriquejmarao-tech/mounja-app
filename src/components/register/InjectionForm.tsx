import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const injectionSites = ["Coxa esquerda", "Coxa direita", "Abdômen esquerdo", "Abdômen direito", "Braço esquerdo", "Braço direito"];
const doses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];

const InjectionForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [injDate, setInjDate] = useState(new Date().toISOString().split("T")[0]);
  const [injDose, setInjDose] = useState("");
  const [injSite, setInjSite] = useState("");
  const [injNotes, setInjNotes] = useState("");

  const handleSave = async () => {
    if (!user || !injDose) {
      toast.error("Selecione a dose.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("injections").insert({
      user_id: user.id, date: injDate, dose: injDose,
      site: injSite || null, notes: injNotes || null,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Aplicação registrada! 💉"); navigate("/"); }
    setSaving(false);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</label>
        <input type="date" value={injDate} onChange={(e) => setInjDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Dose *</label>
        <div className="grid grid-cols-3 gap-2">
          {doses.map((d) => (
            <button key={d} type="button" onClick={() => setInjDose(d)}
              className={cn("py-3 rounded-xl text-xs font-semibold border transition-all", injDose === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Local (opcional)</label>
        <div className="grid grid-cols-2 gap-2">
          {injectionSites.map((s) => (
            <button key={s} type="button" onClick={() => setInjSite(s)}
              className={cn("py-2.5 rounded-xl text-[11px] font-semibold border transition-all", injSite === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Observações</label>
        <textarea value={injNotes} onChange={(e) => setInjNotes(e.target.value)} placeholder="Como foi a aplicação?" rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
      </div>
      <button onClick={handleSave} disabled={saving || !injDose}
        className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
        {saving ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Check className="w-5 h-5" /> Salvar Aplicação</>}
      </button>
    </div>
  );
};

export default InjectionForm;
