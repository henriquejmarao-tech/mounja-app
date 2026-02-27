import { LucideIcon, ChevronRight } from "lucide-react";
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
        "flex items-center gap-3 w-full p-4 rounded-xl transition-all duration-300 active:scale-[0.98] text-left group border",
        variant === "sage" && "bg-sage-light/70 text-sage-dark border-primary/8 hover:bg-sage-light",
        variant === "coral" && "bg-coral-light/70 text-foreground border-secondary/8 hover:bg-coral-light",
        variant === "muted" && "bg-muted/60 text-foreground border-border/50 hover:bg-muted"
      )}
    >
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105",
          variant === "sage" && "bg-primary/12",
          variant === "coral" && "bg-secondary/15",
          variant === "muted" && "bg-foreground/8"
        )}
      >
        <Icon className={cn(
          "w-5 h-5",
          variant === "sage" && "text-primary",
          variant === "coral" && "text-secondary",
          variant === "muted" && "text-muted-foreground"
        )} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/50 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
    </button>
  );
};

export default QuickActionCard;
