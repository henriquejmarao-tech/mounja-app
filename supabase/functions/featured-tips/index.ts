import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userContext, context } = await req.json();
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
- Dias desde última aplicação: ${userContext.daysSinceInjection ?? "desconhecido"}
- Sintomas (média 7 dias, escala 0-10): náusea ${userContext.nausea ?? 0}, fadiga ${userContext.fatigue ?? 0}, dor de cabeça ${userContext.headache ?? 0}, constipação ${userContext.constipation ?? 0}, diarreia ${userContext.diarrhea ?? 0}
- Treinos esta semana: ${userContext.weeklyWorkoutCount ?? 0}
- Peso atual: ${userContext.weight ?? "não informado"} kg
- Dose atual: ${userContext.currentDose ?? "não informada"}

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
