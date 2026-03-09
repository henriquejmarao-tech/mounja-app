import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    // Fetch all user context in parallel
    const [profileRes, logsRes, injectionsRes, workoutsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("daily_logs").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
      supabase.from("injections").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(20),
      supabase.from("workouts").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(14),
    ]);

    const profile = profileRes.data;
    const logs = logsRes.data || [];
    const injections = injectionsRes.data || [];
    const workouts = workoutsRes.data || [];

    // Build weight timeline
    const weightEntries = logs.filter((l: any) => l.weight).map((l: any) => `${l.date}: ${l.weight}kg`).slice(0, 15);

    // Build symptom summary (last 14 days)
    const recentLogs = logs.slice(0, 14);
    const symptomKeys = ["symptom_nausea", "symptom_fatigue", "symptom_headache", "symptom_diarrhea", "symptom_constipation", "symptom_injection_pain"];
    const symptomAvg: Record<string, number> = {};
    for (const key of symptomKeys) {
      const vals = recentLogs.map((l: any) => l[key]).filter((v: any) => v != null && v > 0);
      symptomAvg[key.replace("symptom_", "")] = vals.length > 0 ? +(vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : 0;
    }

    // Injection timeline
    const injectionTimeline = injections.slice(0, 10).map((inj: any) => `${inj.date}: ${inj.dose}${inj.site ? ` (${inj.site})` : ""}`);

    // Mood / energy / appetite
    const moodAvg = recentLogs.filter((l: any) => l.mood).map((l: any) => l.mood);
    const energyAvg = recentLogs.filter((l: any) => l.energy).map((l: any) => l.energy);
    const appetiteAvg = recentLogs.filter((l: any) => l.appetite).map((l: any) => l.appetite);

    const avg = (arr: number[]) => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;

    const systemPrompt = `Você é um assistente clínico especializado em pacientes que usam Mounjaro® (tirzepatida) para controle de peso.
Analise cuidadosamente os dados do paciente e forneça uma análise completa do tratamento.

REGRAS IMPORTANTES:
- Você NÃO é médico. Sempre reforce que as sugestões devem ser discutidas com o médico prescritor.
- Seja empático, direto e use linguagem acessível em português brasileiro.
- Baseie-se nos dados concretos fornecidos (tendência de peso, sintomas, padrões).
- Identifique correlações entre sintomas e doses/datas.
- Seja específico nos números e datas quando possível.

Responda APENAS usando a tool fornecida.`;

    const userMessage = `DADOS DO PACIENTE:

Perfil:
- Nome: ${profile?.name || "não informado"}
- Idade: ${profile?.age || "não informada"}
- Altura: ${profile?.height_cm ? profile.height_cm + "cm" : "não informada"}
- Peso inicial (no app): ${profile?.current_weight ? profile.current_weight + "kg" : "não informado"}
- Meta de peso: ${profile?.weight_goal ? profile.weight_goal + "kg" : "não definida"}
- Medicamento: ${profile?.medication || "Mounjaro"}
- Dose atual configurada: ${profile?.current_dose || "não informada"}
- Data de início: ${profile?.mounjaro_start_date || "não informada"}
- Condições de saúde: ${JSON.stringify(profile?.health_conditions || [])}
- Efeitos colaterais frequentes: ${JSON.stringify(profile?.common_side_effects || [])}
- Nível de atividade: ${profile?.activity_level || "não informado"}
- Treinos semanais meta: ${profile?.weekly_workout_goal || "não definido"}

Histórico de aplicações (últimas 10):
${injectionTimeline.length > 0 ? injectionTimeline.join("\n") : "Nenhuma aplicação registrada"}

Evolução de peso (últimos 15 registros):
${weightEntries.length > 0 ? weightEntries.join("\n") : "Sem registros de peso"}

Sintomas médios (últimos 14 dias, escala 0-5):
- Náusea: ${symptomAvg.nausea}
- Fadiga: ${symptomAvg.fatigue}
- Dor de cabeça: ${symptomAvg.headache}
- Diarreia: ${symptomAvg.diarrhea}
- Constipação: ${symptomAvg.constipation}
- Dor no local: ${symptomAvg.injection_pain}

Indicadores recentes (14 dias):
- Humor médio: ${avg(moodAvg) ?? "sem dados"}/5
- Energia média: ${avg(energyAvg) ?? "sem dados"}/5
- Apetite médio: ${avg(appetiteAvg) ?? "sem dados"}/5

Treinos recentes (últimos 14 dias): ${workouts.length} registrados
${workouts.slice(0, 5).map((w: any) => `- ${w.date}: ${w.workout_type} ${w.duration_minutes}min (${w.intensity})`).join("\n") || "Nenhum treino"}`;

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
              name: "medication_analysis",
              description: "Retorna uma análise completa do tratamento com Mounjaro.",
              parameters: {
                type: "object",
                properties: {
                  overall_status: {
                    type: "string",
                    enum: ["excelente", "bom", "atenção", "alerta"],
                    description: "Status geral do tratamento",
                  },
                  overall_summary: {
                    type: "string",
                    description: "Resumo geral do tratamento em 2-3 frases",
                  },
                  weight_analysis: {
                    type: "object",
                    properties: {
                      trend: { type: "string", enum: ["descendo", "estável", "subindo", "insuficiente"] },
                      summary: { type: "string", description: "Análise da evolução de peso em 1-2 frases" },
                      lost_kg: { type: "number", description: "Kg perdidos no período analisado" },
                      weekly_avg_loss: { type: "number", description: "Média de perda semanal em kg" },
                    },
                    required: ["trend", "summary"],
                    additionalProperties: false,
                  },
                  symptom_analysis: {
                    type: "object",
                    properties: {
                      severity: { type: "string", enum: ["leve", "moderado", "intenso", "sem_dados"] },
                      summary: { type: "string", description: "Análise dos sintomas em 1-2 frases" },
                      main_concern: { type: "string", description: "Principal preocupação sintomática, se houver" },
                    },
                    required: ["severity", "summary"],
                    additionalProperties: false,
                  },
                  dose_recommendation: {
                    type: "object",
                    properties: {
                      action: { type: "string", enum: ["manter", "considerar_aumento", "considerar_redução", "avaliar_com_médico"] },
                      reasoning: { type: "string", description: "Justificativa para a recomendação em 2-3 frases" },
                    },
                    required: ["action", "reasoning"],
                    additionalProperties: false,
                  },
                  behavioral_suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        emoji: { type: "string" },
                        title: { type: "string", description: "Título curto (3-6 palavras)" },
                        description: { type: "string", description: "Sugestão detalhada (2-3 frases)" },
                        category: { type: "string", enum: ["alimentação", "exercício", "hidratação", "sono", "medicação", "geral"] },
                      },
                      required: ["emoji", "title", "description", "category"],
                      additionalProperties: false,
                    },
                    description: "3-5 sugestões comportamentais personalizadas",
                  },
                  medical_note: {
                    type: "string",
                    description: "Nota importante para discutir com o médico, se houver. Sempre reforce que é necessário consultar o médico.",
                  },
                },
                required: ["overall_status", "overall_summary", "weight_analysis", "symptom_analysis", "dose_recommendation", "behavioral_suggestions", "medical_note"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "medication_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
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

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("medication-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
