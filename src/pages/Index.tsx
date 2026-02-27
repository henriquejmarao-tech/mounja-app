import { UtensilsCrossed, Dumbbell, Syringe, BookOpen, ChevronRight, Bell, Shield, Star, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickActionCard from "@/components/QuickActionCard";
import WeekProgress from "@/components/WeekProgress";
import SymptomTracker from "@/components/SymptomTracker";
import InsightCard from "@/components/InsightCard";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(170,32%,50%,0.4),_transparent_60%)]" />
        <div className="relative px-5 pt-8 pb-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-primary-foreground/80 font-medium tracking-wide">Olá, Carla 👋</p>
              <h1 className="text-xl font-bold text-primary-foreground mt-0.5">Semana 2 · Dia 4</h1>
            </div>
            <button className="w-10 h-10 rounded-full bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center relative border border-primary-foreground/10">
              <Bell className="w-5 h-5 text-primary-foreground" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-primary" />
            </button>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-foreground/10">
            <Shield className="w-3.5 h-3.5 text-primary-foreground/80" />
            <p className="text-[11px] text-primary-foreground/80 font-medium">
              Suporte educacional · Não substitui acompanhamento médico
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-1 space-y-4">
        {/* Week progress */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <WeekProgress />
        </div>

        {/* Symptom tracker */}
        <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <SymptomTracker />
        </div>

        {/* AI Insight */}
        <div className="animate-fade-in-up" style={{ animationDelay: "160ms" }}>
          <InsightCard
            title="Padrão identificado"
            description="Nos dias de aplicação, você relatou mais náusea. Tente refeições leves e frias nas 24h após a aplicação."
          />
        </div>

        {/* Social proof */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 bg-card rounded-xl p-3.5 shadow-card border border-border/50">
            <div className="flex -space-x-2">
              {["C", "M", "A"].map((letter, i) => (
                <div key={i} className="w-7 h-7 rounded-full gradient-hero flex items-center justify-center text-[10px] font-bold text-primary-foreground ring-2 ring-card">
                  {letter}
                </div>
              ))}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1 mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">2.847 mulheres</span> já usam o MounjaroGuia
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm tracking-tight">Acesso Rápido</h2>
            <div className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[10px] font-semibold">Seu plano</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <QuickActionCard
              icon={UtensilsCrossed}
              title="Nutrição Hoje"
              subtitle="Sugestões para dias de pouco apetite"
              variant="sage"
              onClick={() => navigate("/nutricao")}
            />
            <QuickActionCard
              icon={Dumbbell}
              title="Treino do Dia"
              subtitle="20min · Iniciante · Baixa intensidade"
              variant="coral"
              onClick={() => navigate("/treinos")}
            />
            <QuickActionCard
              icon={Syringe}
              title="Próxima Aplicação"
              subtitle="Sexta-feira, 28 de fevereiro"
              variant="muted"
              onClick={() => navigate("/aplicacao")}
            />
          </div>
        </div>

        {/* Educational tip */}
        <div className="animate-fade-in-up" style={{ animationDelay: "320ms" }}>
          <button
            onClick={() => navigate("/aplicacao")}
            className="flex items-center justify-between w-full bg-card rounded-xl p-4 shadow-card border border-border/50 hover:shadow-elevated transition-shadow duration-300"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Dica do Dia</p>
                <p className="text-xs text-muted-foreground">
                  Como armazenar sua caneta corretamente
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
