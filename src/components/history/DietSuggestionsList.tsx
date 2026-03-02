import { Utensils } from "lucide-react";

interface DietSuggestionsListProps {
  dietSuggestions: any[];
}

const sanitize = (text: string | null): string => {
  if (!text) return "";
  return text
    .replace(/Ã©/g, "é").replace(/Ã£/g, "ã").replace(/Ã§/g, "ç")
    .replace(/Ã³/g, "ó").replace(/Ãº/g, "ú").replace(/Ã¡/g, "á")
    .replace(/Ã­/g, "í").replace(/Ãª/g, "ê").replace(/Ã´/g, "ô")
    .trim();
};

const DietSuggestionsList = ({ dietSuggestions }: DietSuggestionsListProps) => {
  if (dietSuggestions.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Utensils className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-bold text-sm">Sugestões de Dieta</h2>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">
          Nenhuma sugestão de dieta salva neste período.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 animate-fade-in-up" style={{ animationDelay: "280ms" }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Utensils className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-sm">Sugestões de Dieta</h2>
          <p className="text-[10px] text-muted-foreground">{dietSuggestions.length} sugestão(ões) no período</p>
        </div>
      </div>

      <div className="space-y-4">
        {dietSuggestions.slice(0, 7).map((d: any, idx: number) => (
          <div key={d.id || idx} className="bg-muted/40 rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-bold text-foreground">
              {new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
            </p>
            {d.context_note && (
              <p className="text-[10px] text-primary font-medium italic">{sanitize(d.context_note)}</p>
            )}

            <div className="space-y-1">
              {d.breakfast && (
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Cafe:</span> {sanitize(d.breakfast)}</p>
              )}
              {d.lunch && (
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Almoco:</span> {sanitize(d.lunch)}</p>
              )}
              {d.dinner && (
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Jantar:</span> {sanitize(d.dinner)}</p>
              )}
              {d.snack && (
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">Lanche:</span> {sanitize(d.snack)}</p>
              )}
            </div>

            {(d.calories_target || d.protein_target) && (
              <div className="flex gap-3 mt-1">
                {d.calories_target && (
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {d.calories_target} kcal
                  </span>
                )}
                {d.protein_target && (
                  <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                    {d.protein_target}g prot
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DietSuggestionsList;
