import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sparkles } from "lucide-react";

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

  const handleSave = () => {
    onSave({
      calories: parseInt(calories) || 1650,
      protein: parseFloat(protein) || 107,
      fiber: parseFloat(fiber) || 25,
      water: parseInt(water) || 11,
    });
    onOpenChange(false);
  };

  const rows = [
    { emoji: "🔥", label: "Calories", unit: "(kcal)", value: calories, onChange: setCalories },
    { emoji: "🍖", label: "Protein", unit: "(g)", value: protein, onChange: setProtein },
    { emoji: "🌾", label: "Fiber", unit: "(g)", value: fiber, onChange: setFiber },
    { emoji: "💧", label: "Water", unit: "(copos)", value: water, onChange: setWater },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <div className="mx-auto w-full max-w-md px-6 pb-6">
          <DrawerHeader className="px-0 pt-2 pb-6">
            <DrawerTitle className="text-left text-xl font-bold text-foreground">
              Edit nutrition goals
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
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 border border-border rounded-2xl py-4 text-base font-semibold text-foreground active:scale-[0.97] transition-transform mb-3"
          >
            <Sparkles className="w-5 h-5" />
            Auto generate goals
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditGoalsDrawer;
