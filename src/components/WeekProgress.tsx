import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const days = ["S", "T", "Q", "Q", "S", "S", "D"];
const completedDays = [true, true, true, false, false, false, false];

const WeekProgress = () => {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-sm tracking-tight">Sua Semana</h3>
        <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-full">
          Semana 2
        </span>
      </div>
      <div className="flex items-center justify-between gap-1.5">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">
              {day}
            </span>
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                completedDays[i]
                  ? "gradient-hero text-primary-foreground shadow-glow"
                  : i === 3
                  ? "bg-secondary/15 text-secondary ring-2 ring-secondary/40 animate-pulse-soft"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {completedDays[i] ? <Check className="w-4 h-4" /> : i + 1}
            </div>
          </div>
        ))}
      </div>
      {/* Progress bar */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
          <div className="gradient-hero h-full rounded-full transition-all duration-700 ease-out" style={{ width: "43%" }} />
        </div>
        <span className="text-[10px] text-muted-foreground font-semibold">3/7</span>
      </div>
    </div>
  );
};

export default WeekProgress;
