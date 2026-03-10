import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { cn, localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Syringe, Scale, Utensils, Activity, ChevronDown, ChevronUp, Save, Camera, ImagePlus, Trash2 } from "lucide-react";

const symptomCategories = [
  {
    title: "Sintomas",
    color: "bg-blue-100 text-blue-700",
    activeColor: "bg-blue-200 text-blue-800 ring-2 ring-blue-400/50",
    items: [
      { key: "symptom_nausea", label: "Náusea", emoji: "🤢" },
      { key: "symptom_constipation", label: "Constipação", emoji: "😣" },
      { key: "symptom_diarrhea", label: "Diarreia", emoji: "💧" },
      { key: "symptom_headache", label: "Dor de cabeça", emoji: "🤕" },
      { key: "symptom_fatigue", label: "Fadiga", emoji: "😴" },
      { key: "symptom_dizziness", label: "Tontura", emoji: "😵" },
      { key: "symptom_bloating", label: "Inchaço", emoji: "🎈" },
      { key: "symptom_heartburn", label: "Azia", emoji: "🔥" },
    ],
  },
  {
    title: "Apetite",
    color: "bg-orange-100 text-orange-700",
    activeColor: "bg-orange-200 text-orange-800 ring-2 ring-orange-400/50",
    items: [
      { key: "appetite_suppressed", label: "Sem apetite", emoji: "🚫" },
      { key: "appetite_cravings", label: "Compulsão", emoji: "🍫" },
      { key: "appetite_healthy", label: "Comendo bem", emoji: "🥗" },
      { key: "appetite_junk", label: "Junk food", emoji: "🍔" },
    ],
  },
  {
    title: "Reação na aplicação",
    color: "bg-red-100 text-red-700",
    activeColor: "bg-red-200 text-red-800 ring-2 ring-red-400/50",
    items: [
      { key: "symptom_injection_pain", label: "Dor", emoji: "💉" },
      { key: "injection_swelling", label: "Inchaço", emoji: "🔺" },
      { key: "injection_rash", label: "Vermelhidão", emoji: "🔴" },
      { key: "injection_bruising", label: "Hematoma", emoji: "🟣" },
    ],
  },
  {
    title: "Humor",
    color: "bg-yellow-100 text-yellow-700",
    activeColor: "bg-yellow-200 text-yellow-800 ring-2 ring-yellow-400/50",
    items: [
      { key: "mood_calm", label: "Calmo", emoji: "😌" },
      { key: "mood_happy", label: "Feliz", emoji: "😊" },
      { key: "mood_energetic", label: "Energético", emoji: "⚡" },
      { key: "mood_anxious", label: "Ansioso", emoji: "😰" },
      { key: "mood_foggy", label: "Confuso", emoji: "🌫️" },
      { key: "mood_irritable", label: "Irritado", emoji: "😤" },
    ],
  },
];

const LogPage = () => {
  const { user } = useAuth();
  const { setConfirmedApplication, dose, refresh } = useApplicationData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [log, setLog] = useState<any>(null);
  const [logId, setLogId] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [symptoms, setSymptoms] = useState<Record<string, number>>({});
  const [foodQuality, setFoodQuality] = useState("");
  const [foodNotes, setFoodNotes] = useState("");
  const [waterMl, setWaterMl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [datesWithLogs, setDatesWithLogs] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Injection fields
  const [showInjection, setShowInjection] = useState(false);
  const [injDose, setInjDose] = useState(dose.currentDose || "");
  const [injSite, setInjSite] = useState("");

  const dateStr = localDateStr(selectedDate);

  const loadLog = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("daily_logs").select("*").eq("user_id", user.id).eq("date", dateStr).limit(1);
    const existing = (data as any[])?.[0] || null;
    setLog(existing);
    setLogId(existing?.id || null);
    setWeight(existing?.weight?.toString() || "");
    setFoodQuality(existing?.food_quality || "");
    setFoodNotes(existing?.food_notes || "");
    setWaterMl(existing?.water_ml?.toString() || "");
    setNotes(existing?.notes || "");
    const syms: Record<string, number> = {};
    symptomCategories.forEach((cat) => {
      cat.items.forEach((s) => { syms[s.key] = existing?.[s.key] || 0; });
    });
    setSymptoms(syms);

    // Load photo for this date
    const { data: photoRows } = await supabase
      .from("progress_photos")
      .select("id, photo_url")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .order("created_at", { ascending: false })
      .limit(1);
    const existingPhoto = (photoRows as any[])?.[0];
    if (existingPhoto) {
      setPhotoId(existingPhoto.id);
      const { data: signedData } = await supabase.storage
        .from("progress-photos")
        .createSignedUrl(existingPhoto.photo_url, 3600);
      setPhotoUrl(signedData?.signedUrl || null);
    } else {
      setPhotoId(null);
      setPhotoUrl(null);
    }
  }, [user, dateStr]);

  const loadDates = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("daily_logs").select("date").eq("user_id", user.id);
    setDatesWithLogs((data as any[] || []).map((d) => d.date));
  }, [user]);

  useEffect(() => { loadLog(); }, [loadLog]);
  useEffect(() => { loadDates(); }, [loadDates]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const payload: any = {
        user_id: user.id,
        date: dateStr,
        weight: weight ? parseFloat(weight) : null,
        food_quality: foodQuality || null,
        food_notes: foodNotes || null,
        water_ml: waterMl ? parseInt(waterMl) : null,
        notes: notes || null,
        ...symptoms,
      };
      if (logId) {
        await supabase.from("daily_logs").update(payload).eq("id", logId);
      } else {
        await supabase.from("daily_logs").insert(payload);
      }
      // Save injection if toggled
      if (showInjection && injDose) {
        await setConfirmedApplication({ date: dateStr, dose: injDose, site: injSite || null, notes: null });
        setShowInjection(false);
      }
      await refresh();
      await loadLog();
      await loadDates();
      toast.success("Registro salvo ✓");
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const foodOptions = [
    { value: "great", label: "Ótima", emoji: "🥗" },
    { value: "good", label: "Boa", emoji: "👍" },
    { value: "regular", label: "Regular", emoji: "😐" },
    { value: "poor", label: "Ruim", emoji: "👎" },
  ];

  const injSites = ["Abdômen", "Coxa esquerda", "Coxa direita", "Braço esquerdo", "Braço direito"];

  return (
    <div className="min-h-screen pb-nav bg-background">
      <div className="px-6 pt-safe pb-2">
        <h1 className="text-2xl font-bold text-foreground">Log</h1>
        <p className="text-sm text-muted-foreground">Registre seu dia</p>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* Date selector */}
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="w-full bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span className="text-sm font-semibold text-foreground">
            {selectedDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          {showCalendar ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showCalendar && (
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-2 animate-fade-in-up">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { if (d) { setSelectedDate(d); setShowCalendar(false); } }}
              modifiers={{ hasLog: datesWithLogs.map((d) => new Date(d + "T12:00:00")) }}
              modifiersStyles={{ hasLog: { fontWeight: 700, color: "hsl(168, 56%, 42%)" } }}
            />
          </div>
        )}

        {/* Weight */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-info" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Peso</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 85.5"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <span className="text-sm text-muted-foreground font-medium">kg</span>
          </div>
        </div>

        {/* Symptoms - Chip toggle style */}
        <div className="space-y-3">
          {symptomCategories.map((cat) => (
            <div key={cat.title} className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
              <h3 className="font-bold text-base text-foreground mb-3">{cat.title}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((s) => {
                  const isActive = (symptoms[s.key] || 0) > 0;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSymptoms({ ...symptoms, [s.key]: isActive ? 0 : 1 })}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95",
                        isActive ? cat.activeColor : cat.color
                      )}
                    >
                      <span className="text-base">{s.emoji}</span>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Food */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Utensils className="w-4 h-4 text-warning" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alimentação</p>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {foodOptions.map((f) => (
              <button
                key={f.value}
                onClick={() => setFoodQuality(foodQuality === f.value ? "" : f.value)}
                className={cn(
                  "py-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all active:scale-95",
                  foodQuality === f.value
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-secondary/50 border-transparent text-muted-foreground"
                )}
              >
                <span className="text-lg">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
          <textarea
            value={foodNotes}
            onChange={(e) => setFoodNotes(e.target.value)}
            placeholder="O que você comeu hoje? (opcional)"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Water */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">💧 Água</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={waterMl}
              onChange={(e) => setWaterMl(e.target.value)}
              placeholder="Ex: 2000"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="text-sm text-muted-foreground font-medium">ml</span>
          </div>
        </div>

        {/* Injection toggle */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <button
            onClick={() => setShowInjection(!showInjection)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Syringe className="w-4 h-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aplicação</p>
            </div>
            {showInjection ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>
          {showInjection && (
            <div className="mt-3 space-y-3 animate-fade-in-up">
              <input
                value={injDose}
                onChange={(e) => setInjDose(e.target.value)}
                placeholder="Dose (ex: 5 mg)"
                className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex flex-wrap gap-2">
                {injSites.map((site) => (
                  <button
                    key={site}
                    onClick={() => setInjSite(injSite === site ? "" : site)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-medium border transition-all active:scale-95",
                      injSite === site
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-secondary/50 border-transparent text-muted-foreground"
                    )}
                  >
                    {site}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">📝 Notas</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações do dia (opcional)"
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 shadow-elevated active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar registro
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LogPage;
