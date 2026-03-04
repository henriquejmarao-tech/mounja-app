import { useEffect, useRef, useState } from "react";
import { Pill, Weight } from "lucide-react";

interface StatusHeroCardProps {
  streak: number;
  currentDose: string | null;
  latestWeight: number | null;
}

const StatusHeroCard = ({ streak, currentDose, latestWeight }: StatusHeroCardProps) => {
  const maxStreak = 30;
  const progress = Math.min(streak / maxStreak, 1);
  const radius = 52;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - progress);

  // Animate ring on mount
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      // Small delay so the initial state renders first
      const timer = setTimeout(() => setAnimatedOffset(targetOffset), 50);
      return () => clearTimeout(timer);
    }
    setAnimatedOffset(targetOffset);
  }, [targetOffset]);

  return (
    <div
      data-tutorial="dose-card"
      className="relative rounded-[20px] p-5 animate-fade-in-up overflow-hidden"
      style={{
        background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--accent)) 100%)",
        boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
      }}
    >
      {/* Central glow behind streak */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
          filter: "blur(14px)",
        }}
      />

      <div className="relative flex items-center justify-between gap-1">
        {/* Left: Dose — tertiary weight */}
        <div className="flex-1 flex flex-col items-center text-center gap-1">
          <div className="w-7 h-7 rounded-lg bg-primary/6 flex items-center justify-center">
            <Pill className="w-3 h-3 text-primary/50" />
          </div>
          <p className="text-xs font-semibold text-foreground/55 tabular-nums leading-tight">
            {currentDose || "—"}
          </p>
          <p className="text-[10px] text-muted-foreground/55 font-medium leading-tight">Dose atual</p>
        </div>

        {/* Center: Streak with animated ring */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-[132px] h-[132px] flex items-center justify-center">
            {/* Soft halo */}
            <div
              className="absolute inset-2 rounded-full pointer-events-none"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
              }}
            />
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 120 120"
            >
              {/* Background ring */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth - 2}
                strokeLinecap="round"
                opacity={0.5}
              />
              {/* Animated progress ring */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#streakGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={animatedOffset}
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
              <defs>
                <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--sage-light))" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--leaf))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="text-[3.25rem] font-extrabold text-foreground tabular-nums leading-none">
                {streak}
              </span>
              <span className="text-[11px] font-bold text-primary mt-1 uppercase tracking-widest">
                {streak === 1 ? "dia" : "dias"}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">Sequência ativa</p>
        </div>

        {/* Right: Weight — tertiary weight */}
        <div className="flex-1 flex flex-col items-center text-center gap-1">
          <div className="w-7 h-7 rounded-lg bg-muted/40 flex items-center justify-center">
            <Weight className="w-3 h-3 text-muted-foreground/45" />
          </div>
          <p className="text-xs font-semibold text-foreground/55 tabular-nums leading-tight">
            {latestWeight ? `${latestWeight}` : "—"}
            {latestWeight && <span className="text-[10px] font-medium text-muted-foreground/45 ml-0.5">kg</span>}
          </p>
          <p className="text-[10px] text-muted-foreground/55 font-medium leading-tight">Peso atual</p>
        </div>
      </div>

    </div>
  );
};

export default StatusHeroCard;
