import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import mascotImg from "@/assets/mascot-pointing.png";

const isInstagramBrowser = () => /Instagram/i.test(navigator.userAgent);
const isIOSDevice = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);

const DISMISS_KEY = "ig-browser-banner-dismissed";

const InstagramBrowserBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isInstagramBrowser()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    const timer = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  };

  if (!show) return null;

  const isIOS = isIOSDevice();

  const steps = isIOS
    ? [
        { icon: "⋯", title: 'Toque nos "..." no canto inferior direito', desc: "A barra de opções fica na parte de baixo da tela" },
        { icon: "🔗", title: 'Selecione "Abrir no Safari"', desc: 'Ou "Abrir no navegador padrão"' },
        { icon: "✅", title: "Pronto! Agora adicione à tela de início", desc: "No Safari: Compartilhar → Adicionar à Tela de Início" },
      ]
    : [
        { icon: "⋮", title: 'Toque nos "⋮" no canto superior direito', desc: "O menu de opções fica no topo da tela do Instagram" },
        { icon: "🔗", title: 'Selecione "Abrir no Chrome"', desc: 'Ou "Abrir no navegador"' },
        { icon: "✅", title: "Pronto! Experiência completa liberada", desc: "E você ainda pode adicionar o app à tela inicial" },
      ];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-sm relative overflow-hidden"
        style={{ background: "#FAFAFA", borderRadius: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.06)" }}
          aria-label="Fechar"
        >
          <X className="w-4 h-4" style={{ color: "#999" }} />
        </button>

        <div className="flex flex-col items-center pt-8 pb-4 px-6">
          <img src={mascotImg} alt="Mounjá" className="w-16 h-16 object-contain mb-3" style={{ filter: "drop-shadow(0 4px 12px rgba(123,47,247,0.12))" }} />
          <div className="text-[10px] font-bold px-3 py-1 rounded-full mb-2" style={{ background: "rgba(123,47,247,0.08)", color: "#7B2FF7" }}>
            📱 Aberto no Instagram
          </div>
          <h2 className="text-lg font-extrabold text-center leading-tight" style={{ color: "#1A1A1A" }}>
            Abra no{" "}
            <span style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              navegador
            </span>{" "}
            para instalar
          </h2>
          <p className="text-xs text-center mt-1" style={{ color: "#999" }}>
            O browser do Instagram não permite adicionar à tela de início
          </p>
        </div>

        <div className="px-6 pb-6">
          <div className="space-y-2.5 mb-5">
            {steps.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl" style={{ background: "#fff", border: "1px solid #F0F0F0" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: "rgba(123,47,247,0.06)" }}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)", color: "#fff" }}>
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold" style={{ color: "#1A1A1A" }}>{item.title}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: "#999" }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleDismiss}
            className="w-full font-bold py-4 rounded-[28px] flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)", boxShadow: "0 4px 16px rgba(123,47,247,0.20)" }}
          >
            <ExternalLink className="w-5 h-5" />
            Entendi, vou abrir no navegador
          </button>
          <button onClick={handleDismiss} className="w-full text-center text-xs mt-3 py-1" style={{ color: "#CCC" }}>
            Continuar assim mesmo
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstagramBrowserBanner;
