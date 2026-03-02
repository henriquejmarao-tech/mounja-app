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

    // Fetch user context from database
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("current_weight, goal, current_dose, age, sex, activity_level, dietary_restrictions, weekly_workouts")
      .eq("id", userId)
      .single();

    const { data: recentLogs } = await supabaseClient
      .from("daily_logs")
      .select("symptom_nausea, symptom_fatigue, symptom_constipation, weight")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7);

    const { data: lastInjection } = await supabaseClient
      .from("injections")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1);

    // Calculate context from DB data
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

    const systemPrompt = `Você é um assistente de nutrição para pessoas em tratamento com Mounjaro (tirzepatida).
Gere uma sugestão de dieta para UM DIA com linguagem simples, acolhedora e não clínica.

REGRAS:
- NÃO prescreva medicamentos nem dê conselhos médicos
- Use linguagem cotidiana, como um amigo daria dica
- Porções realistas para brasileiro comum
- Considere os sintomas e contexto do usuário
- Refeições práticas e acessíveis

Responda APENAS com um JSON válido (sem markdown, sem backticks) neste formato:
{
  "breakfast": "descrição do café da manhã",
  "lunch": "descrição do almoço",
  "dinner": "descrição do jantar",
  "snack": "descrição do lanche (opcional)",
  "calories_target": número aproximado de calorias,
  "protein_target": gramas de proteína sugerida,
  "tip": "uma dica curta e prática para o dia",
  "context_note": "frase curta explicando por que a sugestão está assim (ex: 'Dia pós-aplicação, refeições mais leves')"
}`;

    const userMessage = `Contexto do usuário:
- Peso atual: ${profile?.current_weight || "não informado"} kg
- Objetivo: ${profile?.goal || "perder peso"}
- Dose atual: ${profile?.current_dose || "não informada"}
- Dias desde última aplicação: ${daysSinceInjection}
- Sintomas recentes (média 0-10): náusea ${avgSymptom("symptom_nausea")}, fadiga ${avgSymptom("symptom_fatigue")}, constipação ${avgSymptom("symptom_constipation")}
- Treinos esta semana: ${profile?.weekly_workouts ?? 0}
- Nível de atividade: ${profile?.activity_level || "sedentário"}
- Restrições alimentares: ${profile?.dietary_restrictions ? JSON.stringify(profile.dietary_restrictions) : "nenhuma informada"}
- Sexo: ${profile?.sex || "não informado"}
- Idade: ${profile?.age || "não informada"}

Gere a sugestão do dia adaptada a esse contexto.`;

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
        return new Response(JSON.stringify({ error: "Muitas solicitações. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar sugestão." }), {
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
      return new Response(JSON.stringify({ error: "Resposta inválida da IA. Tente novamente." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ suggestion: parsed }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diet-suggestion error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
