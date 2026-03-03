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

    // Fetch user context
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("current_weight, goal, current_dose, age, sex, activity_level, weekly_workouts, weekly_workout_goal, height_cm")
      .eq("id", userId)
      .single();

    const { data: recentLogs } = await supabaseClient
      .from("daily_logs")
      .select("symptom_fatigue, symptom_injection_pain, energy, weight")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(7);

    const { data: lastInjection } = await supabaseClient
      .from("injections")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(1);

    const { data: recentWorkouts } = await supabaseClient
      .from("workouts")
      .select("workout_type, intensity, duration_minutes, date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(5);

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

    const recentTypes = recentWorkouts?.map((w: any) => w.workout_type).join(", ") || "nenhum recente";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um personal trainer virtual para pessoas em tratamento com Mounjaro (tirzepatida).
Gere uma sugestão de treino para UM DIA com linguagem simples, acolhedora e motivadora.

REGRAS:
- NÃO prescreva medicamentos nem dê conselhos médicos
- Adapte a intensidade ao nível de atividade e sintomas do usuário
- Se o usuário está próximo da aplicação (1-2 dias), sugira treinos mais leves
- Se fadiga alta, sugira exercícios de baixa intensidade como caminhada ou alongamento
- Exercícios práticos que podem ser feitos em casa ou na rua
- Priorize preservação de massa muscular (exercícios de força leves)
- FORMATO: liste cada exercício em uma linha separada com "- ". Exemplo:
  "- Caminhada leve 10 min\n- Agachamento 3x12\n- Flexão de parede 3x10"

Responda APENAS com JSON válido (sem markdown, sem backticks):
{
  "warmup": "- exercício 1\\n- exercício 2",
  "main_workout": "- exercício 1\\n- exercício 2\\n- exercício 3",
  "cooldown": "- exercício 1\\n- exercício 2",
  "duration_minutes": duração total estimada em minutos,
  "intensity": "light" | "moderate" | "intense",
  "focus_area": "área foco do treino (ex: 'Corpo inteiro', 'Membros inferiores', 'Core e mobilidade')",
  "tip": "dica curta e motivadora para o treino",
  "context_note": "frase curta explicando por que o treino está assim (ex: 'Dia pós-aplicação, treino mais leve e focado em mobilidade')"
}`;

    const userMessage = `Contexto do usuário:
- Peso atual: ${profile?.current_weight || "não informado"} kg
- Altura: ${profile?.height_cm || "não informada"} cm
- Objetivo: ${profile?.goal || "perder peso"}
- Dose atual: ${profile?.current_dose || "não informada"}
- Dias desde última aplicação: ${daysSinceInjection}
- Fadiga recente (média 0-10): ${avgSymptom("symptom_fatigue")}
- Dor no local da injeção (média 0-10): ${avgSymptom("symptom_injection_pain")}
- Energia recente (média 0-10): ${avgSymptom("energy")}
- Nível de atividade: ${profile?.activity_level || "sedentário"}
- Meta semanal: ${profile?.weekly_workout_goal || profile?.weekly_workouts || 3} treinos
- Treinos recentes: ${recentTypes}
- Sexo: ${profile?.sex || "não informado"}
- Idade: ${profile?.age || "não informada"}

Gere o treino do dia adaptado a esse contexto. Varie os exercícios em relação aos treinos recentes.`;

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
    console.error("workout-suggestion error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
