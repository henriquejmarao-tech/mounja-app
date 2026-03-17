import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Medal } from "lucide-react";

interface MilestonesCardProps {
  initialWeight: number | null | undefined;
  currentWeight: number | null;
  goalWeight: number | null;
}

const MilestonesCard = ({ initialWeight, currentWeight, goalWeight }: MilestonesCardProps) => {
  const navigate = useNavigate();

  const milestoneData = useMemo(() => {
    if (!initialWeight || !currentWeight) return null;

    const totalLost = Number(initialWeight) - Number(currentWeight);
    if (totalLost < 0) return null;

    // Generate milestones every 1kg
    const milestones = [];
    for (let i = 1; i <= 50; i++) {
      milestones.push(i);
    }

    // Find current milestone bracket
    const achieved = milestones.filter((m) => totalLost >= m);
    const nextMilestone = milestones.find((m) => totalLost < m) || milestones[milestones.length - 1];
    const prevMilestone = achieved.length > 0 ? achieved[achieved.length - 1] : 0;
    const remaining = nextMilestone - totalLost;
    const progress = ((totalLost - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

    return {
      totalLost: totalLost.toFixed(1),
      nextMilestone,
      prevMilestone,
      remaining: remaining.toFixed(1),
      progress: Math.min(100, Math.max(0, progress)),
      achievedCount: achieved.length,
    };
  }, [initialWeight, currentWeight]);

  if (!milestoneData) {
    return (
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Marcos</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Medal className="w-8 h-8 text-muted-foreground/40 mb-3" />
          <p className="text-base font-semibold text-foreground">Nenhum marco ainda</p>
          <p className="text-sm text-muted-foreground mt-1">
            Registre seu progresso para desbloquear marcos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground">Marcos</h2>
        <button
          onClick={() => navigate("/progress")}
          className="text-[11px] text-muted-foreground/50 font-semibold flex items-center gap-0.5"
        >
          Ver todos <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="border-t border-border/50 pt-4">
        <p className="text-sm text-foreground font-medium text-center mb-4">
          {milestoneData.remaining} kg até o próximo marco
        </p>

        <div className="flex items-center gap-3">
          {/* Previous milestone */}
          <div className="flex flex-col items-center">
            <span className="text-2xl">🏅</span>
            <span className="text-xs text-muted-foreground font-medium mt-1">
              {milestoneData.prevMilestone} kg
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex-1">
            <div className="h-3 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${milestoneData.progress}%`,
                  background: "linear-gradient(90deg, hsl(250, 58%, 68%), hsl(250, 58%, 52%))",
                }}
              />
            </div>
          </div>

          {/* Next milestone */}
          <div className="flex flex-col items-center">
            <span className="text-2xl">🥇</span>
            <span className="text-xs text-muted-foreground font-medium mt-1">
              {milestoneData.nextMilestone} kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestonesCard;
