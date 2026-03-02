import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── Canonical Models ───────────────────────────────────────────────
export interface CanonicalDose {
  currentDose: string | null;
  unit: string;
  lastApplicationAt: string | null; // ISO UTC
  nextPlannedDose: string | null;
  nextApplicationAt: string | null; // ISO UTC
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
  dose: string;
  site: string | null;
  notes: string | null;
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
  // Dose SSOT
  dose: CanonicalDose;
  getCurrentDose: () => string | null;
  getLastConfirmedApplication: () => ApplicationInjection | null;
  getApplicationTimeline: () => ApplicationInjection[];
  setConfirmedApplication: (injection: Omit<ApplicationInjection, "id">) => Promise<void>;

  // Symptoms (last 7 days)
  recentSymptoms: RecentSymptoms;

  // Workouts (last 7 days)
  weeklyWorkouts: ApplicationWorkout[];
  weeklyWorkoutCount: number;

  // Latest weight
  latestWeight: number | null;

  // Refresh
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
};

const ApplicationDataContext = createContext<ApplicationDataContextType>({
  dose: defaultDose,
  getCurrentDose: () => null,
  getLastConfirmedApplication: () => null,
  getApplicationTimeline: () => [],
  setConfirmedApplication: async () => {},
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

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

    const [injRes, logsRes, workoutsRes] = await Promise.all([
      supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("daily_logs").select("symptom_nausea, symptom_fatigue, symptom_headache, symptom_constipation, symptom_diarrhea, weight, date").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
      supabase.from("workouts").select("*").eq("user_id", user.id).gte("date", weekAgo).order("date", { ascending: false }),
    ]);

    // ── Injections & Dose SSOT ──
    const allInj = ((injRes.data as any[]) || []).map((i: any) => ({
      id: i.id,
      date: i.date,
      dose: i.dose,
      site: i.site,
      notes: i.notes,
    })) as ApplicationInjection[];

    setInjections(allInj);

    const lastConfirmed = allInj[0] || null;
    const applicationDay = profile?.application_day;
    const applicationFreq = profile?.application_frequency;

    let nextApplicationAt: string | null = null;
    if (lastConfirmed) {
      const lastDate = new Date(lastConfirmed.date + "T12:00:00");
      const intervalDays = applicationFreq === "biweekly" ? 14 : 7;
      const nextDate = new Date(lastDate.getTime() + intervalDays * 86400000);
      nextApplicationAt = nextDate.toISOString();
    }

    const canonicalDose: CanonicalDose = {
      currentDose: lastConfirmed?.dose ?? null,
      unit: "mg",
      lastApplicationAt: lastConfirmed ? new Date(lastConfirmed.date + "T12:00:00").toISOString() : null,
      nextPlannedDose: lastConfirmed?.dose ?? null,
      nextApplicationAt,
    };

    setDose(canonicalDose);

    if (import.meta.env.DEV) {
      console.log(`[SSOT] currentDose = ${canonicalDose.currentDose}`);
      console.log(`[SSOT] lastApplicationAt = ${canonicalDose.lastApplicationAt}`);
      console.log(`[SSOT] nextApplicationAt = ${canonicalDose.nextApplicationAt}`);
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
        nausea: avg("symptom_nausea"),
        fatigue: avg("symptom_fatigue"),
        headache: avg("symptom_headache"),
        constipation: avg("symptom_constipation"),
        diarrhea: avg("symptom_diarrhea"),
      });
    } else {
      setRecentSymptoms(defaultSymptoms);
    }

    // ── Latest weight ──
    const wLog = logs.find(l => l.weight);
    setLatestWeight(wLog?.weight ?? null);

    // ── Weekly workouts ──
    const wk = ((workoutsRes.data as any[]) || []).map((w: any) => ({
      id: w.id,
      date: w.date,
      workout_type: w.workout_type,
      duration_minutes: w.duration_minutes,
      intensity: w.intensity,
      feeling_after: w.feeling_after,
    })) as ApplicationWorkout[];
    setWeeklyWorkouts(wk);

    setLoading(false);
  }, [user, profile]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Access methods ──
  const getCurrentDose = useCallback(() => {
    if (import.meta.env.DEV) console.log(`[SSOT] getCurrentDose() called → ${dose.currentDose}`);
    return dose.currentDose;
  }, [dose.currentDose]);

  const getLastConfirmedApplication = useCallback(() => {
    return injections[0] || null;
  }, [injections]);

  const getApplicationTimeline = useCallback(() => {
    return injections;
  }, [injections]);

  const setConfirmedApplication = useCallback(async (injection: Omit<ApplicationInjection, "id">) => {
    if (!user) return;

    const { error } = await supabase.from("injections").insert({
      user_id: user.id,
      date: injection.date,
      dose: injection.dose,
      site: injection.site || null,
      notes: injection.notes || null,
    });

    if (error) throw error;

    // Sync profile's current_dose
    await supabase.from("profiles").update({ current_dose: injection.dose } as any).eq("id", user.id);
    await refreshProfile();
    await fetchAll();
  }, [user, refreshProfile, fetchAll]);

  return (
    <ApplicationDataContext.Provider
      value={{
        dose,
        getCurrentDose,
        getLastConfirmedApplication,
        getApplicationTimeline,
        setConfirmedApplication,
        recentSymptoms,
        weeklyWorkouts,
        weeklyWorkoutCount: weeklyWorkouts.length,
        latestWeight,
        refresh: fetchAll,
        loading,
      }}
    >
      {children}
    </ApplicationDataContext.Provider>
  );
};
