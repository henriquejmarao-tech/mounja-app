import { Home, Plus, Clock, Leaf, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AiChat from "@/components/AiChat";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Clock, label: "Caminho", path: "/historico" },
  { icon: Plus, label: "Registrar", path: "/registrar", highlight: true },
  { icon: Leaf, label: "Nutrição", path: "/nutricao" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAiChat, setShowAiChat] = useState(false);

  const hiddenRoutes = ["/onboarding", "/auth", "/triagem", "/reset-password"];
  if (hiddenRoutes.some((r) => location.pathname.startsWith(r))) return null;

  return (
    <>
      <nav className="relative z-40">
        <div className="flex items-end gap-2 px-3 pb-2 max-w-lg mx-auto" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}>
          {/* Main nav bar */}
          <div
            className="flex-1 flex items-center justify-around rounded-2xl px-1 py-2"
            style={{
              background: "hsl(var(--foreground) / 0.92)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 4px 24px hsl(var(--foreground) / 0.15)",
            }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                  )}
                >
                  {item.highlight ? (
                    <div className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center",
                      isActive ? "gradient-hero" : "bg-white/15"
                    )}>
                      <item.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-white/70")} />
                    </div>
                  ) : (
                    <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/50")} />
                  )}
                  <span className={cn(
                    "text-[10px]",
                    isActive ? "text-white font-bold" : "text-white/50 font-medium",
                    item.highlight && "mt-0.5"
                  )}>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Floating AI button */}
          <button
            onClick={() => setShowAiChat(true)}
            className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)",
              boxShadow: "0 4px 20px hsl(var(--primary) / 0.35), inset 0 1px 1px hsl(0 0% 100% / 0.2)",
              marginBottom: "2px",
            }}
          >
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </button>
        </div>
      </nav>

      {showAiChat && <AiChat onClose={() => setShowAiChat(false)} />}
    </>
  );
};

export default BottomNav;
