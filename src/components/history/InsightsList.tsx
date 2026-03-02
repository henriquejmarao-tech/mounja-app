import { Sparkles, TrendingDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Insight {
  title: string;
  description: string;
  type: "positive" | "warning" | "info";
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case "positive": return <TrendingDown className="w-4 h-4 text-primary" />;
    case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
    default: return <Sparkles className="w-4 h-4 text-info" />;
  }
};

const getInsightBg = (type: string) => {
  switch (type) {
    case "positive": return "border-primary/15 bg-primary/5";
    case "warning": return "border-warning/15 bg-warning/5";
    default: return "border-info/15 bg-info/5";
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
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-bold text-sm">O que seus dados mostram</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <div key={i} className={cn("rounded-2xl p-4 border shadow-card", getInsightBg(insight.type))}>
            <div className="flex items-center gap-2 mb-1.5">
              {getInsightIcon(insight.type)}
              <h4 className="font-semibold text-sm">{insight.title}</h4>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsList;
