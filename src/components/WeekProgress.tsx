import { cn } from "@/lib/utils";

const days = ["S", "T", "Q", "Q", "S", "S", "D"];
const completedDays = [true, true, true, false, false, false, false]; // Mock

const WeekProgress = () => {
  return (
    <div className="bg-card rounded-xl p-4 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Sua Semana</h3>
        <span className="text-xs text-muted-foreground">Semana 2</span>
      </div>
      <div className="flex items-center justify-between gap-1">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">
              {day}
            </span>
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                completedDays[i]
                  ? "bg-primary text-primary-foreground"
                  : i === 3
                  ? "bg-secondary/20 text-secondary ring-2 ring-secondary animate-pulse-soft"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {completedDays[i] ? "✓" : i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekProgress;
