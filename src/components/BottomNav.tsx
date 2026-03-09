import { House, Apple, TrendingUp, SlidersHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { icon: House, label: "Hoje", path: "/" },
  { icon: Apple, label: "Refeições", path: "/meals" },
  { icon: TrendingUp, label: "Progresso", path: "/progress" },
  { icon: SlidersHorizontal, label: "Ajustes", path: "/settings" },
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

  const hiddenRoutes = ["/onboarding", "/auth", "/triagem", "/reset-password", "/tutorial", "/welcome"];
  if (hiddenRoutes.some((r) => location.pathname.startsWith(r))) return null;
  if (hidden) return null;

  return (
    <nav
      className="fixed z-50 left-0 right-0 bottom-0 bg-card border-t border-border/40"
      style={{
        paddingBottom: "var(--safe-area-bottom)",
        minHeight: "calc(var(--tab-bar-height) + var(--safe-area-bottom))",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-4" style={{ height: "var(--tab-bar-height)" }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 min-w-[60px] py-1 transition-all duration-200 active:scale-90"
            >
              <item.icon
                className={cn(
                  "w-6 h-6 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground/40"
                )}
                strokeWidth={isActive ? 2.2 : 1.5}
              />
              <span
                className={cn(
                  "text-[10px] leading-tight transition-all",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground/40 font-medium"
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
