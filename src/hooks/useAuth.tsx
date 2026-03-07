import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTriageData, clearTriageData, hasTriageData } from "@/hooks/useTriageStorage";
import { localDateStr } from "@/lib/utils";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  name: string | null;
  triage_completed: boolean;
  current_dose: string | null;
  current_weight: number | null;
  goal: string | null;
  application_day: string | null;
  mounjaro_start_date: string | null;
  activity_level: string | null;
  common_side_effects: string[];
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setProfile(data as unknown as Profile);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const savePendingTriage = async (userId: string) => {
    const data = getTriageData();
    if (!data) return;
    try {
      const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
      const currentWeight = data.weightKg + data.weightDecimal / 10;
      const currentDose = data.doseValue ? `${data.doseValue} mg` : null;
      const age = new Date().getFullYear() - data.birthYear;
      const deriveGoal = () => {
        if (data.motivations.includes("health_control")) return "weight_loss";
        if (data.motivations.includes("food_relationship")) return "glycemic_control";
        return "weight_loss";
      };
      const deriveInterval = () => {
        if (data.frequency === "daily") return 1;
        if (data.frequency === "weekly") return 7;
        return data.customIntervalDays;
      };
      await supabase.from("profiles").update({
        name: data.name, sex: data.sex || null, age, height_cm: data.heightCm,
        current_weight: currentWeight, goal: deriveGoal(), current_dose: currentDose,
        application_interval_days: deriveInterval(),
        application_day: weekDays[data.applicationDay] || null,
        application_frequency: data.frequency, triage_completed: true,
      } as any).eq("id", userId);
      if (currentDose && data.lastApplicationDate) {
        await supabase.from("injections").insert({
          user_id: userId, date: data.lastApplicationDate, dose: currentDose,
          site: data.injectionSite || null, notes: "Registrado via triagem inicial",
        });
      }
      await supabase.from("daily_logs").insert({
        user_id: userId, date: localDateStr(), weight: currentWeight,
      });
      clearTriageData();
    } catch (err) {
      console.error("Error saving triage:", err);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(async () => {
            await fetchProfile(session.user.id);
            // Save triage data if pending (e.g. after OAuth signup)
            if (hasTriageData()) {
              await savePendingTriage(session.user.id);
              await fetchProfile(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        // Token invalid or account deleted — clear local session
        supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        }
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
