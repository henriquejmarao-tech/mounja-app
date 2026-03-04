import { cn } from "@/lib/utils";

const periodFilters = ["7d", "30d", "90d", "Total"] as const;
export type Period = (typeof periodFilters)[number];

interface PeriodFilterProps {
  period: Period;
  onChange: (p: Period) => void;
}

const periodLabels: Record<Period, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "Total": "Total",
};

const PeriodFilter = ({ period, onChange }: PeriodFilterProps) => (
  <div data-tutorial="period-filter" className="px-5 -mt-3 mb-4 relative z-10">
    <div className="bg-card rounded-xl shadow-card border border-border/50 p-1 flex gap-0.5">
      {periodFilters.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all duration-200 uppercase tracking-wider",
            period === p
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  </div>
);

export { periodFilters };
export default PeriodFilter;
