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
      className="rounded-xl px-4 py-3 flex items-center gap-3 animate-fade-in-up border"
      style={{
        background: isToday
          ? "hsl(var(--primary) / 0.08)"
          : "hsl(var(--card))",
        borderColor: isToday
          ? "hsl(var(--primary) / 0.2)"
          : "hsl(var(--border) / 0.5)",
        boxShadow: "0 1px 4px -1px hsl(150 12% 18% / 0.04)",
        animationDelay: "30ms",
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: isSoon
            ? "hsl(var(--primary) / 0.12)"
            : "hsl(var(--muted) / 0.6)",
        }}
      >
        <CalendarClock
          className="w-4 h-4"
          style={{
            color: isSoon
              ? "hsl(var(--primary))"
              : "hsl(var(--muted-foreground))",
          }}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground/80">Próxima aplicação</p>
        <div className="flex items-center gap-1.5 mt-0.5">
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
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border" style={{
          background: "hsl(var(--muted) / 0.4)",
          borderColor: "hsl(var(--border) / 0.5)",
        }}>
          <Pill className="w-3 h-3 text-muted-foreground/60" />
          <span className="text-xs font-semibold text-foreground/60">{currentDose}</span>
        </div>
      )}
    </div>
  );
};

export default NextInjectionCard;
