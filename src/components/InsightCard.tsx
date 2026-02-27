import { Sparkles } from "lucide-react";

interface InsightCardProps {
  title: string;
  description: string;
}

const InsightCard = ({ title, description }: InsightCardProps) => {
  return (
    <div className="gradient-hero rounded-xl p-4 text-primary-foreground">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
          Insight da IA
        </span>
      </div>
      <h3 className="font-bold text-sm mb-1">{title}</h3>
      <p className="text-xs opacity-90 leading-relaxed">{description}</p>
    </div>
  );
};

export default InsightCard;
