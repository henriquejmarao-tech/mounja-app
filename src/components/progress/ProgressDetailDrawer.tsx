import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { localDateStr } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProgressDetailDrawer = ({ open, onOpenChange }: Props) => {
  const { user, profile } = useAuth();
  const { dose } = useApplicationData();
  const navigate = useNavigate();

  const [weightData, setWeightData] = useState<{ date: string; peso: number; label: string }[]>([]);
  const [injections, setInjections] = useState<any[]>([]);
  const [todayPhoto, setTodayPhoto] = useState<{ url: string; weight?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !open) return;
    setLoading(true);

    const todayStr = localDateStr(new Date());

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
        .eq("date", todayStr)
        .order("created_at", { ascending: false })
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
      const matchingLog = ((logsRes.data as any[]) || []).find((l) => l.date === rawPhotos[0].date);
      setTodayPhoto({
        url: data?.signedUrl || "",
        weight: matchingLog ? Number(matchingLog.weight) : undefined,
      });
    } else {
      setTodayPhoto(null);
    }

    setLoading(false);
  }, [user, open]);

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

  const goalWeightRaw = (profile as any)?.weight_goal ? parseFloat(String((profile as any).weight_goal).replace(",", ".")) : NaN;
  const goalWeight = isNaN(goalWeightRaw) ? null : goalWeightRaw;
  const weightProgress =
    initialWeight && goalWeight && currentWeight && !isNaN(goalWeight)
      ? Math.min(1, Math.max(0, (Number(initialWeight) - currentWeight) / (Number(initialWeight) - goalWeight)))
      : 0;

  // Dose change reference lines
  const doseChanges: { date: string; dose: string }[] = [];
  const seenDoses = new Set<string>();
  for (const inj of [...injections].reverse()) {
    if (!seenDoses.has(inj.dose)) {
      seenDoses.add(inj.dose);
      doseChanges.push({ date: inj.date, dose: inj.dose });
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="overflow-y-auto px-4 pb-8 pt-2">
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Main card */}
              <div className="bg-card rounded-3xl p-4 shadow-card border border-border/30">
                {daysOnTreatment && (
                  <div className="flex justify-end mb-3">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">
                      Dia {daysOnTreatment}
                    </span>
                  </div>
                )}

                {/* Photo - today only */}
                <div
                  onClick={() => { onOpenChange(false); navigate("/fotos"); }}
                  className="rounded-2xl overflow-hidden bg-muted relative mb-4 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  {todayPhoto?.url ? (
                    <>
                      <img src={todayPhoto.url} alt="Progresso" className="w-full object-cover aspect-[4/5]" />
                      {todayPhoto.weight && (
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-primary text-primary-foreground text-sm font-bold py-2 px-4 rounded-full text-center w-fit mx-auto">
                            {todayPhoto.weight.toFixed(1)} kg
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full aspect-[4/5] flex items-center justify-center text-muted-foreground text-xs text-center px-4">
                      Nenhuma foto de hoje
                    </div>
                  )}
                </div>

                {/* Stats */}
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
              </div>

              {/* Weight chart */}
              {weightData.length >= 2 && (
                <div className="mt-4 bg-card rounded-3xl p-4 shadow-card border border-border/30">
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
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProgressDetailDrawer;
