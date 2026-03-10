import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, ChevronDown, ChevronUp, RefreshCw, Camera, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn, localDateStr } from "@/lib/utils";

const feelingOptions = [
  { value: 1, emoji: "😞", label: "Mal" },
  { value: 2, emoji: "😐", label: "Mais ou menos" },
  { value: 3, emoji: "🙂", label: "Bem" },
  { value: 4, emoji: "😊", label: "Muito bem" },
];

const moodToFeeling = (mood: number | null): number | null => {
  if (mood === null || mood === undefined) return null;
  // reverse of feeling * 2 + 1
  const f = Math.round((mood - 1) / 2);
  if (f >= 1 && f <= 4) return f;
  return null;
};

const DailyLogForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOptional, setShowOptional] = useState(false);
  const [existingLogId, setExistingLogId] = useState<string | null>(null);

  const today = new Date();
  const todayStr = localDateStr(today);
  const [logDate] = useState(todayStr);
  const [weight, setWeight] = useState("");
  const [feeling, setFeeling] = useState<number | null>(null);

  const [nausea, setNausea] = useState(0);
  const [fatigue, setFatigue] = useState(0);
  const [headache, setHeadache] = useState(0);
  const [diarrhea, setDiarrhea] = useState(0);
  const [constipation, setConstipation] = useState(0);
  const [injPain, setInjPain] = useState(0);
  const [otherSymptoms, setOtherSymptoms] = useState("");

  const [bodyFatPct, setBodyFatPct] = useState("");
  const [waistCm, setWaistCm] = useState("");
  const [waterL, setWaterL] = useState("");
  const [foodQuality, setFoodQuality] = useState("");
  const [notes, setNotes] = useState("");

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isUpdate = !!existingLogId;

  // Load existing log for today
  useEffect(() => {
    if (!user) return;
    const loadToday = async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .order("created_at", { ascending: false })
        .limit(1);

      const data = rows?.[0] ?? null;

      if (data) {
        setExistingLogId(data.id);
        if (data.weight !== null) setWeight(String(data.weight));
        setFeeling(moodToFeeling(data.mood));
        setNausea(data.symptom_nausea ?? 0);
        setFatigue(data.symptom_fatigue ?? 0);
        setHeadache(data.symptom_headache ?? 0);
        setDiarrhea(data.symptom_diarrhea ?? 0);
        setConstipation(data.symptom_constipation ?? 0);
        setInjPain(data.symptom_injection_pain ?? 0);
        if (data.food_quality) setFoodQuality(data.food_quality);
        if (data.water_ml !== null) setWaterL(String(data.water_ml / 1000));
        if (data.body_fat_pct !== null) setBodyFatPct(String(data.body_fat_pct));
        if (data.waist_cm !== null) setWaistCm(String(data.waist_cm));
        // Parse notes: notes field may contain "notes | otherSymptoms"
        if (data.notes) {
          const parts = data.notes.split(" | ");
          if (parts.length > 1) {
            setNotes(parts[0]);
            setOtherSymptoms(parts.slice(1).join(" | "));
          } else {
            setNotes(data.notes);
          }
        }
      }

      // Load today's photo
      const { data: photoRows } = await supabase
        .from("progress_photos")
        .select("id, photo_url")
        .eq("user_id", user.id)
        .eq("date", todayStr)
        .order("created_at", { ascending: false })
        .limit(1);
      const existingPhoto = (photoRows as any[])?.[0];
      if (existingPhoto) {
        setPhotoId(existingPhoto.id);
        const { data: signedData } = await supabase.storage
          .from("progress-photos")
          .createSignedUrl(existingPhoto.photo_url, 3600);
        if (signedData?.signedUrl) setPhotoUrl(signedData.signedUrl);
      }

      setLoading(false);
    };
    loadToday();
  }, [user, todayStr]);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${todayStr}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("progress-photos")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: inserted } = await supabase.from("progress_photos").insert({
        user_id: user.id,
        date: todayStr,
        photo_url: path,
      } as any).select("id").single();
      if (inserted) setPhotoId((inserted as any).id);
      const { data: signedData } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(path, 3600);
      if (signedData?.signedUrl) setPhotoUrl(signedData.signedUrl);
      toast.success("Foto adicionada ✓");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    }
    setUploading(false);
    e.target.value = "";
  }, [user, todayStr]);

  const handlePhotoDelete = useCallback(async () => {
    if (!photoId || !user) return;
    try {
      const { data } = await supabase
        .from("progress_photos")
        .select("photo_url")
        .eq("id", photoId)
        .limit(1);
      const storagePath = (data as any[])?.[0]?.photo_url;
      if (storagePath) await supabase.storage.from("progress-photos").remove([storagePath]);
      await supabase.from("progress_photos").delete().eq("id", photoId);
      setPhotoUrl(null);
      setPhotoId(null);
      toast.success("Foto removida");
    } catch {
      toast.error("Erro ao remover");
    }
  }, [photoId, user]);

  const renderScale = (value: number, onChange: (v: number) => void, label: string, emoji: string) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-sm">{emoji}</span>
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 6 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? -1 : n)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border",
              value === n
                ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                : n > 0 && n <= value
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-muted-foreground">Nenhum</span>
        <span className="text-[9px] text-muted-foreground">Intenso</span>
      </div>
    </div>
  );

  const buildPayload = () => ({
    user_id: user!.id,
    date: logDate,
    weight: weight ? parseFloat(weight) : null,
    waist_cm: waistCm ? parseFloat(waistCm) : null,
    body_fat_pct: bodyFatPct ? parseFloat(bodyFatPct) : null,
    symptom_nausea: nausea,
    symptom_fatigue: fatigue,
    symptom_headache: headache,
    symptom_diarrhea: diarrhea,
    symptom_constipation: constipation,
    symptom_injection_pain: injPain,
    mood: feeling ? feeling * 2 + 1 : 5,
    energy: feeling ? feeling * 2 + 1 : 5,
    appetite: 5,
    satiety: 5,
    water_ml: waterL ? Math.round(parseFloat(waterL) * 1000) : null,
    food_quality: foodQuality || null,
    notes: [notes, otherSymptoms].filter(Boolean).join(" | ") || null,
  });

  const handleSave = async () => {
    if (!user) return;
    if (!weight && feeling === null) {
      toast.error("Informe pelo menos seu peso ou como está se sentindo.");
      return;
    }
    setSaving(true);

    if (isUpdate && existingLogId) {
      const { error } = await supabase
        .from("daily_logs")
        .update(buildPayload() as any)
        .eq("id", existingLogId);
      if (error) toast.error(error.message);
      else { toast.success("Registro atualizado! ✅"); navigate("/"); }
    } else {
      const { error } = await supabase
        .from("daily_logs")
        .insert(buildPayload() as any);
      if (error) toast.error(error.message);
      else { toast.success("Registro salvo! ✅"); navigate("/"); }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {isUpdate && (
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs text-primary font-medium">Você já registrou hoje. Altere os campos e clique em <strong>Atualizar</strong>.</p>
        </div>
      )}

      {/* Weight */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Peso hoje (kg) *</label>
        <input type="number" step="0.01" min="0" max="999" value={weight} onChange={(e) => { const v = e.target.value; if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= 999)) setWeight(v); }} placeholder="Ex: 85.50" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-center" />
      </div>

      {/* Feeling */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-3">Como está se sentindo agora? *</label>
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

      {/* Symptoms */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <h3 className="font-semibold text-sm mb-3">Sintomas nas últimas 24h</h3>
        {renderScale(nausea, setNausea, "Náusea", "🤢")}
        {renderScale(fatigue, setFatigue, "Fadiga", "😴")}
        {renderScale(headache, setHeadache, "Dor de cabeça", "🤕")}
        {renderScale(diarrhea, setDiarrhea, "Diarreia", "💧")}
        {renderScale(constipation, setConstipation, "Constipação", "😣")}
        {renderScale(injPain, setInjPain, "Dor no local", "💉")}

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">✏️</span>
            <span className="text-xs font-semibold">Outros</span>
          </div>
          <textarea
            value={otherSymptoms}
            onChange={(e) => setOtherSymptoms(e.target.value)}
            placeholder="Descreva outros sintomas..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
      </div>

      {/* Food quality */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <h3 className="font-semibold text-sm mb-3">Alimentação nas últimas 24h</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "good", label: "Boa", emoji: "😊" },
            { value: "ok", label: "Mais ou menos", emoji: "😐" },
            { value: "bad", label: "Ruim", emoji: "😞" },
          ].map((fq) => (
            <button key={fq.value} type="button" onClick={() => setFoodQuality(fq.value)}
              className={cn("py-3 rounded-xl text-xs font-semibold border transition-all flex flex-col items-center gap-1", foodQuality === fq.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/30")}>
              <span className="text-lg">{fq.emoji}</span>
              {fq.label}
            </button>
          ))}
        </div>
      </div>

      {/* Water */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <label className="text-xs font-semibold text-muted-foreground block mb-1.5">💧 Água consumida nas últimas 24h (litros)</label>
        <input type="number" step="0.1" value={waterL} onChange={(e) => setWaterL(e.target.value)} placeholder="Ex: 2.0" className="w-full px-4 py-3 rounded-xl border border-border bg-background text-lg font-semibold outline-none focus:ring-2 focus:ring-primary/20 text-center" />
        {waterL && parseFloat(waterL) > 0 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ≈ <span className="font-bold text-foreground">{Math.round(parseFloat(waterL) * 1000 / 250)}</span> copos de 250ml
          </p>
        )}
      </div>

      {/* Progress Photo */}
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Camera className="w-4 h-4 text-muted-foreground" />
          Foto de progresso
        </h3>
        {photoUrl ? (
          <div className="space-y-3">
            <img src={photoUrl} alt="Progresso" className="w-full rounded-2xl object-cover max-h-64" />
            <div className="flex gap-2">
              <button onClick={handlePhotoDelete} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-destructive/20 text-destructive text-xs font-semibold active:scale-95 transition-transform">
                <Trash2 className="w-3.5 h-3.5" /> Remover
              </button>
              <label className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted text-foreground text-xs font-semibold cursor-pointer active:scale-95 transition-transform">
                <ImagePlus className="w-3.5 h-3.5" /> Trocar
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <label className={cn(
              "flex-1 flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-colors",
              uploading && "opacity-50 pointer-events-none"
            )}>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Galeria</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
            <label className={cn(
              "flex-1 flex flex-col items-center gap-2 py-6 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 transition-colors",
              uploading && "opacity-50 pointer-events-none"
            )}>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-medium">Câmera</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        )}
      </div>

      {/* More details toggle */}
      <button onClick={() => setShowOptional(!showOptional)} className="w-full flex items-center justify-between bg-card rounded-2xl p-4 shadow-card border border-border/50 text-sm">
        <div>
          <p className="font-semibold text-left">Mais detalhes</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Mais dados = personalização melhor</p>
        </div>
        {showOptional ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>

      {showOptional && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="font-semibold text-sm mb-3">Medidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Cintura (cm)</label>
                <input type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} placeholder="90" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Gordura (%)</label>
                <input type="number" step="0.1" value={bodyFatPct} onChange={(e) => setBodyFatPct(e.target.value)} placeholder="28" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Observações</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Algo mais?" rows={2} className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50">
        {saving
          ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          : isUpdate
            ? <><RefreshCw className="w-5 h-5" /> Atualizar Registro</>
            : <><Check className="w-5 h-5" /> Salvar Registro</>
        }
      </button>
    </div>
  );
};

export default DailyLogForm;
