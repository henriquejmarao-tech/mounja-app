import { ArrowLeft, Play, Clock, Zap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import workoutHero from "@/assets/workout-hero.png";

const workouts = [
  {
    title: "Alongamento Matinal",
    duration: "10 min",
    intensity: "Leve",
    description: "Ideal para começar o dia com energia",
    color: "sage" as const,
  },
  {
    title: "Caminhada Guiada",
    duration: "20 min",
    intensity: "Moderada",
    description: "No seu ritmo, com orientações de postura",
    color: "coral" as const,
  },
  {
    title: "Fortalecimento Básico",
    duration: "15 min",
    intensity: "Leve",
    description: "Exercícios simples sem equipamento",
    color: "sage" as const,
  },
];

const energyLevels = [
  { emoji: "⚡", label: "Disposto", value: 3 },
  { emoji: "😊", label: "Normal", value: 2 },
  { emoji: "😴", label: "Cansado", value: 1 },
];

const Workouts = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-2xl font-bold">Treinos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Exercícios adaptados à sua disposição
        </p>
      </header>

      <div className="px-5 mt-4">
        <div className="rounded-xl overflow-hidden bg-coral-light">
          <img src={workoutHero} alt="Treino em casa" className="w-full h-40 object-cover" />
        </div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        {/* Energy check */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-semibold text-sm mb-1">Como está sua energia hoje?</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Vamos adaptar o treino para você
          </p>
          <div className="grid grid-cols-3 gap-2">
            {energyLevels.map((level) => (
              <button
                key={level.value}
                className="flex flex-col items-center gap-1 py-3 rounded-xl bg-muted hover:bg-accent transition-colors active:scale-95"
              >
                <span className="text-2xl">{level.emoji}</span>
                <span className="text-xs font-medium">{level.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly progress */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Progresso Semanal</h3>
            <span className="text-xs text-primary font-semibold">3/5 treinos</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="gradient-hero h-2.5 rounded-full transition-all duration-500" style={{ width: "60%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Faltam apenas 2 treinos para completar sua meta!
          </p>
        </div>

        {/* Workout list */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Treinos Recomendados</h3>
          <div className="space-y-3">
            {workouts.map((workout, i) => (
              <button
                key={i}
                className={cn(
                  "w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all active:scale-[0.98]",
                  workout.color === "sage" ? "bg-sage-light" : "bg-coral-light"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    workout.color === "sage" ? "bg-primary/15" : "bg-secondary/20"
                  )}
                >
                  <Play
                    className={cn(
                      "w-5 h-5",
                      workout.color === "sage" ? "text-primary" : "text-secondary"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{workout.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {workout.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" /> {workout.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Zap className="w-3 h-3" /> {workout.intensity}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Low energy alternative */}
        <div className="bg-accent rounded-xl p-4">
          <h3 className="font-semibold text-sm text-accent-foreground mb-1">
            💡 Dia de baixa energia?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tudo bem! Nos dias difíceis, uma caminhada leve de 10 minutos já faz diferença. 
            O importante é manter o hábito.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Workouts;
