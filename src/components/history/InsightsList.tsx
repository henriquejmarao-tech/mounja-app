import { TrendingDown, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Insight {
  title: string;
  description: string;
  type: "positive" | "warning" | "info";
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case "positive": return <TrendingDown className="w-3.5 h-3.5 text-primary" />;
    case "warning": return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
    default: return <Info className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const getInsightBorder = (type: string) => {
  switch (type) {
    case "positive": return "border-l-primary";
    case "warning": return "border-l-warning";
    default: return "border-l-muted-foreground";
  }
};

interface InsightsListProps {
  insights: Insight[];
}

const InsightsList = ({ insights }: InsightsListProps) => {
  if (insights.length === 0) return null;

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-primary" />
        <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Padrões identificados</h3>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className={cn("bg-card rounded-xl p-3.5 border border-border/50 border-l-[3px] shadow-sm", getInsightBorder(insight.type))}>
            <div className="flex items-center gap-2 mb-1">
              {getInsightIcon(insight.type)}
              <h4 className="font-semibold text-xs">{insight.title}</h4>
            </div>
            <p className="text-[12px] text-muted-foreground leading-relaxed ml-5.5">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsList;
