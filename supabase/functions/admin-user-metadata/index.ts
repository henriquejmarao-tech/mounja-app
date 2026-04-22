import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const ADMIN_EMAIL = "henriquejmarao@gmail.com";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No auth header" }, 401);

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);
    if (user.email !== ADMIN_EMAIL) return json({ error: "Forbidden" }, 403);

    const sb = createClient(supabaseUrl, serviceRoleKey);

    // ── GET ?user_id=<uuid> → fetch row (or null)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const userId = url.searchParams.get("user_id");
      if (!userId) return json({ error: "user_id required" }, 400);

      const { data, error } = await sb
        .from("founder_user_metadata")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) return json({ error: error.message }, 500);
      return json({ metadata: data ?? null });
    }

    // ── POST → upsert (only provided fields are written)
    if (req.method === "POST") {
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON body" }, 400);
      }

      const userId = body.user_id;
      if (!userId || typeof userId !== "string") {
        return json({ error: "user_id required" }, 400);
      }

      // Check if a row already exists
      const { data: existing } = await sb
        .from("founder_user_metadata")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      // Build patch with only the provided keys
      const patch: Record<string, unknown> = {};
      const allowed = [
        "instagram_handle",
        "whatsapp",
        "notes",
        "talked_at",
        "contacted_by",
      ];
      for (const k of allowed) {
        if (k in body) {
          // Empty string → null (for clearing)
          patch[k] = body[k] === "" ? null : body[k];
        }
      }

      let row;
      if (existing) {
        const { data, error } = await sb
          .from("founder_user_metadata")
          .update(patch)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        row = data;
      } else {
        const { data, error } = await sb
          .from("founder_user_metadata")
          .insert({ user_id: userId, ...patch })
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        row = data;
      }

      return json({ metadata: row });
    }

    return json({ error: `Method ${req.method} not allowed` }, 405);
  } catch (e) {
    console.error("[admin-user-metadata] error:", e);
    return json({ error: (e as Error).message || "Internal error" }, 500);
  }
});
