import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";

const STREAK_START_DATE = "2026-03-25";

export function useStreak() {
  const { user } = useAuth();
  const [streakCount, setStreakCount] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [loading, setLoading] = useState(true);

  const today = localDateStr(new Date());
  const isActive = today >= STREAK_START_DATE;

  const fetchStreak = useCallback(async () => {
    if (!user || !isActive) { setLoading(false); return; }

    // Upsert today's record
    await supabase.from("symptom_streaks").upsert(
      { user_id: user.id, date: today, checked_in: false, streak_count: 0 },
      { onConflict: "user_id,date", ignoreDuplicates: true }
    );

    // Get today's record
    const { data: todayData } = await supabase
      .from("symptom_streaks")
      .select("checked_in, streak_count")
      .eq("user_id", user.id)
      .eq("date", today)
      .limit(1);

    const rec = (todayData as any[])?.[0];
    if (rec) {
      setCheckedInToday(rec.checked_in);
      if (rec.checked_in) {
        setStreakCount(rec.streak_count);
      } else {
        // Calculate what the streak WOULD be based on yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = localDateStr(yesterday);

        if (yesterdayStr < STREAK_START_DATE) {
          setStreakCount(0);
        } else {
          const { data: yd } = await supabase
            .from("symptom_streaks")
            .select("streak_count, checked_in")
            .eq("user_id", user.id)
            .eq("date", yesterdayStr)
            .limit(1);
          const yRec = (yd as any[])?.[0];
          if (yRec?.checked_in) {
            setStreakCount(yRec.streak_count);
          } else {
            setStreakCount(0);
          }
        }
      }
    }
    setLoading(false);
  }, [user, today, isActive]);

  useEffect(() => { fetchStreak(); }, [fetchStreak]);

  const markCheckedIn = useCallback(async () => {
    if (!user || !isActive) return;

    // Get yesterday's streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = localDateStr(yesterday);

    let prevStreak = 0;
    if (yesterdayStr >= STREAK_START_DATE) {
      const { data: yd } = await supabase
        .from("symptom_streaks")
        .select("streak_count, checked_in")
        .eq("user_id", user.id)
        .eq("date", yesterdayStr)
        .limit(1);
      const yRec = (yd as any[])?.[0];
      if (yRec?.checked_in) prevStreak = yRec.streak_count;
    }

    const newStreak = prevStreak + 1;

    await supabase.from("symptom_streaks").upsert(
      { user_id: user.id, date: today, checked_in: true, streak_count: newStreak },
      { onConflict: "user_id,date" }
    );

    setCheckedInToday(true);
    setStreakCount(newStreak);
  }, [user, today, isActive]);

  return { streakCount, checkedInToday, isActive, loading, markCheckedIn, refresh: fetchStreak };
}
