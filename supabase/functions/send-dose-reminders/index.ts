import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VAPID_SUBJECT = "mailto:contato@mounjaapp.com.br";
const ICON_PATH = "/pwa-192x192.png";
const VAPID_PUBLIC_KEY = "BHjhzSzRegdxVpuoRyQgdiVV-3Qgitl_H038L9BF35idYrydlmVF54ha1cfV3SMm6x3vUVqFPI_Oib6HlHG_WYQ";
const CRON_SHARED_SECRET = "a0d3c8cf-3eb0-4e4e-b590-90e1f8a8f1d4";

type Candidate = {
  user_id: string;
  dose: string | null;
  medication: string | null;
  scheduled_dose_at: string;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const normalizeDoseMg = (dose: string | null) => {
  if (!dose) return "";
  return dose.replace(/\s*mg\s*$/i, "").trim();
};

const assertServiceRoleCall = (req: Request, serviceRoleKey: string) => {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const cronSecret = Deno.env.get("DOSE_REMINDERS_CRON_SECRET") ?? "";
  const cronHeader = req.headers.get("x-cron-secret") ?? "";
  return Boolean((serviceRoleKey && token && token === serviceRoleKey) || cronHeader === (cronSecret || CRON_SHARED_SECRET));
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const vapidPublicKey = Deno.env.get("VITE_VAPID_PUBLIC_KEY") ?? Deno.env.get("VAPID_PUBLIC_KEY") ?? VAPID_PUBLIC_KEY;

    if (!assertServiceRoleCall(req, serviceRoleKey)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!supabaseUrl || !serviceRoleKey) throw new Error("Backend credentials are not configured");
    if (!vapidPrivateKey || !vapidPublicKey) throw new Error("VAPID keys are not configured");

    webpush.setVapidDetails(VAPID_SUBJECT, vapidPublicKey, vapidPrivateKey);

    const sb = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const now = new Date();
    const windowStart = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
    const windowEnd = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

    const { data: autoAdvanced, error: autoAdvanceError } = await sb.rpc("advance_missed_dose_schedules");
    if (autoAdvanceError) throw autoAdvanceError;

    const { data: candidates, error } = await sb
      .from("scheduled_dose_reminder_candidates")
      .select("user_id, dose, medication, scheduled_dose_at")
      .gte("scheduled_dose_at", windowStart)
      .lte("scheduled_dose_at", windowEnd)
      .returns<Candidate[]>();

    if (error) throw error;

    const userIds = [...new Set((candidates ?? []).map((candidate) => candidate.user_id))];
    const { data: subscriptions, error: subscriptionsError } = userIds.length
      ? await sb
          .from("push_subscriptions")
          .select("id, user_id, endpoint, p256dh, auth")
          .in("user_id", userIds)
          .eq("active", true)
          .returns<PushSubscriptionRow[]>()
      : { data: [] as PushSubscriptionRow[], error: null };

    if (subscriptionsError) throw subscriptionsError;

    const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();
    for (const subscription of subscriptions ?? []) {
      const rows = subscriptionsByUser.get(subscription.user_id) ?? [];
      rows.push(subscription);
      subscriptionsByUser.set(subscription.user_id, rows);
    }

    let sent = 0;
    let failures = 0;
    let expired = 0;
    let skippedAlreadySent = 0;

    for (const candidate of candidates ?? []) {
      const { data: existingReminder, error: existingError } = await sb
        .from("dose_reminders_sent")
        .select("id")
        .eq("user_id", candidate.user_id)
        .eq("scheduled_dose_at", candidate.scheduled_dose_at)
        .maybeSingle();

      if (existingError) {
        failures += 1;
        console.error("[send-dose-reminders] reminder lookup failed", existingError);
        continue;
      }

      if (existingReminder) {
        skippedAlreadySent += subscriptionsByUser.get(candidate.user_id)?.length || 1;
        continue;
      }

      const medication = candidate.medication || "Mounjaro";
      const doseMg = normalizeDoseMg(candidate.dose);
      const body = doseMg
        ? `Em ~1h: ${medication} ${doseMg}mg. Tá com a caneta por perto?`
        : `Em ~1h: ${medication}. Tá com a caneta por perto?`;

      const payload = JSON.stringify({
        title: "Hora da próxima aplicação 💉",
        body,
        icon: ICON_PATH,
        badge: ICON_PATH,
        tag: "dose-reminder",
        data: {
          url: "/",
          tag: "dose-reminder",
          scheduled_dose_at: candidate.scheduled_dose_at,
        },
      });

      let deliveredForDose = false;
      for (const subscription of subscriptionsByUser.get(candidate.user_id) ?? []) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload
          );
          sent += 1;
          deliveredForDose = true;
        } catch (sendError) {
          const statusCode = (sendError as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            expired += 1;
            await sb.from("push_subscriptions").update({ active: false }).eq("id", subscription.id);
          } else {
            failures += 1;
            console.error("[send-dose-reminders] push send failed", { statusCode, subscriptionId: subscription.id, sendError });
          }
        }
      }

      if (deliveredForDose) {
        const { error: insertError } = await sb.from("dose_reminders_sent").insert({
          user_id: candidate.user_id,
          scheduled_dose_at: candidate.scheduled_dose_at,
        });

        if (insertError && insertError.code !== "23505") {
          failures += 1;
          console.error("[send-dose-reminders] sent marker insert failed", insertError);
        }
      }
    }

    const result = {
      ok: true,
      window_start: windowStart,
      window_end: windowEnd,
      auto_advanced: autoAdvanced ?? 0,
      candidates: candidates?.length ?? 0,
      sent,
      failures,
      expired,
      skippedAlreadySent,
    };

    console.log("[send-dose-reminders] summary", result);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[send-dose-reminders] fatal", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
