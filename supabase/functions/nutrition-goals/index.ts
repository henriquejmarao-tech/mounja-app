import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
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

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("current_weight, goal, age, sex, height_cm, activity_level, weekly_workouts, current_dose, dietary_restrictions")
      .eq("id", userId)
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um nutricionista especializado em pacientes em tratamento com Mounjaro (tirzepatida).
Com base nos dados do paciente, calcule metas nutricionais diárias personalizadas.

REGRAS:
- Calcule a TMB (Taxa Metabólica Basal) usando a fórmula de Mifflin-St Jeor
- Aplique o fator de atividade física
- Para perda de peso, aplique um déficit calórico moderado (300-500 kcal)
- Proteína: 1.2-1.6g por kg de peso corporal (priorizar alto para preservar massa magra)
- Fibra: 25-35g por dia
- Água: 35ml por kg de peso corporal, convertido em copos de 250ml

Responda APENAS com JSON válido (sem markdown, sem backticks):
{
  "calories": número inteiro de kcal,
  "protein": número em gramas (1 casa decimal),
  "fiber": número em gramas (1 casa decimal),
  "water": número inteiro de copos de 250ml
}`;

    const userMessage = `Dados do paciente:
- Peso atual: ${profile?.current_weight || "não informado"} kg
- Altura: ${profile?.height_cm || "não informada"} cm
- Idade: ${profile?.age || "não informada"}
- Sexo: ${profile?.sex || "não informado"}
- Nível de atividade: ${profile?.activity_level || "sedentário"}
- Treinos por semana: ${profile?.weekly_workouts || 0}
- Objetivo: ${profile?.goal || "perder peso"}
- Dose atual Mounjaro: ${profile?.current_dose || "não informada"}
- Restrições alimentares: ${JSON.stringify(profile?.dietary_restrictions || [])}

Calcule as metas nutricionais personalizadas.`;

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
        return new Response(JSON.stringify({ error: "Muitas requisições, tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Failed to parse AI response");

    const goals = JSON.parse(jsonMatch[0]);

    // Save to profile
    await supabaseClient.from("profiles").update({
      calories_goal: Math.round(goals.calories),
      protein_goal: Math.round(goals.protein * 10) / 10,
      fiber_goal: Math.round(goals.fiber * 10) / 10,
      water_glasses_goal: Math.round(goals.water),
    }).eq("id", userId);

    return new Response(JSON.stringify(goals), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("nutrition-goals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
