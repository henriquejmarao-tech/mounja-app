import { useEffect, useState } from "react";
import { ArrowLeft, Droplets, AlertTriangle, Sparkles, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface TipCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  priority: number; // lower = higher priority
  tags: string[];
}

const allTips: TipCard[] = [
  {
    id: "nausea",
    emoji: "🤢",
    title: "Lidando com náusea",
    description: "Prefira refeições frias ou em temperatura ambiente. Coma devagar, em pequenas porções ao longo do dia. Evite alimentos gordurosos ou muito condimentados. Gengibre (chá ou bala) pode ajudar.",
    priority: 1,
    tags: ["nausea"],
  },
  {
    id: "constipation",
    emoji: "😣",
    title: "Lidando com constipação",
    description: "Aumente a ingestão de fibras: frutas com casca, verduras e grãos integrais. Beba bastante água e tente se movimentar — até uma caminhada curta ajuda o intestino.",
    priority: 2,
    tags: ["constipation"],
  },
  {
    id: "hydration",
    emoji: "💧",
    title: "A importância da hidratação",
    description: "Beber pelo menos 2 litros de água por dia ajuda a reduzir efeitos colaterais e melhora a disposição. Use um copo grande como referência e vá completando ao longo do dia.",
    priority: 3,
    tags: ["always"],
  },
  {
    id: "portions",
    emoji: "🍽️",
    title: "Porções menores, mais vezes",
    description: "Em vez de 3 refeições grandes, tente 5-6 refeições pequenas. Isso ajuda na saciedade, reduz desconforto e mantém a energia estável ao longo do dia.",
    priority: 4,
    tags: ["always"],
  },
  {
    id: "protein",
    emoji: "💪",
    title: "Mantenha a proteína",
    description: "Durante a perda de peso, a proteína ajuda a preservar massa muscular. Inclua ovos, frango, peixe, iogurte ou leguminosas em cada refeição principal.",
    priority: 5,
    tags: ["always"],
  },
  {
    id: "fatigue-food",
    emoji: "😴",
    title: "Alimentação para dias cansados",
    description: "Se estiver sem energia, aposte em alimentos de fácil digestão: sopas, vitaminas de frutas, iogurte com granola. Não pule refeições — isso pode piorar a fadiga.",
    priority: 6,
    tags: ["fatigue"],
  },
  {
    id: "headache",
    emoji: "🤕",
    title: "Dor de cabeça frequente?",
    description: "Pode estar ligada à baixa ingestão de água ou comida. Tente manter uma rotina alimentar regular e beba água ao longo do dia. Evite longos períodos em jejum.",
    priority: 7,
    tags: ["headache"],
  },
];

const Nutrition = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [recentSymptoms, setRecentSymptoms] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("daily_logs")
        .select("symptom_nausea, symptom_fatigue, symptom_headache, symptom_constipation, symptom_diarrhea")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);
      const logs = (data as any[]) || [];
      if (logs.length > 0) {
        const avg = (key: string) => logs.reduce((s, l) => s + (l[key] || 0), 0) / logs.length;
        setRecentSymptoms({
          nausea: avg("symptom_nausea"),
          fatigue: avg("symptom_fatigue"),
          headache: avg("symptom_headache"),
          constipation: avg("symptom_constipation"),
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  // Prioritize tips based on user symptoms
  const sortedTips = [...allTips].sort((a, b) => {
    const aRelevant = a.tags.some((t) => t === "always" || (recentSymptoms[t] && recentSymptoms[t] >= 3));
    const bRelevant = b.tags.some((t) => t === "always" || (recentSymptoms[t] && recentSymptoms[t] >= 3));
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    return a.priority - b.priority;
  });

  const hasHighSymptoms = Object.values(recentSymptoms).some((v) => v >= 4);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-xl font-bold text-primary-foreground">Nutrição</h1>
          <p className="text-sm text-primary-foreground/70 mt-1">Dicas práticas para se sentir melhor</p>
        </div>
      </header>

      <div className="px-5 mt-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <>
            {/* Personalized alert */}
            {hasHighSymptoms && (
              <div className="bg-warning/8 rounded-2xl p-4 border border-warning/15 flex items-start gap-3 animate-fade-in-up">
                <Sparkles className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Conteúdo personalizado para você</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Organizamos as dicas com base nos sintomas que você relatou recentemente.
                  </p>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-muted/50 rounded-2xl p-3.5 flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Estas são dicas educativas gerais. Não substituem orientação de nutricionista ou médico.
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              {sortedTips.map((tip, i) => {
                const isHighlighted = tip.tags.some((t) => t !== "always" && recentSymptoms[t] && recentSymptoms[t] >= 3);
                return (
                  <div
                    key={tip.id}
                    className={cn(
                      "rounded-2xl p-4 shadow-card border animate-fade-in-up",
                      isHighlighted
                        ? "bg-primary/5 border-primary/15"
                        : "bg-card border-border/50"
                    )}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {isHighlighted && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primary mb-2 block">
                        Relevante para você
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{tip.emoji}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{tip.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{tip.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Nutrition;
