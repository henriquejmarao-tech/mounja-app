import { cn } from "@/lib/utils";

interface MealCreditsBarProps {
  creditsUsed: number;
  creditsMax: number;
}

const MealCreditsBar = ({ creditsUsed, creditsMax }: MealCreditsBarProps) => {
  const atLimit = creditsUsed >= creditsMax;

  return (
    <div
      className={cn(
        "mx-5 mt-3 px-4 py-2.5 rounded-2xl flex items-center justify-between transition-colors"
      )}
      style={{ backgroundColor: atLimit ? "#F97316" : "#1A1A1A" }}
    >
      <span className="text-[13px] font-bold text-white">
        {atLimit ? "Limite de hoje atingido" : "Refeições gratuitas hoje"}
      </span>
      <span
        className="text-[13px] font-extrabold tabular-nums"
        style={{ color: atLimit ? "#FFFFFF" : "#A78BFA" }}
      >
        {creditsUsed} de {creditsMax} ✓
      </span>
    </div>
  );
};

export default MealCreditsBar;
