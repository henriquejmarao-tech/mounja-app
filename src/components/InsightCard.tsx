import { Sparkles } from "lucide-react";

interface InsightCardProps {
  title: string;
  description: string;
}

const InsightCard = ({ title, description }: InsightCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 bg-card border border-primary/15 shadow-card">
      {/* Decorative gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-hero" />
      <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Insight da IA
          </span>
        </div>
        <h3 className="font-bold text-sm mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default InsightCard;
