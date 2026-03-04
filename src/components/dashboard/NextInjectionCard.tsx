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
    ? "Amanhã"
    : `Em ${daysUntilNext} dias`;

  return (
    <div
      className="rounded-[20px] p-4 flex items-center gap-3.5 animate-fade-in-up"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 8px 24px rgba(17,24,39,0.08)",
        animationDelay: "30ms",
      }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0"
        style={{
          background: isSoon
            ? "hsl(var(--primary) / 0.1)"
            : "rgba(17,24,39,0.04)",
        }}
      >
        <CalendarClock className="w-[18px] h-[18px]" style={{ color: isSoon ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>Próxima aplicação</p>
        <div className="flex items-center gap-1.5 mt-1">
          {isToday && (
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-soft shrink-0" />
          )}
          <span
            className="text-sm font-bold tabular-nums"
            style={{
              color: isSoon
                ? "hsl(var(--primary))"
                : "hsl(var(--foreground) / 0.7)",
            }}
          >
            {timeLabel}
          </span>
        </div>
      </div>

      {/* Dose badge */}
      {currentDose && (
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{
          background: "rgba(46,125,97,0.10)",
        }}>
          <Pill className="w-3.5 h-3.5" style={{ color: "hsl(var(--primary) / 0.7)" }} />
          <span className="text-xs font-semibold" style={{ color: "hsl(150 22% 30%)" }}>{currentDose}</span>
        </div>
      )}
    </div>
  );
};

export default NextInjectionCard;
