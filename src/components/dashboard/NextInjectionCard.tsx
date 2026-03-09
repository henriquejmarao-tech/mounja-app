import { Pill, CalendarClock } from "lucide-react";

interface NextInjectionCardProps {
  daysUntilNext: number | null;
  currentDose: string | null;
}

const NextInjectionCard = ({ daysUntilNext, currentDose }: NextInjectionCardProps) => {
  if (daysUntilNext === null) return null;

  const isToday = daysUntilNext === 0;
  const isTomorrow = daysUntilNext === 1;
  const isSoon = daysUntilNext <= 2;

  const timeLabel = isToday
    ? "Hoje"
    : isTomorrow
    ? "Próxima aplicação amanhã"
    : `Em ${daysUntilNext} dias`;

  return (
    <div
      className="rounded-[20px] p-4 flex items-center gap-3.5 animate-fade-in-up"
      style={{
        background: "#F7F8F7",
        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        animationDelay: "30ms",
      }}
    >
      {/* Icon */}
      <div
        className="w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0"
        style={{
          background: isSoon
            ? "hsl(var(--primary) / 0.08)"
            : "rgba(17,24,39,0.04)",
        }}
      >
        <CalendarClock className="w-4 h-4" style={{ color: isSoon ? "hsl(var(--primary) / 0.7)" : "hsl(var(--muted-foreground) / 0.6)" }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium" style={{ color: "rgba(17,24,39,0.45)" }}>Próxima aplicação</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isToday && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft shrink-0" />
          )}
          <span
            className="text-[13px] font-semibold tabular-nums"
            style={{
              color: isSoon
                ? "hsl(var(--primary) / 0.85)"
                : "hsl(var(--foreground) / 0.6)",
            }}
          >
            {timeLabel}
          </span>
        </div>
      </div>

      {/* Dose badge */}
      {currentDose && (
        <div className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{
          background: "rgba(46,125,97,0.07)",
        }}>
          <Pill className="w-3 h-3" style={{ color: "hsl(var(--primary) / 0.5)" }} />
          <span className="text-[11px] font-medium" style={{ color: "hsl(150 22% 35% / 0.75)" }}>{currentDose}</span>
        </div>
      )}
    </div>
  );
};

export default NextInjectionCard;
