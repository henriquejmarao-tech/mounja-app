import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";

// ─── Canonical Models ───────────────────────────────────────────────
export interface CanonicalDose {
  currentDose: string | null;
  unit: string;
  lastApplicationAt: string | null; // ISO UTC
  nextPlannedDose: string | null;
  nextApplicationAt: string | null; // ISO UTC
  applicationIntervalDays: number;
  preferredApplicationTime: string | null;
}

export interface RecentSymptoms {
  nausea: number;
  fatigue: number;
  headache: number;
  constipation: number;
  diarrhea: number;
}

export interface ApplicationInjection {
  id: string;
  date: string;
  applied_at: string | null;
  medication: string | null;
  dose: string;
  site: string | null;
  notes: string | null;
  created_at?: string | null;
}

export interface ApplicationWorkout {
  id: string;
  date: string;
  workout_type: string;
  duration_minutes: number;
  intensity: string;
  feeling_after: number | null;
}

interface ApplicationDataContextType {
  dose: CanonicalDose;
  getCurrentDose: () => string | null;
  getLastConfirmedApplication: () => ApplicationInjection | null;
  getApplicationTimeline: () => ApplicationInjection[];
  setConfirmedApplication: (injection: Omit<ApplicationInjection, "id" | "created_at">) => Promise<void>;
  updateApplication: (id: string, data: Partial<Omit<ApplicationInjection, "id">>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  recentSymptoms: RecentSymptoms;
  weeklyWorkouts: ApplicationWorkout[];
  weeklyWorkoutCount: number;
  latestWeight: number | null;
  refresh: () => Promise<void>;
  loading: boolean;
}

const defaultSymptoms: RecentSymptoms = { nausea: 0, fatigue: 0, headache: 0, constipation: 0, diarrhea: 0 };

const defaultDose: CanonicalDose = {
  currentDose: null,
  unit: "mg",
  lastApplicationAt: null,
  nextPlannedDose: null,
  nextApplicationAt: null,
  applicationIntervalDays: 7,
  preferredApplicationTime: null,
};

const ApplicationDataContext = createContext<ApplicationDataContextType>({
  dose: defaultDose,
  getCurrentDose: () => null,
  getLastConfirmedApplication: () => null,
  getApplicationTimeline: () => [],
  setConfirmedApplication: async () => {},
  updateApplication: async () => {},
  deleteApplication: async () => {},
  recentSymptoms: defaultSymptoms,
  weeklyWorkouts: [],
  weeklyWorkoutCount: 0,
  latestWeight: null,
  refresh: async () => {},
  loading: true,
});

export const useApplicationData = () => useContext(ApplicationDataContext);

export const ApplicationDataProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [dose, setDose] = useState<CanonicalDose>(defaultDose);
  const [injections, setInjections] = useState<ApplicationInjection[]>([]);
  const [recentSymptoms, setRecentSymptoms] = useState<RecentSymptoms>(defaultSymptoms);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<ApplicationWorkout[]>([]);
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const weekAgo = localDateStr(new Date(Date.now() - 7 * 86400000));

    const [injRes, logsRes, workoutsRes] = await Promise.all([
      supabase.from("injections").select("*").eq("user_id", user.id).order("applied_at", { ascending: false }).order("date", { ascending: false }),
      supabase.from("daily_logs").select("symptom_nausea, symptom_fatigue, symptom_headache, symptom_constipation, symptom_diarrhea, weight, date").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
      supabase.from("workouts").select("*").eq("user_id", user.id).gte("date", weekAgo).order("date", { ascending: false }),
    ]);

    // ── Injections & Dose SSOT ──
    const allInj = ((injRes.data as any[]) || []).map((i: any) => ({
      id: i.id, date: i.date, applied_at: i.applied_at, medication: i.medication, dose: i.dose, site: i.site, notes: i.notes, created_at: i.created_at,
    })) as ApplicationInjection[];

    setInjections(allInj);

    const lastConfirmed = allInj[0] || null;
    // Use application_interval_days from profile (default 7)
    const intervalDays = (profile as any)?.application_interval_days || 7;
    const preferredApplicationTime = ((profile as any)?.preferred_application_time as string | null)?.slice(0, 5) || null;
    const nextApplicationAt = ((profile as any)?.next_dose_scheduled_at as string | null) || null;

    // Use profile.current_dose as SSOT (updated by Treatment Plan),
    // fall back to last injection dose if profile dose is not set
    const profileDose = (profile as any)?.current_dose || null;
    const canonicalDose: CanonicalDose = {
      currentDose: profileDose ?? lastConfirmed?.dose ?? null,
      unit: "mg",
      lastApplicationAt: lastConfirmed?.created_at ?? (lastConfirmed ? new Date(`${lastConfirmed.date}T12:00:00`).toISOString() : null),
      nextPlannedDose: profileDose ?? lastConfirmed?.dose ?? null,
      nextApplicationAt,
      applicationIntervalDays: intervalDays,
      preferredApplicationTime,
    };

    setDose(canonicalDose);

    if (import.meta.env.DEV) {
      console.log(`[SSOT] currentDose = ${canonicalDose.currentDose}`);
      console.log(`[SSOT] lastApplicationAt = ${canonicalDose.lastApplicationAt}`);
      console.log(`[SSOT] nextApplicationAt = ${canonicalDose.nextApplicationAt}`);
      console.log(`[SSOT] applicationIntervalDays = ${intervalDays}`);
    }

    // ── Symptoms (last 7 days) ──
    const logs = ((logsRes.data as any[]) || []);
    const recentLogs = logs.filter(l => {
      const d = new Date(l.date + "T12:00:00");
      return (Date.now() - d.getTime()) <= 7 * 86400000;
    });

    if (recentLogs.length > 0) {
      const avg = (key: string) => recentLogs.reduce((s, l) => s + (l[key] || 0), 0) / recentLogs.length;
      setRecentSymptoms({
        nausea: avg("symptom_nausea"), fatigue: avg("symptom_fatigue"),
        headache: avg("symptom_headache"), constipation: avg("symptom_constipation"),
        diarrhea: avg("symptom_diarrhea"),
      });
    } else {
      setRecentSymptoms(defaultSymptoms);
    }

    // ── Latest weight ──
    const wLog = logs.find(l => l.weight);
    setLatestWeight(wLog?.weight ?? null);
    if (import.meta.env.DEV) console.log(`[Hub] latest weight loaded = ${wLog?.weight ?? null}`);

    // ── Weekly workouts ──
    const wk = ((workoutsRes.data as any[]) || []).map((w: any) => ({
      id: w.id, date: w.date, workout_type: w.workout_type,
      duration_minutes: w.duration_minutes, intensity: w.intensity, feeling_after: w.feeling_after,
    })) as ApplicationWorkout[];
    setWeeklyWorkouts(wk);

    setLoading(false);
  }, [user, profile]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const getCurrentDose = useCallback(() => {
    if (import.meta.env.DEV) console.log(`[SSOT] getCurrentDose() called → ${dose.currentDose}`);
    return dose.currentDose;
  }, [dose.currentDose]);

  const getLastConfirmedApplication = useCallback(() => injections[0] || null, [injections]);
  const getApplicationTimeline = useCallback(() => injections, [injections]);

  const setConfirmedApplication = useCallback(async (injection: Omit<ApplicationInjection, "id" | "created_at">) => {
    if (!user) return;
    const shouldPromptPush = injections.length === 0 && !(profile as any)?.push_permission_asked_at;
    const { error } = await supabase.from("injections").insert({
      user_id: user.id, date: injection.date, dose: injection.dose,
      applied_at: injection.applied_at || null, medication: injection.medication || null,
      site: injection.site || null, notes: injection.notes || null,
    });
    if (error) throw error;
    if (shouldPromptPush) {
      sessionStorage.setItem("mounja_show_first_injection_push_prompt", "1");
    }
    await supabase.from("profiles").update({ current_dose: injection.dose } as any).eq("id", user.id);
    await refreshProfile();
    await fetchAll();
  }, [user, injections.length, profile, refreshProfile, fetchAll]);

  const updateApplication = useCallback(async (id: string, data: Partial<Omit<ApplicationInjection, "id">>) => {
    if (!user) return;
    const { error } = await supabase.from("injections").update(data).eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    await refreshProfile();
    await fetchAll();
  }, [user, refreshProfile, fetchAll]);

  const deleteApplication = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("injections").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    await refreshProfile();
    await fetchAll();
  }, [user, refreshProfile, fetchAll]);

  return (
    <ApplicationDataContext.Provider value={{
      dose, getCurrentDose, getLastConfirmedApplication, getApplicationTimeline,
      setConfirmedApplication, updateApplication, deleteApplication,
      recentSymptoms, weeklyWorkouts, weeklyWorkoutCount: weeklyWorkouts.length,
      latestWeight, refresh: fetchAll, loading,
    }}>
      {children}
    </ApplicationDataContext.Provider>
  );
};
