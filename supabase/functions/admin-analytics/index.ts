import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ADMIN_EMAIL = "henriquejmarao@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");
    if (user.email !== ADMIN_EMAIL) throw new Error("Forbidden");

    const sb = createClient(supabaseUrl, serviceRoleKey);
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Total users
    const { count: totalUsers } = await sb.from("profiles").select("id", { count: "exact", head: true });

    // Triage completed
    const { count: triageCompleted } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("triage_completed", true);

    // Premium users with source breakdown
    const { data: premiumRows } = await sb.from("premium_access").select("user_id, source, promo_code, status").eq("status", "active");
    const premiumCount = premiumRows?.length || 0;
    const premiumBySource: Record<string, number> = {};
    const premiumByPromo: Record<string, number> = {};
    (premiumRows || []).forEach((r: any) => {
      const src = r.source || "unknown";
      premiumBySource[src] = (premiumBySource[src] || 0) + 1;
      if (r.promo_code) {
        premiumByPromo[r.promo_code] = (premiumByPromo[r.promo_code] || 0) + 1;
      }
    });

    // Today's active users
    const todayActiveIds = new Set<string>();
    const { data: todayLogs } = await sb.from("daily_logs").select("user_id").eq("date", today);
    (todayLogs || []).forEach((l: any) => todayActiveIds.add(l.user_id));
    const { data: todayInjections } = await sb.from("injections").select("user_id").eq("date", today);
    (todayInjections || []).forEach((i: any) => todayActiveIds.add(i.user_id));
    const { data: todayMeals } = await sb.from("meal_logs").select("user_id").eq("date", today);
    (todayMeals || []).forEach((m: any) => todayActiveIds.add(m.user_id));
    const { data: todayWorkouts } = await sb.from("workouts").select("user_id").eq("date", today);
    (todayWorkouts || []).forEach((w: any) => todayActiveIds.add(w.user_id));

    // Yesterday's active users
    const yesterdayActiveIds = new Set<string>();
    const { data: yLogs } = await sb.from("daily_logs").select("user_id").eq("date", yesterday);
    (yLogs || []).forEach((l: any) => yesterdayActiveIds.add(l.user_id));
    const { data: yInj } = await sb.from("injections").select("user_id").eq("date", yesterday);
    (yInj || []).forEach((i: any) => yesterdayActiveIds.add(i.user_id));
    const { data: yMeals } = await sb.from("meal_logs").select("user_id").eq("date", yesterday);
    (yMeals || []).forEach((m: any) => yesterdayActiveIds.add(m.user_id));
    const { data: yWorkouts } = await sb.from("workouts").select("user_id").eq("date", yesterday);
    (yWorkouts || []).forEach((w: any) => yesterdayActiveIds.add(w.user_id));

    // Feature usage totals
    const { count: totalLogs } = await sb.from("daily_logs").select("id", { count: "exact", head: true });
    const { count: totalInjections } = await sb.from("injections").select("id", { count: "exact", head: true });
    const { count: totalMeals } = await sb.from("meal_logs").select("id", { count: "exact", head: true });
    const { count: totalWorkouts } = await sb.from("workouts").select("id", { count: "exact", head: true });
    const { count: totalPhotos } = await sb.from("progress_photos").select("id", { count: "exact", head: true });
    const { count: totalFeedback } = await sb.from("feedback").select("id", { count: "exact", head: true });

    // Feature usage today
    const { count: todayLogsCount } = await sb.from("daily_logs").select("id", { count: "exact", head: true }).eq("date", today);
    const { count: todayInjectionsCount } = await sb.from("injections").select("id", { count: "exact", head: true }).eq("date", today);
    const { count: todayMealsCount } = await sb.from("meal_logs").select("id", { count: "exact", head: true }).eq("date", today);
    const { count: todayWorkoutsCount } = await sb.from("workouts").select("id", { count: "exact", head: true }).eq("date", today);
    const { count: todayPhotosCount } = await sb.from("progress_photos").select("id", { count: "exact", head: true }).eq("date", today);

    // Unique users per feature (for per-user averages)
    const { data: logUsers } = await sb.from("daily_logs").select("user_id");
    const { data: injUsers } = await sb.from("injections").select("user_id");
    const { data: mealUsers } = await sb.from("meal_logs").select("user_id");
    const { data: workoutUsers } = await sb.from("workouts").select("user_id");
    const { data: photoUsers } = await sb.from("progress_photos").select("user_id");

    const uniqueLogUsers = new Set((logUsers || []).map((r: any) => r.user_id)).size;
    const uniqueInjUsers = new Set((injUsers || []).map((r: any) => r.user_id)).size;
    const uniqueMealUsers = new Set((mealUsers || []).map((r: any) => r.user_id)).size;
    const uniqueWorkoutUsers = new Set((workoutUsers || []).map((r: any) => r.user_id)).size;
    const uniquePhotoUsers = new Set((photoUsers || []).map((r: any) => r.user_id)).size;

    // Last 7 days activity
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const { count: logs } = await sb.from("daily_logs").select("id", { count: "exact", head: true }).eq("date", dateStr);
      const { count: inj } = await sb.from("injections").select("id", { count: "exact", head: true }).eq("date", dateStr);
      const { count: meals } = await sb.from("meal_logs").select("id", { count: "exact", head: true }).eq("date", dateStr);
      const { count: wk } = await sb.from("workouts").select("id", { count: "exact", head: true }).eq("date", dateStr);
      last7.push({ date: dateStr, logs: logs || 0, injections: inj || 0, meals: meals || 0, workouts: wk || 0 });
    }

    // Retention D1 and D7
    const { data: allProfiles } = await sb.from("profiles").select("id, name, current_dose, medication, triage_completed, created_at").order("created_at", { ascending: false }).limit(200);

    // Build sets of active dates per user for retention
    const allActivityByUser: Record<string, Set<string>> = {};
    const addActivity = (rows: any[] | null) => {
      (rows || []).forEach((r: any) => {
        if (!allActivityByUser[r.user_id]) allActivityByUser[r.user_id] = new Set();
        if (r.date) allActivityByUser[r.user_id].add(r.date);
      });
    };
    // Fetch all dates for retention calc
    const { data: allLogs } = await sb.from("daily_logs").select("user_id, date");
    const { data: allInj } = await sb.from("injections").select("user_id, date");
    const { data: allMealsAll } = await sb.from("meal_logs").select("user_id, date");
    const { data: allWorkoutsAll } = await sb.from("workouts").select("user_id, date");
    addActivity(allLogs);
    addActivity(allInj);
    addActivity(allMealsAll);
    addActivity(allWorkoutsAll);

    let d1Eligible = 0, d1Retained = 0, d7Eligible = 0, d7Retained = 0;
    for (const p of (allProfiles || [])) {
      if (!p.created_at) continue;
      const signupDate = new Date(p.created_at);
      const signupDateStr = signupDate.toISOString().split("T")[0];
      const daysSince = Math.floor((Date.now() - signupDate.getTime()) / 86400000);
      const userDates = allActivityByUser[p.id];

      if (daysSince >= 1) {
        d1Eligible++;
        const d1Date = new Date(signupDate.getTime() + 86400000).toISOString().split("T")[0];
        if (userDates?.has(d1Date)) d1Retained++;
      }
      if (daysSince >= 7) {
        d7Eligible++;
        const d7Date = new Date(signupDate.getTime() + 7 * 86400000).toISOString().split("T")[0];
        if (userDates?.has(d7Date)) d7Retained++;
      }
    }

    // Credits data
    let creditsData: any = null;
    try {
      // Today credits
      const { data: todayCredits } = await sb.from("daily_meal_credits").select("*").eq("date", today);
      const totalCreditsToday = (todayCredits || []).reduce((s: number, r: any) => s + (r.credits_used || 0), 0);
      const limitHitToday = (todayCredits || []).filter((r: any) => r.credits_used >= r.credits_max).length;

      // Last 7 days credits
      const creditsLast7 = [];
      const limitLast7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const { data: dayCredits } = await sb.from("daily_meal_credits").select("*").eq("date", dateStr);
        const dayTotal = (dayCredits || []).reduce((s: number, r: any) => s + (r.credits_used || 0), 0);
        const dayLimit = (dayCredits || []).filter((r: any) => r.credits_used >= r.credits_max).length;
        creditsLast7.push({ date: dateStr, credits: dayTotal });
        limitLast7.push({ date: dateStr, users: dayLimit });
      }

      // Users who hit limit in last 3 days
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
      const { data: recentLimitRows } = await sb.from("daily_meal_credits").select("*").gte("date", threeDaysAgo);
      const limitUserMap: Record<string, { count: number; userId: string }> = {};
      (recentLimitRows || []).forEach((r: any) => {
        if (r.credits_used >= r.credits_max) {
          if (!limitUserMap[r.user_id]) limitUserMap[r.user_id] = { count: 0, userId: r.user_id };
          limitUserMap[r.user_id].count++;
        }
      });

      // Enrich with user info
      const limitUsers = [];
      for (const entry of Object.values(limitUserMap)) {
        const profile = (allProfiles || []).find((p: any) => p.id === entry.userId);
        let email = "—";
        try {
          const { data: { user: authUser } } = await sb.auth.admin.getUserById(entry.userId);
          email = authUser?.email || "—";
        } catch {}
        const daysSinceSignup = profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000) : 0;
        limitUsers.push({
          id: entry.userId,
          name: profile?.name || "Sem nome",
          email,
          timesHitLimit: entry.count,
          daysSinceSignup,
        });
      }

      creditsData = {
        totalCreditsToday,
        limitHitToday,
        creditsLast7,
        limitLast7,
        limitUsers,
      };
    } catch {
      creditsData = null;
    }

    // Per-user breakdown
    const premiumUserIds = new Set((premiumRows || []).map((r: any) => r.user_id));
    const premiumSourceMap: Record<string, { source: string; promo_code: string | null }> = {};
    (premiumRows || []).forEach((r: any) => {
      premiumSourceMap[r.user_id] = { source: r.source, promo_code: r.promo_code };
    });

    const userBreakdown = [];
    const signupsByProvider: Record<string, number> = {};
    const signupsByMonth: Record<string, number> = {};
    const botSuspects: any[] = [];

    for (const p of (allProfiles || [])) {
      const { count: uLogs } = await sb.from("daily_logs").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uInj } = await sb.from("injections").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uMeals } = await sb.from("meal_logs").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uWorkouts } = await sb.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uPhotos } = await sb.from("progress_photos").select("id", { count: "exact", head: true }).eq("user_id", p.id);

      const { data: { user: authUser } } = await sb.auth.admin.getUserById(p.id);
      const provider = authUser?.app_metadata?.provider || "email";
      const email = authUser?.email || "—";

      signupsByProvider[provider] = (signupsByProvider[provider] || 0) + 1;

      if (p.created_at) {
        const month = p.created_at.substring(0, 7);
        signupsByMonth[month] = (signupsByMonth[month] || 0) + 1;
      }

      const totalActivity = (uLogs || 0) + (uInj || 0) + (uMeals || 0) + (uWorkouts || 0) + (uPhotos || 0);
      const isPremium = premiumUserIds.has(p.id);
      const premiumInfo = premiumSourceMap[p.id] || null;

      const daysSinceSignup = p.created_at ? Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000) : 0;
      const isBot = (
        !p.name &&
        !p.triage_completed &&
        totalActivity === 0 &&
        daysSinceSignup > 2
      );

      if (isBot) {
        botSuspects.push({ id: p.id, email, name: p.name, createdAt: p.created_at, provider });
      }

      userBreakdown.push({
        id: p.id,
        name: p.name || "Sem nome",
        email,
        medication: p.medication,
        dose: p.current_dose,
        triageCompleted: p.triage_completed,
        createdAt: p.created_at,
        isPremium,
        premiumSource: premiumInfo?.source || null,
        premiumPromo: premiumInfo?.promo_code || null,
        provider,
        logs: uLogs || 0,
        injections: uInj || 0,
        meals: uMeals || 0,
        workouts: uWorkouts || 0,
        photos: uPhotos || 0,
        totalActivity,
        isSuspectBot: isBot,
      });
    }

    return new Response(JSON.stringify({
      totalUsers: totalUsers || 0,
      triageCompleted: triageCompleted || 0,
      premiumCount,
      freeCount: (totalUsers || 0) - premiumCount,
      todayActiveUsers: todayActiveIds.size,
      yesterdayActiveUsers: yesterdayActiveIds.size,
      premiumBySource,
      premiumByPromo,
      signupsByProvider,
      signupsByMonth,
      botSuspectsCount: botSuspects.length,
      retention: {
        d1: d1Eligible > 0 ? { pct: Math.round((d1Retained / d1Eligible) * 100), eligible: d1Eligible, retained: d1Retained } : null,
        d7: d7Eligible > 0 ? { pct: Math.round((d7Retained / d7Eligible) * 100), eligible: d7Eligible, retained: d7Retained } : null,
      },
      featureUsage: {
        daily_logs: { total: totalLogs || 0, today: todayLogsCount || 0, uniqueUsers: uniqueLogUsers },
        injections: { total: totalInjections || 0, today: todayInjectionsCount || 0, uniqueUsers: uniqueInjUsers },
        meals: { total: totalMeals || 0, today: todayMealsCount || 0, uniqueUsers: uniqueMealUsers },
        workouts: { total: totalWorkouts || 0, today: todayWorkoutsCount || 0, uniqueUsers: uniqueWorkoutUsers },
        photos: { total: totalPhotos || 0, today: todayPhotosCount || 0, uniqueUsers: uniquePhotoUsers },
        feedback: { total: totalFeedback || 0 },
      },
      credits: creditsData,
      last7Days: last7,
      users: userBreakdown,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const status = err.message === "Forbidden" ? 403 : err.message === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
