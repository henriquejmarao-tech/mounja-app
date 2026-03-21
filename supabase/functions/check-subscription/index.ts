import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("Not authenticated");

    const user = userData.user;
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check Stripe subscription
    let stripeSubscribed = false;
    let stripePlan: string | null = null;
    let subscriptionEnd: string | null = null;

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      const customerId = customers.data[0].id;
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0];
        stripeSubscribed = true;
        subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

        const priceId = sub.items.data[0]?.price?.id;
        if (priceId === "price_1TCJxwRygE2rQ2C09WlQksUO") {
          stripePlan = "trimestral";
        } else if (priceId === "price_1TCJySRygE2rQ2C0jA6egwuj") {
          stripePlan = "mensal";
        } else {
          stripePlan = "premium";
        }
      }
    }

    // Check promo access
    const { data: promoAccess } = await supabaseClient
      .from("premium_access")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    const hasPromo =
      promoAccess &&
      promoAccess.length > 0 &&
      (!promoAccess[0].expires_at || new Date(promoAccess[0].expires_at) > new Date());

    return new Response(
      JSON.stringify({
        isPremium: stripeSubscribed || hasPromo,
        source: stripeSubscribed ? "stripe" : hasPromo ? "promo" : null,
        plan: stripePlan || (hasPromo ? "promo" : "free"),
        status: stripeSubscribed ? "active" : hasPromo ? "active" : "free",
        subscription_end: subscriptionEnd,
        promo_code: hasPromo ? promoAccess![0].promo_code : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
