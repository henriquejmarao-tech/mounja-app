import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  variant?: "sage" | "coral" | "muted";
  onClick?: () => void;
}

const QuickActionCard = ({
  icon: Icon,
  title,
  subtitle,
  variant = "sage",
  onClick,
}: QuickActionCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-4 rounded-xl transition-all duration-200 active:scale-[0.98] text-left",
        variant === "sage" && "bg-sage-light text-sage-dark",
        variant === "coral" && "bg-coral-light text-foreground",
        variant === "muted" && "bg-muted text-foreground"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          variant === "sage" && "bg-primary/15",
          variant === "coral" && "bg-secondary/20",
          variant === "muted" && "bg-foreground/10"
        )}
      >
        <Icon className={cn(
          "w-5 h-5",
          variant === "sage" && "text-primary",
          variant === "coral" && "text-secondary",
          variant === "muted" && "text-muted-foreground"
        )} />
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </button>
  );
};

export default QuickActionCard;
