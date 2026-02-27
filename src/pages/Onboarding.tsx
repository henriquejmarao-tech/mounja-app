import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowRight, Shield, Heart, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-onboarding.png";

const steps = [
  {
    title: "Bem-vinda ao\nMounjaroGuia",
    subtitle: "Seu companheiro digital para as primeiras semanas com Mounjaro. Apoio, educação e acompanhamento — sem substituir seu médico.",
    image: true,
  },
  {
    title: "Nutrição, treinos\ne aplicação",
    subtitle: "Tudo pensado para iniciantes: sugestões simples, dicas práticas e lembretes inteligentes para você não esquecer de nada.",
    icon: Heart,
  },
  {
    title: "IA que aprende\ncom você",
    subtitle: "Registre sintomas e hábitos. Nossa IA identifica padrões e sugere conteúdos personalizados para sua jornada.",
    icon: Sparkles,
  },
  {
    title: "Seguro e\neducativo",
    subtitle: "Não prescrevemos medicamentos. Oferecemos informação de qualidade baseada em evidências científicas atualizadas.",
    icon: Shield,
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      navigate("/");
    }
  };

  const current = steps[step];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip */}
      <header className="px-5 pt-6 flex justify-end">
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground font-medium hover:text-foreground transition-colors"
        >
          Pular
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        {current.image ? (
          <img
            src={heroImage}
            alt="MounjaroGuia"
            className="w-56 h-auto mb-8 animate-scale-in"
          />
        ) : current.icon ? (
          <div className="w-24 h-24 rounded-3xl gradient-hero flex items-center justify-center mb-8 animate-scale-in shadow-glow">
            <current.icon className="w-12 h-12 text-primary-foreground" />
          </div>
        ) : null}

        <h1 className="text-3xl font-bold leading-tight whitespace-pre-line animate-fade-in-up tracking-tight">
          {current.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-xs animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          {current.subtitle}
        </p>
      </div>

      {/* Bottom */}
      <div className="px-8 pb-10">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                i === step ? "w-8 gradient-hero" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300"
        >
          {step === steps.length - 1 ? "Começar" : "Continuar"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
