import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";

const TutorialCard = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/tutorial")}
      className="w-full rounded-[20px] p-4 animate-fade-in-up flex items-center gap-3.5 text-left active:scale-[0.98] transition-all duration-200 group border-2 border-primary/20"
      style={{ background: "hsl(var(--primary) / 0.04)", boxShadow: "0 4px 16px hsl(var(--primary) / 0.08)" }}
    >
      <div className="w-10 h-10 rounded-[14px] gradient-hero flex items-center justify-center shrink-0 shadow-sm">
        <BookOpen className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground/90">Conheça o Mounjá 🌿</p>
        <p className="text-xs text-muted-foreground/70 mt-0.5">
          Descubra como aproveitar ao máximo o app — leva 1 min
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-primary/50 shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
};

export default TutorialCard;
