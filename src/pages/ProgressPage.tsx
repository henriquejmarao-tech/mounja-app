import { useEffect, useState, useCallback } from "react";
import WeightTrendsDrawer from "@/components/dashboard/WeightTrendsDrawer";
import WeightPickerDrawer from "@/components/WeightPickerDrawer";
import PhotoGalleryDrawer from "@/components/PhotoGalleryDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { cn, localDateStr } from "@/lib/utils";
import { ChevronRight, Camera, ImagePlus, Trash2, TrendingDown, Image as ImageIcon } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Period = "30d" | "90d" | "180d" | "all";

const ProgressPage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { dose, refresh: refreshAppData } = useApplicationData();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period>("30d");
  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false);
  const [weightData, setWeightData] = useState<{ date: string; peso: number; label: string }[]>([]);
  const [photos, setPhotos] = useState<{ id: string; url: string; date: string }[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<{ id: string; url: string; date: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [startWeightDrawer, setStartWeightDrawer] = useState(false);
  const [goalWeightDrawer, setGoalWeightDrawer] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [uploading, setUploading] = useState(false);

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

    const [logsRes, photosRes] = await Promise.all([
      logsQ,
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

    const rawPhotos = (photosRes.data as any[]) || [];
    const photosWithUrls = await Promise.all(
      rawPhotos.map(async (p) => {
        const { data } = await supabase.storage.from("progress-photos").createSignedUrl(p.photo_url, 3600);
        return { id: p.id, url: data?.signedUrl || "", date: p.date };
      })
    );
    setPhotos(photosWithUrls.filter((p) => p.url));

    const todayStr = localDateStr(new Date());
    setTodayPhoto(photosWithUrls.find((p) => p.url && p.date === todayStr) || null);
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
      const { error: uploadError } = await supabase.storage.from("progress-photos").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      await supabase.from("progress_photos").insert({ user_id: user.id, date: todayStr, photo_url: path } as any);
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

  const weightProgress = initialWeight && goalWeight && currentWeight
    ? Math.min(1, Math.max(0, (Number(initialWeight) - currentWeight) / (Number(initialWeight) - goalWeight)))
    : 0;

  const insightText = weightProgress <= 0
    ? "Você ainda não iniciou sua evolução"
    : weightProgress >= 1
      ? "🎉 Você atingiu sua meta!"
      : `Faltam ${((1 - weightProgress) * 100).toFixed(0)}% para sua meta`;

  const periods: { value: Period; label: string }[] = [
    { value: "30d", label: "30d" },
    { value: "90d", label: "90d" },
    { value: "180d", label: "180d" },
    { value: "all", label: "Tudo" },
  ];

  const saveStartWeight = async (weight: number) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ current_weight: weight }).eq("id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    await refreshProfile();
    await refreshAppData();
    toast.success("Peso inicial atualizado");
  };

  const saveGoalWeight = async (weight: number) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ weight_goal: weight }).eq("id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    await refreshProfile();
    await refreshAppData();
    toast.success("Peso meta atualizado");
  };

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* ── Weight Summary Hero ── */}
      <div
        className="relative"
        style={{
          background: "linear-gradient(135deg, hsl(340 65% 62%) 0%, hsl(295 55% 42%) 100%)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--background)))" }}
        />
        <div className="px-6 pt-6 pb-12">
          <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-0.5">Peso atual</p>
          <p className="text-[42px] font-extrabold text-white leading-none tracking-tight">
            {currentWeight?.toFixed(1) ?? "—"}
            <span className="text-lg font-semibold text-white/50 ml-1">kg</span>
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${Math.max(2, weightProgress * 100)}%`,
                  background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <button onClick={() => setStartWeightDrawer(true)} className="active:scale-95 transition-transform">
                <p className="text-[10px] text-white/40">Início</p>
                <p className="text-xs font-bold text-white/80">{initialWeight ? Number(initialWeight).toFixed(1) : "—"} kg</p>
              </button>
              <p className="text-xs font-bold text-white/60">{Math.round(weightProgress * 100)}%</p>
              <button onClick={() => setGoalWeightDrawer(true)} className="text-right active:scale-95 transition-transform">
                <p className="text-[10px] text-white/40">Meta</p>
                <p className="text-xs font-bold text-white/80">{goalWeight?.toFixed(1) ?? "—"} kg</p>
              </button>
            </div>
          </div>

          {/* Insight */}
          <p className="text-[11px] text-white/45 text-center mt-3 font-medium">{insightText}</p>
        </div>
      </div>

      {/* ── Dosage Pill ── */}
      <div className="px-5 -mt-5 relative z-10">
        <button
          onClick={() => navigate("/plano-tratamento")}
          className="w-full bg-card rounded-2xl py-3 px-5 text-center shadow-elevated border border-border/30 active:scale-[0.98] transition-transform"
        >
          <p className="text-sm font-bold text-foreground">
            {dose.currentDose ? `${dose.currentDose} de Mounjaro®` : "Nenhum tratamento registrado"}
          </p>
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="mt-5 px-5">
        <Tabs defaultValue="hoje" className="w-full">
          <TabsList className="w-full bg-muted/50 rounded-2xl p-1 h-auto">
            <TabsTrigger value="hoje" className="flex-1 rounded-xl text-xs font-bold py-2 data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-foreground text-muted-foreground">
              Hoje
            </TabsTrigger>
            <TabsTrigger value="tendencia" className="flex-1 rounded-xl text-xs font-bold py-2 data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-foreground text-muted-foreground">
              Tendência
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex-1 rounded-xl text-xs font-bold py-2 data-[state=active]:bg-card data-[state=active]:shadow-card data-[state=active]:text-foreground text-muted-foreground">
              Histórico
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Hoje ── */}
          <TabsContent value="hoje" className="mt-4 animate-fade-in">
            <div className="bg-card rounded-[20px] p-5 shadow-card border border-border/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Foto de hoje</h3>
                <button onClick={() => { setGalleryInitialIndex(0); setGalleryOpen(true); }} className="text-muted-foreground active:scale-95 transition-transform">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {todayPhoto ? (
                <div className="space-y-3">
                  <div className="rounded-2xl overflow-hidden bg-muted aspect-[3/4] max-h-[45vh]">
                    <img src={todayPhoto.url} alt="Progresso" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeletePhoto}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-destructive/20 text-destructive text-xs font-semibold active:scale-95 transition-transform"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted/60 text-foreground text-xs font-semibold cursor-pointer active:scale-95 transition-transform">
                      <ImagePlus className="w-3.5 h-3.5" /> Trocar
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Empty illustration */}
                  <div className="rounded-2xl bg-muted/40 aspect-[4/3] flex flex-col items-center justify-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-muted/60 flex items-center justify-center">
                      <Camera className="w-7 h-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Registre sua primeira foto hoje</p>
                  </div>

                  {/* CTAs — camera dominant */}
                  <div className="space-y-2">
                    <label className={cn(
                      "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white cursor-pointer active:scale-[0.97] transition-transform",
                      uploading && "opacity-50 pointer-events-none"
                    )} style={{ background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))" }}>
                      {uploading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><Camera className="w-5 h-5" /> Tirar foto</>
                      )}
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                    </label>
                    <label className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/50 text-sm font-semibold text-foreground cursor-pointer active:scale-[0.97] transition-transform",
                      uploading && "opacity-50 pointer-events-none"
                    )}>
                      <ImagePlus className="w-4 h-4" /> Galeria
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Tendência ── */}
          <TabsContent value="tendencia" className="mt-4 animate-fade-in">
            <div className="bg-card rounded-[20px] p-5 shadow-card border border-border/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-foreground">Tendência de peso</h3>
                <button
                  onClick={() => setWeightDrawerOpen(true)}
                  className="text-xs font-medium text-muted-foreground flex items-center gap-0.5 active:scale-95 transition-transform"
                >
                  Ver todas <ChevronRight className="w-3 h-3" />
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
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
                </div>
              ) : weightData.length >= 2 ? (
                <div className="h-48 animate-fade-in">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => `${v}`} />
                      <defs>
                        <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="hsl(295, 55%, 42%)" />
                          <stop offset="100%" stopColor="hsl(340, 65%, 62%)" />
                        </linearGradient>
                      </defs>
                      <Line type="monotone" dataKey="peso" stroke="url(#weightLineGrad)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(340, 65%, 62%)" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Seu gráfico aparecerá aqui</p>
                  <button
                    onClick={() => navigate("/registrar")}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform"
                    style={{ background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))" }}
                  >
                    Registrar peso
                  </button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Tab: Histórico ── */}
          <TabsContent value="historico" className="mt-4 animate-fade-in">
            <div className="bg-card rounded-[20px] p-5 shadow-card border border-border/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-foreground">Fotos de progresso</h3>
                <button
                  onClick={() => { setGalleryInitialIndex(0); setGalleryOpen(true); }}
                  className="text-xs font-medium text-muted-foreground flex items-center gap-0.5 active:scale-95 transition-transform"
                >
                  Ver todas <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {photos.slice(0, 4).map((photo, idx) => (
                    <button
                      key={photo.id}
                      onClick={() => { setGalleryInitialIndex(idx); setGalleryOpen(true); }}
                      className="flex flex-col gap-1 active:scale-[0.97] transition-transform"
                    >
                      <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-muted">
                        <img src={photo.url} alt="Progresso" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center font-medium">
                        {new Date(photo.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-2xl bg-muted/40 aspect-[3/4] flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground/20" />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Nenhuma foto registrada ainda</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Drawers */}
      <WeightTrendsDrawer open={weightDrawerOpen} onOpenChange={setWeightDrawerOpen} weightHistory={weightData.map(({ date, peso }) => ({ date, peso }))} />
      <WeightPickerDrawer open={startWeightDrawer} onOpenChange={setStartWeightDrawer} initialWeight={initialWeight ? Number(initialWeight) : 74} onSave={saveStartWeight} />
      <WeightPickerDrawer open={goalWeightDrawer} onOpenChange={setGoalWeightDrawer} initialWeight={goalWeight ?? 65} onSave={saveGoalWeight} />
      <PhotoGalleryDrawer open={galleryOpen} onOpenChange={setGalleryOpen} initialIndex={galleryInitialIndex} onPhotosChanged={fetchData} />
    </div>
  );
};

export default ProgressPage;
