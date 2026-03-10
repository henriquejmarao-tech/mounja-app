import { useEffect, useState, useCallback, useRef } from "react";
import WeightTrendsDrawer from "@/components/dashboard/WeightTrendsDrawer";
import WeightPickerDrawer from "@/components/WeightPickerDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { cn, localDateStr } from "@/lib/utils";
import { ChevronRight, Camera, ImagePlus, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import ProgressDetailDrawer from "@/components/progress/ProgressDetailDrawer";
import { toast } from "sonner";


type Period = "30d" | "90d" | "180d" | "all";

const ProgressPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { dose } = useApplicationData();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period>("30d");
  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false);
  const [weightData, setWeightData] = useState<{ date: string; peso: number; label: string }[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [photos, setPhotos] = useState<{ id: string; url: string; date: string }[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<{ id: string; url: string; date: string } | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [startWeightDrawer, setStartWeightDrawer] = useState(false);
  const [goalWeightDrawer, setGoalWeightDrawer] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const periodDays: Record<Period, number | null> = { "30d": 30, "90d": 90, "180d": 180, all: null };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const days = periodDays[period];
    const since = days ? localDateStr(new Date(Date.now() - days * 86400000)) : undefined;

    let logsQ = supabase.from("daily_logs").select("date, weight").eq("user_id", user.id).not("weight", "is", null).order("date", { ascending: true });
    let injQ = supabase.from("injections").select("date, dose, site").eq("user_id", user.id).order("date", { ascending: false });

    if (since) {
      logsQ = logsQ.gte("date", since);
      injQ = injQ.gte("date", since);
    }

    const [logsRes, injRes, photosRes] = await Promise.all([
      logsQ,
      injQ,
      supabase.from("progress_photos").select("id, photo_url, date").eq("user_id", user.id).order("date", { ascending: false }).limit(20),
    ]);

    const byDate = new Map<string, number>();
    for (const l of (logsRes.data as any[]) || []) byDate.set(l.date, Number(l.weight));
    setWeightData(
      Array.from(byDate, ([date, peso]) => ({
        date,
        peso,
        label: new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      })).sort((a, b) => a.date.localeCompare(b.date))
    );
    setInjections((injRes.data as any[]) || []);

    // Get signed URLs for photos
    const rawPhotos = (photosRes.data as any[]) || [];
    const photosWithUrls = await Promise.all(
      rawPhotos.map(async (p) => {
        const { data } = await supabase.storage.from("progress-photos").createSignedUrl(p.photo_url, 3600);
        return { id: p.id, url: data?.signedUrl || "", date: p.date };
      })
    );
    setPhotos(photosWithUrls.filter((p) => p.url));

    // Today's photo for the first card
    const todayStr = localDateStr(new Date());
    const todayPhoto = photosWithUrls.find((p) => p.url && p.date === todayStr) || null;
    setTodayPhoto(todayPhoto);
    setLoading(false);
  }, [user, period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayStr = localDateStr(new Date());

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
      await supabase.from("progress_photos").insert({
        user_id: user.id,
        date: todayStr,
        photo_url: path,
      } as any);
      toast.success("Foto salva ✓");
      await fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar foto");
    }
    setUploading(false);
    e.target.value = "";
  }, [user, todayStr, fetchData]);

  const handleDeletePhoto = useCallback(async () => {
    if (!todayPhoto || !user) return;
    try {
      // Get storage path
      const { data } = await supabase.from("progress_photos").select("photo_url").eq("id", todayPhoto.id).limit(1);
      const storagePath = (data as any[])?.[0]?.photo_url;
      if (storagePath) await supabase.storage.from("progress-photos").remove([storagePath]);
      await supabase.from("progress_photos").delete().eq("id", todayPhoto.id);
      setTodayPhoto(null);
      toast.success("Foto removida");
      await fetchData();
    } catch {
      toast.error("Erro ao remover");
    }
  }, [todayPhoto, user, fetchData]);

  const initialWeight = profile?.current_weight;
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].peso : (initialWeight ? Number(initialWeight) : null);
  const goalWeightRaw = (profile as any)?.weight_goal ? parseFloat(String((profile as any).weight_goal).replace(",", ".")) : NaN;
  const goalWeight = isNaN(goalWeightRaw) ? null : goalWeightRaw;
  const totalLost = initialWeight && currentWeight ? Number(initialWeight) - currentWeight : null;

  const startDate = profile?.mounjaro_start_date ? new Date(profile.mounjaro_start_date + "T12:00:00") : null;
  const daysOnTreatment = startDate ? Math.max(1, Math.floor((Date.now() - startDate.getTime()) / 86400000)) : null;

  const heightCm = profile?.height_cm ? Number(profile.height_cm) : null;
  const bmi = currentWeight && heightCm ? (currentWeight / ((heightCm / 100) ** 2)).toFixed(1) : null;

  // Weight ring progress (0 to 1)
  const weightProgress = initialWeight && goalWeight && currentWeight
    ? Math.min(1, Math.max(0, (Number(initialWeight) - currentWeight) / (Number(initialWeight) - goalWeight)))
    : 0;


  const saveStartWeight = async (weight: number) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ current_weight: weight }).eq("id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    await refreshProfile();
    toast.success("Peso inicial atualizado");
  };

  const saveGoalWeight = async (weight: number) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ weight_goal: weight }).eq("id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    await refreshProfile();
    toast.success("Peso meta atualizado");
  };
  const periods: { value: Period; label: string }[] = [
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "180d", label: "180d" },
    { value: "all", label: "Tudo" },
  ];

  // Handle scroll for slide indicators
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    setActiveSlide(Math.round(scrollLeft / width));
  };

  const SLIDES = 3;

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* Purple gradient hero */}
      <div
        className="relative"
        style={{
          background: "linear-gradient(180deg, hsl(15, 75%, 75%) 0%, hsl(340, 65%, 62%) 45%, hsl(295, 55%, 42%) 100%)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        {/* Fade-out overlay at the bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.3) 40%, hsl(var(--background) / 0.7) 70%, hsl(var(--background)) 100%)" }}
        />
        <div className="px-6 pt-8 pb-20">
          {/* Current weight — hero */}
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">peso atual</p>
            <p className="text-4xl font-extrabold text-white leading-none">
              {currentWeight?.toFixed(1) ?? "—"}
              <span className="text-base font-semibold text-white/60 ml-1">kg</span>
            </p>
          </div>

          {/* Progress line */}
          <div className="relative px-1">
            {/* Track */}
            <div className="h-2 rounded-full bg-white/15 relative overflow-hidden">
              <div
                className="h-full rounded-full bg-white/70 transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(2, weightProgress * 100)}%` }}
              />
            </div>


            {/* Labels */}
            <div className="flex justify-between mt-3">
              <button onClick={() => setStartWeightDrawer(true)} className="text-left active:scale-95 transition-transform">
                <p className="text-[10px] font-medium text-white/50">início</p>
                <p className="text-sm font-bold text-white/90">
                  {initialWeight ? Number(initialWeight).toFixed(1) : "—"}
                  <span className="text-[10px] font-medium text-white/50 ml-0.5">kg</span>
                </p>
              </button>
              <div className="text-center">
                <p className="text-[10px] font-medium text-white/50">
                  {Math.round(weightProgress * 100)}%
                </p>
              </div>
              <button onClick={() => setGoalWeightDrawer(true)} className="text-right active:scale-95 transition-transform">
                <p className="text-[10px] font-medium text-white/50">meta</p>
                <p className="text-sm font-bold text-white/90">
                  {goalWeight?.toFixed(1) ?? "—"}
                  <span className="text-[10px] font-medium text-white/50 ml-0.5">kg</span>
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current dose pill - overlaps gradient */}
      <div className="px-5 -mt-6 relative z-10">
        <button
          onClick={() => navigate("/plano-tratamento")}
          className="w-full bg-card rounded-2xl py-3.5 px-5 text-center shadow-elevated border border-border/30 active:scale-[0.98] transition-transform"
        >
          <p className="text-sm font-bold text-foreground">
            {dose.currentDose ? `${dose.currentDose} de Mounjaro®` : "Nenhum tratamento registrado"}
          </p>
        </button>
      </div>

      {/* Swipeable cards */}
      <div className="mt-4 px-5">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`.progress-scroll::-webkit-scrollbar{display:none}`}</style>

          {/* Card 1: Today's Photo */}
          <div className="bg-card rounded-[20px] p-5 shadow-card border border-border/50 min-w-[calc(100vw-40px)] max-w-[calc(100vw-40px)] snap-center">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Foto de Hoje</h3>
              {daysOnTreatment && (
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  Dia {daysOnTreatment}
                </span>
              )}
            </div>

            {todayPhoto ? (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] max-h-[45vh]">
                  <img src={todayPhoto.url} alt="Progresso" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-destructive/20 text-destructive text-xs font-semibold active:scale-95 transition-transform"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover
                  </button>
                  <label className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-secondary/50 text-foreground text-xs font-semibold cursor-pointer active:scale-95 transition-transform">
                    <ImagePlus className="w-3.5 h-3.5" /> Trocar
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl bg-muted aspect-[3/4] max-h-[45vh] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground text-center px-4">Nenhuma foto de hoje</p>
                </div>
                <div className="flex gap-2">
                  <label className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-secondary/50 text-foreground text-xs font-semibold cursor-pointer active:scale-95 transition-transform",
                    uploading && "opacity-50 pointer-events-none"
                  )}>
                    <ImagePlus className="w-4 h-4" /> Galeria
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  </label>
                  <label className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary/10 text-primary text-xs font-semibold cursor-pointer active:scale-95 transition-transform",
                    uploading && "opacity-50 pointer-events-none"
                  )}>
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <><Camera className="w-4 h-4" /> Câmera</>
                    )}
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Weight Trends */}
          <div className="bg-card rounded-[20px] p-5 shadow-card border border-border/50 min-w-[calc(100vw-40px)] max-w-[calc(100vw-40px)] snap-center">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Tendência de Peso</h3>
              <button
                onClick={() => setWeightDrawerOpen(true)}
                className="text-xs font-semibold text-muted-foreground flex items-center gap-0.5"
              >
                Ver mais <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Period filter */}
            <div className="flex gap-1 mb-4">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    period === p.value
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : weightData.length >= 2 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} tickLine={false} axisLine={false} />
                    <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v} kg`} />
                    <Line type="monotone" dataKey="peso" stroke="hsl(25, 70%, 55%)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(25, 70%, 55%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Registre seu peso para ver o gráfico
              </div>
            )}
          </div>

          {/* Card 3: Progress Photos */}
          <div className="bg-card rounded-[20px] p-5 shadow-card border border-border/50 min-w-[calc(100vw-40px)] max-w-[calc(100vw-40px)] snap-center">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Fotos de Progresso</h3>
              <button onClick={() => navigate("/fotos")} className="text-xs font-semibold text-muted-foreground flex items-center gap-0.5">
                Ver todas <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {photos.slice(0, 4).map((photo) => (
                  <div key={photo.id} className="flex flex-col gap-1">
                    <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-muted">
                      <img src={photo.url} alt="Progresso" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center font-medium">
                      {new Date(photo.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                Nenhuma foto registrada ainda
              </div>
            )}
          </div>
        </div>

        {/* Slide indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-1">
          {Array.from({ length: SLIDES }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === activeSlide ? "bg-primary" : "bg-muted-foreground/20"
              )}
            />
          ))}
        </div>
      </div>

      <ProgressDetailDrawer open={detailOpen} onOpenChange={setDetailOpen} />
      <WeightTrendsDrawer
        open={weightDrawerOpen}
        onOpenChange={setWeightDrawerOpen}
        weightHistory={weightData.map(({ date, peso }) => ({ date, peso }))}
      />
      <WeightPickerDrawer
        open={startWeightDrawer}
        onOpenChange={setStartWeightDrawer}
        initialWeight={initialWeight ? Number(initialWeight) : 74}
        onSave={saveStartWeight}
      />
      <WeightPickerDrawer
        open={goalWeightDrawer}
        onOpenChange={setGoalWeightDrawer}
        initialWeight={goalWeight ?? 65}
        onSave={saveGoalWeight}
      />
    </div>
  );
};

export default ProgressPage;
