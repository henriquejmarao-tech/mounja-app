import { ArrowLeft, Plus, Sparkles, Flame, Droplets, Wheat } from "lucide-react";
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-2xl font-bold">Nutrição</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dicas e sugestões para sua semana 2
        </p>
      </header>

      {/* Hero image */}
      <div className="px-5 mt-4">
        <div className="rounded-xl overflow-hidden bg-sage-light">
          <img src={nutritionHero} alt="Alimentação saudável" className="w-full h-40 object-cover" />
        </div>
      </div>

      <div className="px-5 mt-6 space-y-5">
        {/* AI Suggestion */}
        <div className="gradient-hero rounded-xl p-4 text-primary-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
              Sugestão Personalizada
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            Baseado no seu relato de náusea ontem, sugerimos refeições mais leves e frias hoje. Evite alimentos gordurosos.
          </p>
        </div>

        {/* Macro summary */}
        <div className="bg-card rounded-xl p-4 shadow-card">
          <h3 className="font-semibold text-sm mb-3">Resumo do Dia</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-secondary/15 flex items-center justify-center mb-1">
                <Flame className="w-5 h-5 text-secondary" />
              </div>
              <p className="text-lg font-bold">1.230</p>
              <p className="text-[10px] text-muted-foreground">Calorias</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-info/15 flex items-center justify-center mb-1">
                <Droplets className="w-5 h-5 text-info" />
              </div>
              <p className="text-lg font-bold">1.5L</p>
              <p className="text-[10px] text-muted-foreground">Água</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-warning/15 flex items-center justify-center mb-1">
                <Wheat className="w-5 h-5 text-warning" />
              </div>
              <p className="text-lg font-bold">85g</p>
              <p className="text-[10px] text-muted-foreground">Proteína</p>
            </div>
          </div>
        </div>

        {/* Meal suggestions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Sugestões de Refeição</h3>
            <button className="text-xs text-primary font-semibold">Ver todas</button>
          </div>
          <div className="space-y-2">
            {mealSuggestions.map((meal, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-card rounded-xl p-3 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                    {meal.time}
                  </p>
                  <p className="text-sm font-medium mt-0.5 truncate">{meal.meal}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{meal.calories}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-sage-light text-primary shrink-0 ml-2">
                  {meal.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tips */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Dicas para Iniciantes</h3>
          <div className="space-y-2">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <span className="text-primary font-bold text-sm mt-0.5">•</span>
                <p className="text-sm text-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Register button */}
        <button className="w-full gradient-hero text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-elevated active:scale-[0.98] transition-transform">
          <Plus className="w-5 h-5" />
          Registrar Refeição
        </button>
      </div>
    </div>
  );
};

export default Nutrition;
