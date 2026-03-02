import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const workoutTypes = ["Caminhada", "Corrida", "Musculação", "Natação", "Ciclismo", "Yoga", "Pilates", "Dança"];
const intensities = [
  { value: "light", label: "Leve", emoji: "🟢" },
  { value: "moderate", label: "Moderado", emoji: "🟡" },
  { value: "intense", label: "Intenso", emoji: "🔴" },
];
const feelingOptions = [
  { value: 1, emoji: "😞", label: "Mal" },
  { value: 2, emoji: "😐", label: "Ok" },
  { value: 3, emoji: "🙂", label: "Bem" },
  { value: 4, emoji: "😊", label: "Ótimo" },
];

const WorkoutForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("");
  const [feeling, setFeeling] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const handleSave = async () => {
    const finalType = type === "__custom" ? customType : type;
    if (!user || !finalType || !duration) {
      toast.error("Informe o tipo e a duração do treino.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("workouts" as any).insert({
      user_id: user.id,
      date,
      workout_type: finalType,
      duration_minutes: parseInt(duration),
      intensity: intensity || "moderate",
      feeling_after: feeling,
      notes: notes || null,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success("Treino registrado! 💪"); navigate("/"); }
    setSaving(false);
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Tipo de treino *</label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {workoutTypes.map((w) => (
            <button key={w} type="button" onClick={() => { setType(w); setCustomType(""); }}
              className={cn("py-2.5 rounded-xl text-xs font-semibold border transition-all", type === w ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/30")}>
              {w}
            </button>
          ))}
          <button type="button" onClick={() => setType("__custom")}
            className={cn("py-2.5 rounded-xl text-xs font-semibold border transition-all col-span-2", type === "__custom" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/30")}>
            Outro...
          </button>
        </div>
        {type === "__custom" && (
          <input value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="Qual treino?" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 mt-1" />
        )}
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Duração (minutos) *</label>
        <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-center" />
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Intensidade</label>
        <div className="grid grid-cols-3 gap-2">
          {intensities.map((i) => (
            <button key={i.value} type="button" onClick={() => setIntensity(i.value)}
              className={cn("py-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1", intensity === i.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/30")}>
              <span className="text-lg">{i.emoji}</span>
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Como se sentiu depois?</label>
        <div className="grid grid-cols-4 gap-2">
          {feelingOptions.map((f) => (
            <button key={f.value} type="button" onClick={() => setFeeling(f.value)}
              className={cn("py-3 rounded-xl border transition-all flex flex-col items-center gap-1.5", feeling === f.value ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border hover:border-primary/30")}>
              <span className="text-xl">{f.emoji}</span>
              <span className="text-[10px] font-semibold">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Observações</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo sobre o treino?" rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
      </div>

      <button onClick={handleSave} disabled={saving || (!type && !customType) || !duration}
        className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
        {saving ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Check className="w-5 h-5" /> Salvar Treino</>}
      </button>
    </div>
  );
};

export default WorkoutForm;
