import { UtensilsCrossed, Dumbbell, Syringe, BookOpen, ChevronRight, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickActionCard from "@/components/QuickActionCard";
import WeekProgress from "@/components/WeekProgress";
import SymptomTracker from "@/components/SymptomTracker";
import InsightCard from "@/components/InsightCard";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Olá, Carla 👋</p>
            <h1 className="text-xl font-bold text-foreground">Semana 2 · Dia 4</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary" />
          </button>
        </div>
      </header>

      <div className="px-5 space-y-4">
        {/* Week progress */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <WeekProgress />
        </div>

        {/* Symptom tracker */}
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <SymptomTracker />
        </div>

        {/* AI Insight */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <InsightCard
            title="Padrão identificado"
            description="Nos dias de aplicação, você relatou mais náusea. Tente refeições leves e frias nas 24h após a aplicação."
          />
        </div>

        {/* Quick Actions */}
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-sm">Acesso Rápido</h2>
          </div>
          <div className="space-y-2">
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
        <div className="animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <button
            onClick={() => navigate("/aplicacao")}
            className="flex items-center justify-between w-full bg-card rounded-xl p-4 shadow-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
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
