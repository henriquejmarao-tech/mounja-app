import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { userContext } = await req.json();
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
- Peso atual: ${userContext.weight || "não informado"} kg
- Objetivo: ${userContext.goal || "perder peso"}
- Dose atual: ${userContext.dose || "não informada"}
- Dias desde última aplicação: ${userContext.daysSinceInjection ?? "desconhecido"}
- Sintomas recentes (média 0-10): náusea ${userContext.nausea ?? 0}, fadiga ${userContext.fatigue ?? 0}, constipação ${userContext.constipation ?? 0}
- Treinos esta semana: ${userContext.weeklyWorkouts ?? 0}
- Nível de atividade: ${userContext.activityLevel || "sedentário"}
- Restrições alimentares: ${userContext.dietaryRestrictions || "nenhuma informada"}
- Sexo: ${userContext.sex || "não informado"}
- Idade: ${userContext.age || "não informada"}

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

    // Parse JSON from response, handling possible markdown wrapping
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
