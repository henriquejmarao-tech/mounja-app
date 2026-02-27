import { Home, UtensilsCrossed, Dumbbell, Syringe, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: UtensilsCrossed, label: "Nutrição", path: "/nutricao" },
  { icon: Dumbbell, label: "Treinos", path: "/treinos" },
  { icon: Syringe, label: "Aplicação", path: "/aplicacao" },
  { icon: User, label: "Perfil", path: "/perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === "/onboarding") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-card/90 backdrop-blur-xl border-t border-border/50">
        <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-300 relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "transition-transform duration-300",
                  isActive && "scale-110"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                </div>
                <span className={cn(
                  "text-[10px] transition-all",
                  isActive ? "font-bold" : "font-medium"
                )}>{item.label}</span>
                {isActive && (
                  <div className="absolute -top-0.5 w-5 h-0.5 rounded-full gradient-hero" />
                )}
              </button>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
};

export default BottomNav;
