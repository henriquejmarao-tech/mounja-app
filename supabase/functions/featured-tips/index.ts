import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const { context } = await req.json();

    // Validate context input
    if (context !== "nutrition" && context !== "movement") {
      return new Response(JSON.stringify({ error: "Contexto inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user context from database
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("current_weight, current_dose, weekly_workouts")
      .eq("id", userId)
      .single();

    const { data: recentLogs } = await supabaseClient
      .from("daily_logs")
      .select("symptom_nausea, symptom_fatigue, symptom_headache, symptom_constipation, symptom_diarrhea")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7);

    const { data: lastInjection } = await supabaseClient
      .from("injections")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1);

    const avgSymptom = (field: string) => {
      if (!recentLogs?.length) return 0;
      const vals = recentLogs.map((l: any) => l[field] || 0);
      return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
    };

    let daysSinceInjection: number | string = "desconhecido";
    if (lastInjection?.length) {
      const diff = Math.floor((Date.now() - new Date(lastInjection[0].date + "T12:00:00").getTime()) / 86400000);
      daysSinceInjection = diff;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextLabel = context === "nutrition" ? "Alimentação" : "Movimento / Exercícios";

    const systemPrompt = `Você é um assistente de saúde para pessoas em tratamento com Mounjaro (tirzepatida).
Gere exatamente 3 dicas personalizadas para a categoria "${contextLabel}" com base no contexto do usuário.

REGRAS:
- NÃO prescreva medicamentos nem dê conselhos médicos
- Linguagem cotidiana e acolhedora
- Cada dica deve ser específica ao contexto atual do usuário
- Priorize dicas relevantes aos sintomas mais intensos
- Se pós-aplicação recente (≤2 dias), priorize dicas de conforto

Responda APENAS com JSON válido (sem markdown, sem backticks):
[
  { "id": "string-unico", "emoji": "emoji", "title": "máx 30 chars", "reason": "máx 120 chars explicando por quê" },
  ...
]`;

    const userMessage = `Contexto:
- Categoria: ${contextLabel}
- Dias desde última aplicação: ${daysSinceInjection}
- Sintomas (média 7 dias, escala 0-10): náusea ${avgSymptom("symptom_nausea")}, fadiga ${avgSymptom("symptom_fatigue")}, dor de cabeça ${avgSymptom("symptom_headache")}, constipação ${avgSymptom("symptom_constipation")}, diarreia ${avgSymptom("symptom_diarrhea")}
- Treinos esta semana: ${profile?.weekly_workouts ?? 0}
- Peso atual: ${profile?.current_weight ?? "não informado"} kg
- Dose atual: ${profile?.current_dose ?? "não informada"}

Gere 3 dicas priorizadas e personalizadas.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Invalid AI response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ tips: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("featured-tips error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
