import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const doses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];
const injectionSites = ["Coxa esquerda", "Coxa direita", "Abdômen esquerdo", "Abdômen direito", "Braço esquerdo", "Braço direito"];

interface EditInjectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  injection: { id: string; date: string; dose: string; site: string | null; notes: string | null };
  onSave: (id: string, data: { date: string; dose: string; site: string | null; notes: string | null }) => Promise<void>;
}

const EditInjectionDialog = ({ open, onOpenChange, injection, onSave }: EditInjectionDialogProps) => {
  const [date, setDate] = useState(injection.date);
  const [dose, setDose] = useState(injection.dose);
  const [site, setSite] = useState(injection.site || "");
  const [notes, setNotes] = useState(injection.notes || "");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const isFutureDate = date > today;

  const handleConfirmSave = async () => {
    if (isFutureDate) {
      toast.error("Você não pode registrar uma aplicação futura.");
      return;
    }
    setSaving(true);
    try {
      await onSave(injection.id, { date, dose, site: site || null, notes: notes || null });
      toast.success("Aplicação atualizada!");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar.");
    }
    setSaving(false);
    setConfirming(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Aplicação</DialogTitle>
          <DialogDescription>Altere os dados e confirme.</DialogDescription>
        </DialogHeader>

        {confirming ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-center">Tem certeza que deseja atualizar esta aplicação?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold">Cancelar</button>
              <button onClick={handleConfirmSave} disabled={saving} className="flex-1 py-3 rounded-xl gradient-hero text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {saving ? "Salvando..." : "Confirmar"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Data</label>
              <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              {isFutureDate && <p className="text-xs text-destructive mt-1">Você não pode registrar uma aplicação futura.</p>}
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Dose</label>
              <div className="grid grid-cols-3 gap-2">
                {doses.map((d) => (
                  <button key={d} type="button" onClick={() => setDose(d)}
                    className={cn("py-2.5 rounded-xl text-xs font-semibold border transition-all", dose === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Local</label>
              <div className="grid grid-cols-2 gap-2">
                {injectionSites.map((s) => (
                  <button key={s} type="button" onClick={() => setSite(s)}
                    className={cn("py-2 rounded-xl text-[11px] font-semibold border transition-all", site === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Observações</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
            </div>
            <DialogFooter>
              <button onClick={() => { if (isFutureDate) { toast.error("Você não pode registrar uma aplicação futura."); return; } setConfirming(true); }} disabled={!dose}
                className="w-full gradient-hero text-primary-foreground font-bold py-3 rounded-2xl text-sm disabled:opacity-50">
                Salvar alterações
              </button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditInjectionDialog;
