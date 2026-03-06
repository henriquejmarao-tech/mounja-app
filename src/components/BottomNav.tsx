import { Home, FileText, TrendingUp, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
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
      className="fixed z-50"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "420px",
      }}
    >
      <div
        className="flex items-center justify-around px-2 py-2"
        style={{
          background: "hsl(var(--card) / 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "20px",
          boxShadow: "0 4px 24px hsl(220 20% 14% / 0.08), 0 0 0 1px hsl(var(--border) / 0.5)",
          height: "60px",
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-0.5 px-4 py-1.5 transition-all duration-200 active:scale-90 rounded-xl"
            >
              <item.icon
                className={cn(
                  "w-[20px] h-[20px] transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] transition-all",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground font-medium"
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
