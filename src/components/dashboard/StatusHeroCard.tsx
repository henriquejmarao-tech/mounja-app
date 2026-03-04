import { Pill, Weight } from "lucide-react";

interface StatusHeroCardProps {
  streak: number;
  currentDose: string | null;
  latestWeight: number | null;
  daysUntilNext: number | null;
}

const StatusHeroCard = ({ streak, currentDose, latestWeight, daysUntilNext }: StatusHeroCardProps) => {
  // Progress ring: streak out of 30 days max for visual
  const maxStreak = 30;
  const progress = Math.min(streak / maxStreak, 1);
  const radius = 52;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      data-tutorial="dose-card"
      className="relative rounded-2xl p-5 shadow-elevated border border-border/40 animate-fade-in-up overflow-hidden"
      style={{
        background: "linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--accent)) 100%)",
      }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "hsl(var(--primary))" }}
      />

      <div className="relative flex items-center justify-between gap-2">
        {/* Left: Dose */}
        <div className="flex-1 flex flex-col items-center text-center gap-1.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Pill className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
            {currentDose || "—"}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium leading-tight">Dose atual</p>
        </div>

        {/* Center: Streak with ring */}
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-[124px] h-[124px] flex items-center justify-center">
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
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Progress ring */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#streakGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="streakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--leaf))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="text-4xl font-extrabold text-foreground tabular-nums leading-none">
                {streak}
              </span>
              <span className="text-[11px] font-semibold text-primary mt-1 uppercase tracking-wider">
                {streak === 1 ? "dia" : "dias"}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">Sequência ativa</p>
        </div>

        {/* Right: Weight */}
        <div className="flex-1 flex flex-col items-center text-center gap-1.5">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <Weight className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
            {latestWeight ? `${latestWeight}` : "—"}
            {latestWeight && <span className="text-xs font-medium text-muted-foreground ml-0.5">kg</span>}
          </p>
          <p className="text-[11px] text-muted-foreground font-medium leading-tight">Peso atual</p>
        </div>
      </div>

      {/* Next application mini badge */}
      {daysUntilNext !== null && (
        <div className="mt-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 bg-primary/8 rounded-full px-3 py-1.5 border border-primary/15">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft" />
            <span className="text-[11px] font-semibold text-primary">
              {daysUntilNext === 0
                ? "Aplicação hoje"
                : daysUntilNext === 1
                ? "Aplicação amanhã"
                : `Próxima aplicação em ${daysUntilNext} dias`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusHeroCard;
