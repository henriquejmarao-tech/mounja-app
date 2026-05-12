import { useState, useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";
import mascotImg from "@/assets/mascot-pointing.png";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isIos = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
};

const isInStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (window.navigator as any).standalone === true;



const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const iosDevice = isIos();
    setIsIosDevice(iosDevice);

    if (iosDevice) {
      setShowPrompt(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShowPrompt(false);
    } catch { /* ignore */ }
    setDeferredPrompt(null);
    setInstalling(false);
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center animate-fade-in p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm relative overflow-hidden animate-scale-in"
        style={{
          background: "#FAFAFA",
          borderRadius: 28,
          boxShadow: "0 24px 64px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: "rgba(0,0,0,0.05)" }}
          aria-label="Fechar"
        >
          <X className="w-4 h-4" style={{ color: "#999" }} />
        </button>

        {/* Header with mascot */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <img
            src={mascotImg}
            alt="Mounjá"
            className="w-20 h-20 object-contain mb-3"
            style={{ filter: "drop-shadow(0 4px 12px rgba(123,47,247,0.12))" }}
          />
          <h2 className="text-lg font-extrabold text-center leading-tight" style={{ color: "#1A1A1A" }}>
            Instale o{" "}
            <span style={{
              background: "linear-gradient(135deg, #7B2FF7, #F857A6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Mounjá
            </span>
          </h2>
          <p className="text-xs text-center mt-1" style={{ color: "#999" }}>
            Acesso rápido direto da sua tela inicial
          </p>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {isIosDevice ? (
            /* ── iOS 3-step visual tutorial ── */
            <div className="space-y-3 mb-5">
              {[
                {
                  step: 1,
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B2FF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  ),
                  title: "Toque em Compartilhar",
                  desc: "O ícone fica na barra inferior do Safari",
                },
                {
                  step: 2,
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B2FF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  ),
                  title: "Adicionar à Tela de Início",
                  desc: "Role para baixo e toque nessa opção",
                },
                {
                  step: 3,
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B2FF7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ),
                  title: "Confirme tocando em Adicionar",
                  desc: "Pronto! O Mounjá aparecerá na sua tela",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-3 p-3 rounded-2xl"
                  style={{ background: "#fff", border: "1px solid #F0F0F0" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(123,47,247,0.06)" }}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "linear-gradient(135deg, #7B2FF7, #F857A6)",
                          color: "#fff",
                        }}
                      >
                        {item.step}
                      </span>
                      <span className="text-sm font-bold" style={{ color: "#1A1A1A" }}>
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: "#999" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Android / Desktop ── */
            <div
              className="flex items-center gap-3 p-4 rounded-2xl mb-5"
              style={{ background: "#fff", border: "1px solid #F0F0F0" }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)" }}
              >
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>
                  Acesse sem abrir o navegador
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "#999" }}>
                  Como um app de verdade, direto da tela inicial
                </p>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={isIosDevice ? handleDismiss : handleInstall}
            disabled={!isIosDevice && (installing || !deferredPrompt)}
            className="w-full font-bold py-4 rounded-[28px] flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)",
              boxShadow: "0 4px 16px rgba(123,47,247,0.20)",
            }}
          >
            {installing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isIosDevice ? (
              "Entendi!"
            ) : (
              <>
                <Download className="w-5 h-5" />
                Instalar agora
              </>
            )}
          </button>

          {/* Dismiss link */}
          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs mt-3 py-1 transition-colors"
            style={{ color: "#CCC" }}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
