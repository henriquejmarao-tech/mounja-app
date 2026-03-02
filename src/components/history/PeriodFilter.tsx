import { cn } from "@/lib/utils";

const periodFilters = ["7d", "30d", "90d", "Total"] as const;
export type Period = (typeof periodFilters)[number];

interface PeriodFilterProps {
  period: Period;
  onChange: (p: Period) => void;
}

const PeriodFilter = ({ period, onChange }: PeriodFilterProps) => (
  <div data-tutorial="period-filter" className="px-5 -mt-3 mb-4 relative z-10">
    <div className="bg-card rounded-2xl shadow-card border border-border/50 p-1.5 flex gap-1">
      {periodFilters.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300",
            period === p
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {p === "Total" ? p : p.replace("d", " dias")}
        </button>
      ))}
    </div>
  </div>
);

export { periodFilters };
export default PeriodFilter;
