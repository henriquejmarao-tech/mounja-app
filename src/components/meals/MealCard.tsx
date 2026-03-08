import { useState } from "react";
import { ChevronDown, ChevronUp, Flame, Beef, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface MealCardProps {
  meal: {
    id: string;
    meal_time: string;
    photo_url: string | null;
    description: string | null;
    calories: number | null;
    protein: number | null;
    fiber: number | null;
    ai_analysis: any;
  };
  onDelete?: (id: string) => void;
}

const MealCard = ({ meal, onDelete }: MealCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const time = new Date(meal.meal_time).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const analysis = meal.ai_analysis;
  const items = analysis?.items || [];

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden">
      {/* Header row with photo thumbnail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3.5 active:bg-muted/30 transition-colors"
      >
        {meal.photo_url && (
          <img
            src={meal.photo_url}
            alt="Meal"
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        )}

        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {meal.description || "Refeição"}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{time}</p>
        </div>

        {/* Quick macro badges */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-destructive/10 px-2 py-1 rounded-lg">
            <Flame className="w-3 h-3 text-destructive" />
            <span className="text-[11px] font-bold text-destructive">{meal.calories || 0}</span>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3.5 pb-4 animate-fade-in">
          {/* Macro summary */}
          <div className="flex gap-2 mb-3">
            {[
              { icon: Flame, label: "Calorias", value: `${meal.calories || 0}`, color: "text-destructive", bg: "bg-destructive/10" },
              { icon: Beef, label: "Proteína", value: `${meal.protein || 0}g`, color: "text-amber-600", bg: "bg-amber-50" },
              { icon: Leaf, label: "Fibra", value: `${meal.fiber || 0}g`, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map((m) => (
              <div key={m.label} className={cn("flex-1 rounded-xl p-3 text-center", m.bg)}>
                <m.icon className={cn("w-4 h-4 mx-auto mb-1", m.color)} />
                <p className={cn("text-base font-extrabold", m.color)}>{m.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Individual items */}
          {items.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Itens identificados
              </p>
              {items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-xl"
                >
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                    <span>{item.calories} cal</span>
                    <span>{item.protein}g P</span>
                    <span>{item.fiber}g F</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI tip */}
          {analysis?.tip && (
            <div className="mt-3 bg-accent/50 rounded-xl p-3">
              <p className="text-xs text-accent-foreground leading-relaxed">
                💡 {analysis.tip}
              </p>
            </div>
          )}

          {/* Full photo */}
          {meal.photo_url && (
            <img
              src={meal.photo_url}
              alt="Meal"
              className="w-full h-48 object-cover rounded-xl mt-3"
            />
          )}

          {/* Delete */}
          {onDelete && (
            <button
              onClick={() => onDelete(meal.id)}
              className="mt-3 w-full text-center text-xs font-semibold text-destructive/70 py-2"
            >
              Remover refeição
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MealCard;
