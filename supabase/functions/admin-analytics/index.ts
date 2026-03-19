import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No auth header");

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");
    if (user.email !== ADMIN_EMAIL) throw new Error("Forbidden");

    // Use service role for cross-user queries
    const sb = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Total users
    const { count: totalUsers } = await sb.from("profiles").select("id", { count: "exact", head: true });

    // Users with triage completed
    const { count: triageCompleted } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("triage_completed", true);

    // Premium users
    const { count: premiumCount } = await sb.from("premium_access").select("id", { count: "exact", head: true }).eq("status", "active");

    // Today's active users (distinct user_ids with daily_logs today)
    const { data: todayLogs } = await sb.from("daily_logs").select("user_id").eq("date", today);
    const todayActiveIds = new Set((todayLogs || []).map((l: any) => l.user_id));

    // Today's injections
    const { data: todayInjections } = await sb.from("injections").select("user_id").eq("date", today);
    (todayInjections || []).forEach((i: any) => todayActiveIds.add(i.user_id));

    // Today's meals
    const { data: todayMeals } = await sb.from("meal_logs").select("user_id").eq("date", today);
    (todayMeals || []).forEach((m: any) => todayActiveIds.add(m.user_id));

    // Today's workouts
    const { data: todayWorkouts } = await sb.from("workouts").select("user_id").eq("date", today);
    (todayWorkouts || []).forEach((w: any) => todayActiveIds.add(w.user_id));

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

    // Per-user breakdown (profiles with activity counts)
    const { data: allProfiles } = await sb.from("profiles").select("id, name, current_dose, medication, triage_completed, created_at").order("created_at", { ascending: false }).limit(100);

    const userBreakdown = [];
    for (const p of (allProfiles || [])) {
      const { count: uLogs } = await sb.from("daily_logs").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uInj } = await sb.from("injections").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uMeals } = await sb.from("meal_logs").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uWorkouts } = await sb.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { count: uPhotos } = await sb.from("progress_photos").select("id", { count: "exact", head: true }).eq("user_id", p.id);
      const { data: uPremium } = await sb.from("premium_access").select("status, source").eq("user_id", p.id).eq("status", "active").limit(1);

      // Get email from auth
      const { data: { user: authUser } } = await sb.auth.admin.getUserById(p.id);

      userBreakdown.push({
        id: p.id,
        name: p.name || "Sem nome",
        email: authUser?.email || "—",
        medication: p.medication,
        dose: p.current_dose,
        triageCompleted: p.triage_completed,
        createdAt: p.created_at,
        isPremium: (uPremium && uPremium.length > 0),
        premiumSource: uPremium?.[0]?.source || null,
        logs: uLogs || 0,
        injections: uInj || 0,
        meals: uMeals || 0,
        workouts: uWorkouts || 0,
        photos: uPhotos || 0,
      });
    }

    return new Response(JSON.stringify({
      totalUsers: totalUsers || 0,
      triageCompleted: triageCompleted || 0,
      premiumCount: premiumCount || 0,
      freeCount: (totalUsers || 0) - (premiumCount || 0),
      todayActiveUsers: todayActiveIds.size,
      featureUsage: {
        daily_logs: { total: totalLogs || 0, today: todayLogsCount || 0 },
        injections: { total: totalInjections || 0, today: todayInjectionsCount || 0 },
        meals: { total: totalMeals || 0, today: todayMealsCount || 0 },
        workouts: { total: totalWorkouts || 0, today: todayWorkoutsCount || 0 },
        photos: { total: totalPhotos || 0, today: todayPhotosCount || 0 },
        feedback: { total: totalFeedback || 0 },
      },
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
