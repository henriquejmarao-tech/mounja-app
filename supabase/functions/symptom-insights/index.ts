import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { symptoms, daysSinceInjection, currentDose } = await req.json();

    const systemPrompt = `Você é um assistente de saúde especializado em pacientes que usam Mounjaro (tirzepatida) para perda de peso.
O usuário registrou seus sintomas recentes. Com base neles, forneça 3 recomendações curtas e práticas.

Regras:
- Cada recomendação deve ter no máximo 2 frases
- Foque no manejo dos sintomas relatados
- Considere a fase do tratamento (dose atual, dias desde aplicação)
- Seja empático e direto
- NÃO dê diagnósticos médicos
- Responda em português brasileiro

Responda APENAS usando a tool fornecida.`;

    const userMessage = `Sintomas recentes (média dos últimos 7 dias, escala 0-5):
- Náusea: ${symptoms.nausea.toFixed(1)}
- Fadiga: ${symptoms.fatigue.toFixed(1)}
- Dor de cabeça: ${symptoms.headache.toFixed(1)}
- Constipação: ${symptoms.constipation.toFixed(1)}
- Diarreia: ${symptoms.diarrhea.toFixed(1)}

Dose atual: ${currentDose || "não informada"}
Dias desde última aplicação: ${daysSinceInjection !== null ? daysSinceInjection : "não informado"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "symptom_recommendations",
              description: "Retorna 3 recomendações baseadas nos sintomas do paciente.",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emoji: { type: "string", description: "Um emoji que representa a recomendação" },
                        title: { type: "string", description: "Título curto da recomendação (3-6 palavras)" },
                        text: { type: "string", description: "Texto da recomendação (1-2 frases)" },
                      },
                      required: ["emoji", "title", "text"],
                      additionalProperties: false,
                    },
                  },
                  summary: {
                    type: "string",
                    description: "Uma frase resumindo o estado geral do paciente baseado nos sintomas (ex: 'Sintomas leves — bom momento para manter a rotina')",
                  },
                },
                required: ["recommendations", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "symptom_recommendations" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("symptom-insights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
