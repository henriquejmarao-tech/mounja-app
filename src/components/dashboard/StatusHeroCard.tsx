import { useEffect, useRef, useState } from "react";
import { Pill, Weight, Check, AlertTriangle, Info, X } from "lucide-react";

interface ScoreFactor {
  label: string;
  status: "good" | "warning";
}

interface StatusHeroCardProps {
  dailyScore: number;
  scoreFactors: ScoreFactor[];
  currentDose: string | null;
  latestWeight: number | null;
}

const StatusHeroCard = ({ dailyScore, scoreFactors, currentDose, latestWeight }: StatusHeroCardProps) => {
  const maxScore = 100;
  const progress = Math.min(dailyScore / maxScore, 1);
  const radius = 52;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - progress);

  // Animate ring on mount
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  const mounted = useRef(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      const timer = setTimeout(() => setAnimatedOffset(targetOffset), 50);
      return () => clearTimeout(timer);
    }
    setAnimatedOffset(targetOffset);
  }, [targetOffset]);

  return (
    <div
      data-tutorial="dose-card"
      className="relative rounded-[20px] p-5 animate-fade-in-up overflow-hidden z-20"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 12px 30px rgba(0,0,0,0.10)",
      }}
    >
      {/* Info button — top right */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="absolute top-3 right-3 z-30 w-6 h-6 rounded-full flex items-center justify-center transition-colors"
        style={{ background: "rgba(0,0,0,0.04)" }}
        aria-label="Sobre o score"
      >
        {showInfo ? <X className="w-3 h-3 text-muted-foreground/50" /> : <Info className="w-3 h-3 text-muted-foreground/35" />}
      </button>

      {/* Info overlay */}
      {showInfo && (
        <div className="absolute inset-0 z-20 rounded-[20px] p-5 flex flex-col justify-center animate-fade-in" style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)" }}>
          <h4 className="text-xs font-bold text-foreground/70 mb-2.5">Como o score funciona</h4>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2"><span className="text-primary font-bold">35 pts</span> Medicação em dia</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">25 pts</span> Refeições equilibradas</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">20 pts</span> Hidratação adequada</li>
            <li className="flex items-start gap-2"><span className="text-primary font-bold">20 pts</span> Atividade física</li>
          </ul>
          <p className="text-[10px] text-muted-foreground/50 mt-3">Registre suas atividades diárias para aumentar seu score.</p>
        </div>
      )}

      {/* Central glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.10) 0%, transparent 70%)",
          filter: "blur(14px)",
        }}
      />

      <div className="relative flex items-center justify-between gap-1">
        {/* Left: Dose */}
        <div className="flex-1 flex flex-col items-center text-center gap-1">
          <div className="w-7 h-7 rounded-lg bg-primary/6 flex items-center justify-center">
            <Pill className="w-3 h-3 text-primary/50" />
          </div>
          <p className="text-xs font-semibold text-foreground/55 tabular-nums leading-tight">
            {currentDose || "—"}
          </p>
          <p className="text-[10px] text-muted-foreground/55 font-medium leading-tight">Dose atual</p>
        </div>

        {/* Center: Daily Score with animated ring */}
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
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="url(#scoreGradient)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={animatedOffset}
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--sage-light))" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--leaf))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="text-[3rem] font-extrabold text-foreground tabular-nums leading-none">
                {dailyScore}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/60 mt-0.5">/ 100</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground font-medium -mt-0.5">Score diário</p>
        </div>

        {/* Right: Weight */}
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

      {/* Score Factors */}
      {scoreFactors.length > 0 && (
        <div className="relative mt-4 pt-3 border-t border-border/30">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {scoreFactors.map((factor, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {factor.status === "good" ? (
                  <Check className="w-3 h-3 text-primary shrink-0" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                )}
                <span className={`text-[11px] font-medium leading-tight ${factor.status === "good" ? "text-foreground/60" : "text-amber-600/80"}`}>
                  {factor.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusHeroCard;
