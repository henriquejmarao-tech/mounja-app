import { Home, Plus, Clock, Users, HelpCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import AiChat from "@/components/AiChat";

const navItems = [
  { icon: Home, label: "Início", path: "/" },
  { icon: Clock, label: "Caminho", path: "/historico" },
  { icon: Plus, label: "Registrar", path: "/registrar" },
  { icon: Users, label: "Comunidade", path: "/comunidade" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAiChat, setShowAiChat] = useState(false);
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

  const pillStyle = {
    background: "rgba(28, 52, 45, 0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderRadius: "28px",
    boxShadow: "0 10px 35px rgba(0, 0, 0, 0.18)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  };

  return (
    <>
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
        <div className="flex items-center gap-2.5">
          <div
            className="flex-1 flex items-center justify-around px-3 py-3"
            style={{ ...pillStyle, height: "64px" }}
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
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
                        ? { boxShadow: "0 0 10px rgba(88, 168, 128, 0.45)", transform: "scale(1.1)" }
                        : undefined
                    }
                  >
                    <item.icon
                      className={cn(
                        "w-[22px] h-[22px] transition-all duration-200",
                        isActive ? "text-white stroke-[2.5]" : "text-white/40"
                      )}
                    />
                  </div>
                  <span className={cn("text-[10px] transition-all", isActive ? "text-white font-bold" : "text-white/40 font-medium")}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowAiChat(true)}
            className="shrink-0 flex items-center justify-center transition-all duration-200 active:scale-90"
            style={{ ...pillStyle, width: "64px", height: "64px", borderRadius: "20px" }}
          >
            <HelpCircle className="w-[24px] h-[24px] text-white/90" />
          </button>
        </div>
      </nav>

      {showAiChat && <AiChat onClose={() => setShowAiChat(false)} />}
    </>
  );
};

export default BottomNav;
