import { Home, Plus, Clock, Leaf, MessageCircle, Activity } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";
import AiChat from "@/components/AiChat";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Clock, label: "Caminho", path: "/historico" },
  { icon: Plus, label: "Registrar", path: "/registrar", highlight: true },
  { icon: Leaf, label: "Nutrição", path: "/nutricao" },
  { icon: Activity, label: "Movimento", path: "/treinos" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAiChat, setShowAiChat] = useState(false);

  const hiddenRoutes = ["/onboarding", "/auth", "/triagem", "/reset-password"];
  if (hiddenRoutes.some((r) => location.pathname.startsWith(r))) return null;

  return (
    <>
      {/* Floating chat button — positioned above the nav */}
      <button
        onClick={() => setShowAiChat(true)}
        className="fixed z-50 flex items-center justify-center w-12 h-12 transition-all duration-200 active:scale-90"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 92px)",
          right: "20px",
          background: "rgba(20, 30, 25, 0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <MessageCircle className="w-[22px] h-[22px] text-white/90" />
      </button>

      {/* Fixed floating bottom nav */}
      <nav
        className="fixed z-50"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: "420px",
        }}
      >
        <div
          className="flex items-center justify-around px-4 py-3"
          style={{
            background: "rgba(20, 30, 25, 0.72)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: "28px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            height: "64px",
          }}
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;

            if (item.highlight) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-0.5 transition-all duration-200 active:scale-90 -mt-6"
                >
                  <div
                    className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      background: isActive
                        ? "linear-gradient(145deg, hsl(143 28% 52%) 0%, hsl(152 28% 42%) 100%)"
                        : "linear-gradient(145deg, hsl(143 22% 48%) 0%, hsl(150 22% 38%) 100%)",
                      boxShadow: isActive
                        ? "0 4px 20px rgba(90, 170, 120, 0.5), 0 0 10px rgba(90, 170, 120, 0.3)"
                        : "0 4px 16px rgba(90, 170, 120, 0.3)",
                      border: "2px solid rgba(255, 255, 255, 0.15)",
                    }}
                  >
                    <item.icon className="w-[22px] h-[22px] text-white" />
                  </div>
                  <span
                    className={cn(
                      "text-[10px] transition-all mt-0.5",
                      isActive
                        ? "text-white font-bold"
                        : "text-white/50 font-medium"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center gap-1 px-2 py-1 transition-all duration-200 active:scale-90"
              >
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-300"
                  style={
                    isActive
                      ? {
                          boxShadow: "0 0 10px rgba(90, 170, 120, 0.4)",
                          transform: "scale(1.1)",
                        }
                      : undefined
                  }
                >
                  <item.icon
                    className={cn(
                      "w-[22px] h-[22px] transition-all duration-200",
                      isActive
                        ? "text-white stroke-[2.5]"
                        : "text-white/40"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] transition-all",
                    isActive
                      ? "text-white font-bold"
                      : "text-white/40 font-medium"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {showAiChat && <AiChat onClose={() => setShowAiChat(false)} />}
    </>
  );
};

export default BottomNav;
