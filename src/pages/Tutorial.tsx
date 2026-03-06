import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  ClipboardCheck, TrendingUp, Utensils, Dumbbell, Pill, 
  MessageCircle, ChevronRight, ChevronLeft, Sparkles, Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const slides = [
  {
    icon: Sparkles,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.08)",
    title: "Bem-vindo ao Mounjá! 🌿",
    subtitle: "Seu companheiro inteligente de tratamento",
    description: "O Mounjá acompanha seu tratamento com Mounjaro de forma personalizada — peso, sintomas, alimentação e treinos. Tudo num só lugar, com calma e no seu ritmo.",
    tip: "Para quem: qualquer pessoa usando Mounjaro que quer acompanhar sua evolução de forma prática.",
  },
  {
    icon: ClipboardCheck,
    color: "hsl(var(--secondary))",
    bg: "hsl(var(--secondary) / 0.08)",
    title: "Registro diário",
    subtitle: "Leva menos de 1 minuto",
    description: "Registre peso, sintomas, humor, água e qualidade da alimentação. Quanto mais você registra, mais inteligente ficam as sugestões.",
    tip: "Como usar: toque no botão de registro na barra inferior ou no card da página inicial.",
  },
  {
    icon: Pill,
    color: "hsl(25 80% 52%)",
    bg: "hsl(25 80% 52% / 0.08)",
    title: "Controle de aplicações",
    subtitle: "Nunca mais esqueça sua dose",
    description: "Registre cada aplicação com dose, local e data. O app calcula automaticamente quando é a próxima e sugere rodízio dos locais.",
    tip: "Como usar: vá em 'Suas Aplicações' na página inicial ou registre direto pelo botão de registro.",
  },
  {
    icon: TrendingUp,
    color: "hsl(174 42% 48%)",
    bg: "hsl(174 42% 48% / 0.08)",
    title: "Histórico e evolução",
    subtitle: "Veja sua jornada de forma visual",
    description: "Gráficos de peso, sintomas e treinos ao longo do tempo. Filtre por 7, 30 ou 90 dias. Exporte um PDF completo para levar ao médico.",
    tip: "Como usar: toque no ícone de gráfico na barra inferior.",
  },
  {
    icon: Utensils,
    color: "hsl(174 42% 48%)",
    bg: "hsl(174 42% 48% / 0.08)",
    title: "Nutrição com IA",
    subtitle: "Cardápio adaptado ao seu momento",
    description: "Gere sugestões de refeições personalizadas baseadas nos seus sintomas, restrições alimentares e fase do tratamento.",
    tip: "Como usar: acesse a seção 'Está com fome?' na página inicial ou vá em Nutrição.",
  },
  {
    icon: Dumbbell,
    color: "hsl(25 80% 52%)",
    bg: "hsl(25 80% 52% / 0.08)",
    title: "Treinos no seu ritmo",
    subtitle: "Intensidade adaptada ao tratamento",
    description: "O Mounjá considera seus sintomas e dias pós-aplicação para sugerir treinos na intensidade ideal. Defina sua meta semanal.",
    tip: "Como usar: veja o treino recomendado na página inicial ou acesse a seção de Treinos.",
  },
  {
    icon: MessageCircle,
    color: "hsl(var(--primary))",
    bg: "hsl(var(--primary) / 0.08)",
    title: "Comunidade",
    subtitle: "Você não está sozinho(a)",
    description: "Participe de grupos, faça perguntas anônimas e troque experiências com outras pessoas no mesmo caminho.",
    tip: "Como usar: acesse pelo menu inferior. Crie grupos privados e compartilhe o código com quem quiser.",
  },
];

const Tutorial = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);

  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const progress = ((current + 1) / slides.length) * 100;

  const completeTutorial = async () => {
    if (user) {
      await supabase.from("profiles").update({ 
        tutorial_version_completed: "v2" 
      } as any).eq("id", user.id);
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-5 pt-safe">
        <div className="mt-4 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: slide.color }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-right mt-1.5 font-medium">
          {current + 1} de {slides.length}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-8">
        <div className="animate-fade-in-up" key={current}>
          {/* Icon */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: slide.bg }}
          >
            <slide.icon className="w-8 h-8" style={{ color: slide.color }} />
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-center mb-1">{slide.title}</h1>
          <p className="text-sm text-muted-foreground text-center mb-5">{slide.subtitle}</p>

          {/* Description card */}
          <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 mb-4">
            <p className="text-sm text-foreground/80 leading-relaxed">{slide.description}</p>
          </div>

          {/* Tip */}
          <div className="rounded-xl px-4 py-3" style={{ background: slide.bg }}>
            <p className="text-xs leading-relaxed" style={{ color: slide.color }}>
              💡 {slide.tip}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-8 flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent(c => c - 1)}
          disabled={current === 0}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground disabled:opacity-0 transition-opacity px-3 py-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </button>

        <button
          onClick={isLast ? completeTutorial : () => setCurrent(c => c + 1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-primary-foreground shadow-sm active:scale-[0.97] transition-transform"
          style={{ background: slide.color }}
        >
          {isLast ? (
            <>
              <Check className="w-4 h-4" />
              Começar a usar
            </>
          ) : (
            <>
              Próximo
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Skip */}
      {!isLast && (
        <div className="px-5 pb-6 text-center">
          <button 
            onClick={completeTutorial}
            className="text-xs text-muted-foreground font-medium"
          >
            Pular tutorial
          </button>
        </div>
      )}
    </div>
  );
};

export default Tutorial;
