import { Home, FileText, TrendingUp, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { icon: Home, label: "Today", path: "/" },
  { icon: FileText, label: "Log", path: "/log" },
  { icon: TrendingUp, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
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
      className="fixed z-50 left-0 right-0"
      style={{
        bottom: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        background: "hsl(var(--card))",
        borderTop: "1px solid hsl(var(--border))",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 transition-all duration-200 active:scale-90"
            >
              <item.icon
                className={cn(
                  "w-[22px] h-[22px] transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground/60"
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={cn(
                  "text-[10px] transition-all",
                  isActive ? "text-primary font-bold" : "text-muted-foreground/60 font-medium"
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
