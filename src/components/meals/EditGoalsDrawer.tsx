import { useState, useEffect, useRef, useCallback } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoalsData {
  calories: number;
  protein: number;
  fiber: number;
  water: number;
}

interface EditGoalsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goals: GoalsData;
  onSave: (goals: GoalsData) => void;
}

const EditGoalsDrawer = ({ open, onOpenChange, goals, onSave }: EditGoalsDrawerProps) => {
  const [calories, setCalories] = useState(String(goals.calories));
  const [protein, setProtein] = useState(String(goals.protein));
  const [fiber, setFiber] = useState(String(goals.fiber));
  const [water, setWater] = useState(String(goals.water));
  const [generating, setGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      setCalories(String(goals.calories));
      setProtein(String(goals.protein));
      setFiber(String(goals.fiber));
      setWater(String(goals.water));
    }
  }, [open, goals.calories, goals.protein, goals.fiber, goals.water]);

  const saveGoals = useCallback((c: string, p: string, f: string, w: string) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSave({
        calories: parseInt(c) || 1650,
        protein: parseFloat(p) || 107,
        fiber: parseFloat(f) || 25,
        water: parseInt(w) || 11,
      });
    }, 600);
  }, [onSave]);

  const handleChange = (setter: (v: string) => void, value: string, field: "cal" | "pro" | "fib" | "wat") => {
    setter(value);
    const c = field === "cal" ? value : calories;
    const p = field === "pro" ? value : protein;
    const f = field === "fib" ? value : fiber;
    const w = field === "wat" ? value : water;
    saveGoals(c, p, f, w);
  };

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("nutrition-goals");
      if (error) throw error;
      if (data?.calories) {
        setCalories(String(Math.round(data.calories)));
        setProtein(String(data.protein));
        setFiber(String(data.fiber));
        setWater(String(Math.round(data.water)));
        // Save immediately
        onSave({
          calories: Math.round(data.calories),
          protein: data.protein,
          fiber: data.fiber,
          water: Math.round(data.water),
        });
        toast.success("Metas geradas com IA ✓");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar metas");
    }
    setGenerating(false);
  };

  const rows = [
    { emoji: "🔥", label: "Calorias", unit: "(kcal)", value: calories, onChange: (v: string) => handleChange(setCalories, v, "cal") },
    { emoji: "🍖", label: "Proteína", unit: "(g)", value: protein, onChange: (v: string) => handleChange(setProtein, v, "pro") },
    { emoji: "🌾", label: "Fibra", unit: "(g)", value: fiber, onChange: (v: string) => handleChange(setFiber, v, "fib") },
    { emoji: "💧", label: "Água", unit: "(copos)", value: water, onChange: (v: string) => handleChange(setWater, v, "wat") },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <div className="mx-auto w-full max-w-md px-6 pb-6">
          <DrawerHeader className="px-0 pt-2 pb-6">
            <DrawerTitle className="text-left text-xl font-bold text-foreground">
              Editar metas nutricionais
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-5 mb-6">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{row.emoji}</span>
                  <span className="text-base font-semibold text-foreground">
                    {row.label}{" "}
                    <span className="text-muted-foreground font-normal text-sm">{row.unit}</span>
                  </span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  value={row.value}
                  onChange={(e) => row.onChange(e.target.value)}
                  className="w-36 text-center bg-muted/50 rounded-2xl py-3 text-base font-semibold text-foreground border-0 outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleGenerateAI}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 border border-border rounded-2xl py-4 text-base font-semibold text-foreground active:scale-[0.97] transition-transform mb-3 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {generating ? "Gerando metas..." : "Gerar metas com IA"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditGoalsDrawer;
