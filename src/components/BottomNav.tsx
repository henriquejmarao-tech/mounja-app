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
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div
          className="flex items-end gap-2.5 px-3 max-w-lg mx-auto"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" }}
        >
          {/* Main nav pill */}
          <div
            className="flex-1 flex items-center justify-around rounded-[20px] px-2 py-2.5"
            style={{
              background: "hsl(150 14% 10% / 0.94)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              boxShadow: "0 8px 32px hsl(150 14% 7% / 0.25), 0 2px 8px hsl(150 14% 7% / 0.15)",
              border: "1px solid hsl(150 10% 20% / 0.3)",
            }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 active:scale-90"
                >
                  {item.highlight ? (
                    <div
                      className={cn(
                        "w-10 h-10 rounded-[14px] flex items-center justify-center -mt-4 transition-all duration-300",
                        isActive
                          ? "gradient-hero shadow-glow"
                          : "bg-white/10"
                      )}
                      style={isActive ? {
                        boxShadow: "0 4px 16px hsl(143 22% 55% / 0.4)",
                      } : undefined}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-primary-foreground" : "text-white/60"
                      )} />
                    </div>
                  ) : (
                    <item.icon className={cn(
                      "w-[22px] h-[22px] transition-all duration-200",
                      isActive ? "text-white stroke-[2.5]" : "text-white/45"
                    )} />
                  )}
                  <span className={cn(
                    "text-[10px] transition-all",
                    isActive ? "text-white font-bold" : "text-white/40 font-medium",
                    item.highlight && "mt-0"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Floating AI button */}
          <button
            onClick={() => setShowAiChat(true)}
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 mb-0.5"
            style={{
              background: "linear-gradient(145deg, hsl(143 28% 52%) 0%, hsl(152 28% 42%) 100%)",
              boxShadow: "0 4px 20px hsl(143 22% 55% / 0.4), inset 0 1px 2px hsl(0 0% 100% / 0.15)",
              border: "2px solid hsl(143 22% 55% / 0.3)",
            }}
          >
            <MessageCircle className="w-[22px] h-[22px] text-white" />
          </button>
        </div>
      </nav>

      {showAiChat && <AiChat onClose={() => setShowAiChat(false)} />}
    </>
  );
};

export default BottomNav;
