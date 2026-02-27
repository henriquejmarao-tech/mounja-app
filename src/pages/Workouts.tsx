import { ArrowLeft, Play, Clock, Zap, ChevronRight, Target } from "lucide-react";
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
    <div className="min-h-screen bg-background pb-28">
      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-coral opacity-95" />
        <div className="relative px-5 pt-6 pb-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-secondary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-secondary-foreground">Treinos</h1>
          <p className="text-sm text-secondary-foreground/80 mt-1">
            Exercícios adaptados à sua disposição
          </p>
        </div>
      </header>

      <div className="px-5 -mt-2">
        <div className="rounded-2xl overflow-hidden shadow-elevated border border-border/50">
          <img src={workoutHero} alt="Treino em casa" className="w-full h-40 object-cover" />
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* Energy check */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <h3 className="font-bold text-sm mb-1 tracking-tight">Como está sua energia hoje?</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Vamos adaptar o treino para você
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {energyLevels.map((level) => (
              <button
                key={level.value}
                className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl bg-muted/60 hover:bg-accent border border-transparent hover:border-primary/15 transition-all duration-300 active:scale-95"
              >
                <span className="text-2xl">{level.emoji}</span>
                <span className="text-xs font-semibold">{level.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly progress */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm tracking-tight">Progresso Semanal</h3>
            </div>
            <span className="text-xs text-primary font-bold bg-primary/8 px-2.5 py-1 rounded-full">3/5 treinos</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div className="gradient-hero h-full rounded-full transition-all duration-700 ease-out" style={{ width: "60%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2.5">
            Faltam apenas 2 treinos para completar sua meta! 🎯
          </p>
        </div>

        {/* Workout list */}
        <div>
          <h3 className="font-bold text-sm mb-3 tracking-tight">Treinos Recomendados</h3>
          <div className="space-y-2.5">
            {workouts.map((workout, i) => (
              <button
                key={i}
                className={cn(
                  "w-full flex items-center gap-4 rounded-2xl p-4 text-left transition-all duration-300 active:scale-[0.98] group border",
                  workout.color === "sage"
                    ? "bg-sage-light/70 border-primary/8 hover:bg-sage-light"
                    : "bg-coral-light/70 border-secondary/8 hover:bg-coral-light"
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
                    workout.color === "sage" ? "bg-primary/12" : "bg-secondary/15"
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
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <Clock className="w-3 h-3" /> {workout.duration}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <Zap className="w-3 h-3" /> {workout.intensity}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ))}
          </div>
        </div>

        {/* Low energy alternative */}
        <div className="bg-accent/60 rounded-2xl p-4 border border-primary/8">
          <h3 className="font-bold text-sm text-accent-foreground mb-1.5">
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
