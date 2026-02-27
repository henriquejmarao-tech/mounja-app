import { ArrowLeft, Plus, Sparkles, Flame, Droplets, Wheat, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import nutritionHero from "@/assets/nutrition-hero.png";

const mealSuggestions = [
  {
    time: "Café da manhã",
    meal: "Iogurte natural com banana e aveia",
    calories: "280 kcal",
    tag: "Leve",
  },
  {
    time: "Almoço",
    meal: "Arroz, feijão, frango grelhado e salada",
    calories: "450 kcal",
    tag: "Completo",
  },
  {
    time: "Lanche",
    meal: "Frutas picadas com castanhas",
    calories: "180 kcal",
    tag: "Prático",
  },
  {
    time: "Jantar",
    meal: "Sopa de legumes com frango desfiado",
    calories: "320 kcal",
    tag: "Reconfortante",
  },
];

const tips = [
  "Coma devagar e em pequenas porções",
  "Prefira alimentos frios se tiver náusea",
  "Hidrate-se bem ao longo do dia",
  "Priorize proteínas em cada refeição",
];

const Nutrition = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-5">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-primary-foreground">Nutrição</h1>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Dicas e sugestões para sua semana 2
          </p>
        </div>
      </header>

      {/* Hero image */}
      <div className="px-5 -mt-2">
        <div className="rounded-2xl overflow-hidden shadow-elevated border border-border/50">
          <img src={nutritionHero} alt="Alimentação saudável" className="w-full h-40 object-cover" />
        </div>
      </div>

      <div className="px-5 mt-5 space-y-4">
        {/* AI Suggestion */}
        <div className="relative overflow-hidden rounded-2xl p-4 bg-card border border-primary/15 shadow-card animate-fade-in-up">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-hero" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Sugestão Personalizada
              </span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Baseado no seu relato de náusea ontem, sugerimos refeições mais leves e frias hoje. Evite alimentos gordurosos.
            </p>
          </div>
        </div>

        {/* Macro summary */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
          <h3 className="font-bold text-sm mb-4 tracking-tight">Resumo do Dia</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Flame, value: "1.230", label: "Calorias", color: "text-secondary", bg: "bg-secondary/10" },
              { icon: Droplets, value: "1.5L", label: "Água", color: "text-info", bg: "bg-info/10" },
              { icon: Wheat, value: "85g", label: "Proteína", color: "text-warning", bg: "bg-warning/10" },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className={`w-11 h-11 mx-auto rounded-xl ${item.bg} flex items-center justify-center mb-2`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Meal suggestions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm tracking-tight">Sugestões de Refeição</h3>
            <button className="text-xs text-primary font-semibold">Ver todas</button>
          </div>
          <div className="space-y-2.5">
            {mealSuggestions.map((meal, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-card rounded-2xl p-4 shadow-card border border-border/50 hover:shadow-elevated transition-shadow duration-300 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    {meal.time}
                  </p>
                  <p className="text-sm font-semibold mt-1 truncate">{meal.meal}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meal.calories}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sage-light text-primary">
                    {meal.tag}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div>
          <h3 className="font-bold text-sm mb-3 tracking-tight">Dicas para Iniciantes</h3>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-center gap-3 bg-card rounded-xl p-3.5 border border-border/50">
                <div className="w-6 h-6 rounded-full gradient-hero flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                </div>
                <p className="text-sm text-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Register button */}
        <button className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300">
          <Plus className="w-5 h-5" />
          Registrar Refeição
        </button>
      </div>
    </div>
  );
};

export default Nutrition;
