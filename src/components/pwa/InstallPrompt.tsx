import { useState, useEffect, useCallback } from "react";
import { X, Download, Share, Plus } from "lucide-react";

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

const DISMISS_KEY = "pwa-install-dismissed";

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const iosDevice = isIos();
    setIsIosDevice(iosDevice);

    if (iosDevice) {
      // Show iOS instructions after a short delay
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowPrompt(true), 1500);
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
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
    } catch {
      // ignore
    }
    setDeferredPrompt(null);
    setInstalling(false);
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fade-in p-4">
      <div className="bg-card rounded-2xl shadow-elevated max-w-sm w-full p-6 relative animate-scale-in border border-border/50">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center shadow-lg">
            <Download className="w-8 h-8 text-primary-foreground" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground">Instalar Mounjá</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tenha acesso rápido direto da tela inicial do seu celular.
            </p>
          </div>

          {isIosDevice ? (
            <div className="w-full space-y-3 text-left bg-muted/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-foreground">Como instalar no iPhone:</p>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Toque no ícone de <span className="font-semibold text-foreground">Compartilhar</span> na barra do Safari
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Role para baixo e toque em <span className="font-semibold text-foreground">Adicionar à Tela de Início</span>
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-bold text-sm mt-2"
              >
                Entendi!
              </button>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={installing || !deferredPrompt}
              className="w-full py-3.5 rounded-xl gradient-hero text-primary-foreground font-bold text-sm shadow-elevated disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {installing ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Instalar agora
                </>
              )}
            </button>
          )}

          <button
            onClick={handleDismiss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
