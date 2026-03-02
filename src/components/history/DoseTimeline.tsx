import { useState } from "react";
import { Syringe, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApplicationData } from "@/hooks/useApplicationData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import EditInjectionDialog from "./EditInjectionDialog";
import { toast } from "sonner";

interface DoseTimelineProps {
  injections: any[];
}

const DoseTimeline = ({ injections }: DoseTimelineProps) => {
  const { updateApplication, deleteApplication, refresh } = useApplicationData();
  const [editingInj, setEditingInj] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (injections.length === 0) return null;

  const handleDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteApplication(deletingId);
      toast.success("Aplicação excluída.");
      setDeletingId(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir.");
    }
    setDeleting(false);
  };

  const handleEdit = async (id: string, data: { date: string; dose: string; site: string | null; notes: string | null }) => {
    await updateApplication(id, data);
  };

  return (
    <>
      <div className="bg-card rounded-2xl shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <div className="p-4 pb-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Syringe className="w-4 h-4 text-primary" /> Linha do tempo de doses
          </h3>
        </div>
        <div className="px-4 pb-4">
          {injections.slice(0, 6).map((inj: any, i: number) => (
            <div key={inj.id} className="flex gap-3 relative group">
              <div className="flex flex-col items-center">
                <div className={cn("w-3 h-3 rounded-full border-2 mt-1.5", i === 0 ? "border-primary bg-primary/20" : "border-muted-foreground/30 bg-muted")} />
                {i < Math.min(injections.length, 6) - 1 && <div className="w-px flex-1 bg-border my-1" />}
              </div>
              <div className="pb-4 flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold">{inj.dose}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(inj.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                      {inj.site && <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{inj.site}</span>}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setEditingInj(inj)} className="p-1.5 rounded-lg hover:bg-muted" aria-label="Editar">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeletingId(inj.id)} className="p-1.5 rounded-lg hover:bg-destructive/10" aria-label="Excluir">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit dialog */}
      {editingInj && (
        <EditInjectionDialog
          open={!!editingInj}
          onOpenChange={(open) => { if (!open) setEditingInj(null); }}
          injection={editingInj}
          onSave={handleEdit}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null); }}>
        <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir aplicação</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir esta aplicação?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <button onClick={() => setDeletingId(null)} className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold">Cancelar</button>
            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold disabled:opacity-50">
              {deleting ? "Excluindo..." : "Excluir"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DoseTimeline;
