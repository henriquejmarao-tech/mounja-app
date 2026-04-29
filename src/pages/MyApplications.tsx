import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, Check, Pencil, Plus, Trash2, Syringe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ApplicationInjection, useApplicationData } from "@/hooks/useApplicationData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn, localDateStr, saoPauloDateStr, saoPauloTimeStr } from "@/lib/utils";

const injectionSites = ["Abdômen direito", "Abdômen esquerdo", "Coxa direita", "Coxa esquerda", "Braço direito", "Braço esquerdo"];
const fallbackMedications = ["Mounjaro®", "Zepbound®", "Ozempic®", "Wegovy®", "Tirzepatida", "Semaglutida"];

const toDateTimeInput = (value?: string | null) => {
  const date = value ? new Date(value) : new Date();
  return `${saoPauloDateStr(date)}T${saoPauloTimeStr(date)}`;
};

const dateTimeToIso = (value: string) => new Date(`${value}:00-03:00`).toISOString();
const safeDateTimeToIso = (value: string) => {
  if (!value) return null;
  const date = new Date(`${value}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
const doseNumber = (dose?: string | null) => (dose || "").replace(/[^0-9.,]/g, "").replace(",", ".");

const ApplicationFormDialog = ({
  open,
  onOpenChange,
  injection,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  injection: ApplicationInjection | null;
}) => {
  const { profile } = useAuth();
  const { setConfirmedApplication, updateApplication } = useApplicationData();
  const medicationOptions = useMemo(() => Array.from(new Set([profile?.medication, ...fallbackMedications].filter(Boolean))) as string[], [profile?.medication]);
  const [appliedAt, setAppliedAt] = useState(() => toDateTimeInput(injection?.applied_at ?? (injection ? `${injection.date}T12:00:00-03:00` : null)));
  const [medication, setMedication] = useState(injection?.medication || profile?.medication || medicationOptions[0] || "Mounjaro®");
  const [dose, setDose] = useState(doseNumber(injection?.dose || profile?.current_dose) || "");
  const [site, setSite] = useState(injection?.site || "");
  const [notes, setNotes] = useState(injection?.notes || "");
  const [saving, setSaving] = useState(false);

  const treatmentStart = profile?.mounjaro_start_date || null;
  const appliedDate = appliedAt.slice(0, 10);
  const appliedIso = safeDateTimeToIso(appliedAt);
  const isFuture = !!appliedIso && appliedIso > new Date().toISOString();
  const isBeforeTreatment = !!treatmentStart && appliedDate < treatmentStart;
  const invalid = !appliedIso || !dose || isFuture || isBeforeTreatment;

  const handleSave = async () => {
    if (invalid) return;
    setSaving(true);
    try {
      const payload = {
        date: appliedDate,
        applied_at: appliedIso,
        medication,
        dose: `${Number(dose).toString()} mg`,
        site: site || null,
        notes: notes || null,
      };
      if (injection) await updateApplication(injection.id, payload);
      else await setConfirmedApplication(payload);
      toast.success(injection ? "Aplicação atualizada ✓" : "Aplicação adicionada ✓");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar aplicação.");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[94vw] rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{injection ? "Editar aplicação" : "Adicionar aplicação"}</DialogTitle>
          <DialogDescription>{injection ? "Ajuste o histórico do tratamento." : "Registre uma aplicação feita anteriormente."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data e hora</label>
            <input type="datetime-local" value={appliedAt} max={toDateTimeInput()} onChange={(e) => setAppliedAt(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            {isFuture && <p className="text-xs text-destructive mt-1">A data não pode ser futura.</p>}
            {isBeforeTreatment && <p className="text-xs text-destructive mt-1">A data não pode ser anterior ao início do tratamento.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Medicamento</label>
              <select value={medication} onChange={(e) => setMedication(e.target.value)} className="w-full px-3 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                {medicationOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Dose (mg)</label>
              <input inputMode="decimal" type="number" min="0" step="0.1" value={dose} onChange={(e) => setDose(e.target.value)} className="w-full px-3 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Local</label>
            <select value={site} onChange={(e) => setSite(e.target.value)} className="w-full px-3 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option value="">Selecionar local</option>
              {injectionSites.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Notas</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="rounded-xl resize-none" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl">Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={invalid || saving} className="flex-1 rounded-xl gradient-hero text-primary-foreground">
            {saving ? "Salvando..." : <><Check className="w-4 h-4" /> Salvar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const MyApplications = () => {
  const navigate = useNavigate();
  const { getApplicationTimeline, deleteApplication } = useApplicationData();
  const injections = getApplicationTimeline();
  const [editing, setEditing] = useState<ApplicationInjection | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ApplicationInjection | null>(null);
  const [deletingNow, setDeletingNow] = useState(false);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingNow(true);
    try {
      await deleteApplication(deleting.id);
      toast.success("Aplicação apagada ✓");
      setDeleting(null);
    } catch (e: any) {
      toast.error(e.message || "Erro ao apagar aplicação.");
    }
    setDeletingNow(false);
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-5 space-y-5" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-card border border-border/50 shadow-card flex items-center justify-center active:scale-95 transition-transform" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Minhas aplicações</h1>
            <p className="text-sm text-muted-foreground">Histórico completo do tratamento</p>
          </div>
          <Button onClick={() => setAdding(true)} size="sm" className="rounded-xl gradient-hero text-primary-foreground shadow-card">
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </div>

        <div className="space-y-3">
          {injections.length === 0 ? (
            <Card className="rounded-2xl shadow-card border-border/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-3">
                  <Syringe className="w-6 h-6 text-primary-foreground" />
                </div>
                <p className="font-bold text-foreground">Nenhuma aplicação registrada</p>
                <p className="text-sm text-muted-foreground mt-1">Adicione a primeira para iniciar seu histórico.</p>
              </CardContent>
            </Card>
          ) : injections.map((inj) => {
            const applied = inj.applied_at ? new Date(inj.applied_at) : new Date(`${inj.date}T12:00:00-03:00`);
            return (
              <Card key={inj.id} className="rounded-2xl shadow-card border-border/50 overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                      <CalendarClock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {applied.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" })} às {saoPauloTimeStr(applied)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">{inj.medication || "Mounjaro®"} · {inj.dose}</p>
                      {inj.site && <p className="text-xs font-semibold text-muted-foreground/70 mt-1">{inj.site}</p>}
                      {inj.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{inj.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => setEditing(inj)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center" aria-label="Editar aplicação">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => setDeleting(inj)} className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center" aria-label="Apagar aplicação">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <ApplicationFormDialog open={adding} onOpenChange={setAdding} injection={null} />
      {editing && <ApplicationFormDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)} injection={editing} />}

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-[90vw] rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Apagar essa aplicação?</DialogTitle>
            <DialogDescription>Isso vai recalcular sua próxima dose e tendências.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)} className="flex-1 rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletingNow} className="flex-1 rounded-xl">
              {deletingNow ? "Apagando..." : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyApplications;
