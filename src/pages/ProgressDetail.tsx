import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { localDateStr } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { useNavigate } from "react-router-dom";
import logoMounja from "@/assets/logo-mounja.png";

const ProgressDetail = () => {
  const { user, profile } = useAuth();
  const { dose } = useApplicationData();
  const navigate = useNavigate();

  const [weightData, setWeightData] = useState<{ date: string; peso: number; label: string }[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [latestPhoto, setLatestPhoto] = useState<{ url: string; weight?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [logsRes, injRes, photosRes] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("date, weight")
        .eq("user_id", user.id)
        .not("weight", "is", null)
        .order("date", { ascending: true }),
      supabase
        .from("injections")
        .select("date, dose, site")
        .eq("user_id", user.id)
        .order("date", { ascending: false }),
      supabase
        .from("progress_photos")
        .select("id, photo_url, date")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1),
    ]);

    setWeightData(
      ((logsRes.data as any[]) || []).map((l) => ({
        date: l.date,
        peso: Number(l.weight),
        label: new Date(l.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      }))
    );
    setInjections((injRes.data as any[]) || []);

    const rawPhotos = (photosRes.data as any[]) || [];
    if (rawPhotos.length > 0) {
      const { data } = await supabase.storage.from("progress-photos").createSignedUrl(rawPhotos[0].photo_url, 3600);
      // Find weight for the photo date
      const photoDate = rawPhotos[0].date;
      const matchingLog = ((logsRes.data as any[]) || []).find((l) => l.date === photoDate);
      setLatestPhoto({
        url: data?.signedUrl || "",
        weight: matchingLog ? Number(matchingLog.weight) : undefined,
      });
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const initialWeight = profile?.current_weight;
  const currentWeight = weightData.length > 0 ? weightData[weightData.length - 1].peso : initialWeight ? Number(initialWeight) : null;
  const totalLost = initialWeight && currentWeight ? Number(initialWeight) - currentWeight : null;

  const startDate = profile?.mounjaro_start_date ? new Date(profile.mounjaro_start_date + "T12:00:00") : null;
  const daysOnTreatment = startDate ? Math.max(1, Math.floor((Date.now() - startDate.getTime()) / 86400000)) : null;

  const heightCm = profile?.height_cm ? Number(profile.height_cm) : null;
  const bmi = currentWeight && heightCm ? (currentWeight / ((heightCm / 100) ** 2)).toFixed(1) : null;

  // Progress bar (0 to 1)
  const goalWeightRaw = (profile as any)?.weight_goal ? parseFloat(String((profile as any).weight_goal).replace(",", ".")) : NaN;
  const goalWeight = isNaN(goalWeightRaw) ? null : goalWeightRaw;
  const weightProgress =
    initialWeight && goalWeight && currentWeight && !isNaN(goalWeight)
      ? Math.min(1, Math.max(0, (Number(initialWeight) - currentWeight) / (Number(initialWeight) - goalWeight)))
      : 0;

  // Get unique doses for reference lines
  const doseChanges: { date: string; dose: string }[] = [];
  const seenDoses = new Set<string>();
  for (const inj of [...injections].reverse()) {
    if (!seenDoses.has(inj.dose)) {
      seenDoses.add(inj.dose);
      doseChanges.push({ date: inj.date, dose: inj.dose });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-nav">
      {/* Header */}
      <div
        className="px-4 pt-2 pb-3 flex items-center gap-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)" }}
      >
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full active:bg-muted transition-colors">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Main card */}
      <div className="mx-4 bg-card rounded-3xl p-4 shadow-card border border-border/30">
        {/* Day badge only */}
        {daysOnTreatment && (
          <div className="flex justify-end mb-3">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
              Dia {daysOnTreatment}
            </span>
          </div>
        )}

        {/* Photo */}
        <div
          onClick={() => navigate("/fotos")}
          className="rounded-2xl overflow-hidden bg-muted relative mb-4 cursor-pointer active:scale-[0.98] transition-transform"
        >
          {latestPhoto?.url ? (
            <>
              <img src={latestPhoto.url} alt="Progresso" className="w-full object-cover aspect-[4/5]" />
              {latestPhoto.weight && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-primary text-primary-foreground text-sm font-bold py-2 px-4 rounded-full text-center w-fit mx-auto">
                    {latestPhoto.weight.toFixed(1)} kg
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full aspect-[4/5] flex items-center justify-center text-muted-foreground text-xs">
              Sem foto
            </div>
          )}
        </div>

        {/* Stats grid - 2x2 for better readability */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          <div className="bg-muted/40 rounded-xl py-2.5 px-2 text-center">
            <p className="text-[9px] text-muted-foreground font-medium leading-tight">Data</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </p>
          </div>
          <div className="bg-muted/40 rounded-xl py-2.5 px-2 text-center">
            <p className="text-[9px] text-muted-foreground font-medium leading-tight">Aplic.</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">{injections.length}</p>
          </div>
          <div className="bg-muted/40 rounded-xl py-2.5 px-2 text-center">
            <p className="text-[9px] text-muted-foreground font-medium leading-tight">Perda</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">
              {totalLost && totalLost > 0 ? `-${totalLost.toFixed(1)}` : "—"}
            </p>
          </div>
          <div className="bg-muted/40 rounded-xl py-2.5 px-2 text-center">
            <p className="text-[9px] text-muted-foreground font-medium leading-tight">IMC</p>
            <p className="text-sm font-extrabold text-foreground mt-0.5">{bmi ?? "—"}</p>
          </div>
        </div>

        {/* Weight chart with dose reference lines */}
        {weightData.length >= 2 && (
          <div className="mt-2">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={["dataMin - 2", "dataMax + 2"]}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                    tickFormatter={(v) => `${v} kg`}
                  />
                  {/* Dose change reference lines */}
                  {doseChanges.map((dc) => {
                    const matchLabel = weightData.find((w) => w.date === dc.date)?.label;
                    if (!matchLabel) return null;
                    return (
                      <ReferenceLine
                        key={dc.date}
                        x={matchLabel}
                        stroke="hsl(var(--primary))"
                        strokeDasharray="4 4"
                        label={{ value: dc.dose, position: "top", fill: "hsl(var(--primary))", fontSize: 10, fontWeight: 600 }}
                      />
                    );
                  })}
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={1.5}
                    dot={{ r: 3, fill: "hsl(var(--primary))", stroke: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Timeline horizontal */}
      <div className="mx-4 mt-5 bg-card rounded-3xl py-4 shadow-card border border-border/30">
        <div className="flex justify-between px-5 mb-2 text-[10px] text-muted-foreground font-medium">
          <span>{initialWeight ? `${Number(initialWeight).toFixed(1)} kg` : "—"}</span>
          <span>{goalWeight && !isNaN(goalWeight) ? `Meta: ${goalWeight.toFixed(1)} kg` : "Sem meta"}</span>
        </div>
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex items-end gap-0 px-5 min-w-max">
            {weightData.length > 0 ? weightData.map((entry, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === weightData.length - 1;
              const minW = weightData.reduce((m, e) => Math.min(m, e.peso), Infinity);
              const maxW = weightData.reduce((m, e) => Math.max(m, e.peso), -Infinity);
              const range = maxW - minW || 1;
              const barH = 16 + ((entry.peso - minW) / range) * 32;

              return (
                <div key={entry.date} className="flex flex-col items-center" style={{ minWidth: 48 }}>
                  <span className="text-[9px] font-bold text-foreground mb-0.5">
                    {entry.peso.toFixed(1)}
                  </span>
                  <div
                    className={`w-3 rounded-full transition-all ${isLast ? "bg-primary" : "bg-primary/30"}`}
                    style={{ height: barH }}
                  />
                  <span className="text-[8px] text-muted-foreground mt-1">{entry.label}</span>
                </div>
              );
            }) : (
              <div className="text-xs text-muted-foreground py-4 w-full text-center">Sem registros</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressDetail;
