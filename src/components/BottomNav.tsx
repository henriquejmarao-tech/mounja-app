import { Home, UtensilsCrossed, TrendingUp, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: UtensilsCrossed, label: "Refeições", path: "/meals" },
  { icon: TrendingUp, label: "Progresso", path: "/progress" },
  { icon: Settings, label: "Ajustes", path: "/settings" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setHidden(document.body.hasAttribute("data-hide-nav"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-hide-nav"] });
    return () => observer.disconnect();
  }, []);

  const hiddenRoutes = ["/onboarding", "/auth", "/triagem", "/reset-password", "/tutorial"];
  if (hiddenRoutes.some((r) => location.pathname.startsWith(r))) return null;
  if (hidden) return null;

  return (
    <nav
      className="fixed z-50 left-0 right-0 bottom-0 bg-card border-t border-border/60"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-1 min-w-[64px] py-1 transition-all duration-200 active:scale-90"
            >
              <item.icon
                className={cn(
                  "w-6 h-6 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground/50"
                )}
                strokeWidth={isActive ? 2.4 : 1.6}
              />
              <span
                className={cn(
                  "text-[11px] leading-tight transition-all",
                  isActive ? "text-primary font-bold" : "text-muted-foreground/50 font-medium"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
