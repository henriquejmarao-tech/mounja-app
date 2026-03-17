import { useState, useEffect, useRef } from "react";
import mascotImg from "@/assets/mascot-pointing.png";

const GRADIENT = "linear-gradient(135deg, hsl(295 55% 42%), hsl(340 65% 62%), hsl(15 75% 75%))";
const BUBBLE_TEXT = "Alternar os locais ajuda a evitar desconfortos e melhorar a absorção.";

interface Props {
  value: boolean | null;
  onChange: (v: boolean) => void;
}

const AlternateSitesStep = ({ value, onChange }: Props) => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [displayed, setDisplayed] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!mascotLoaded) return;
    const t1 = setTimeout(() => setMascotVisible(true), 100);
    const t2 = setTimeout(() => setShowBubble(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mascotLoaded]);

  useEffect(() => {
    if (!showBubble) return;
    const d = 1400 / BUBBLE_TEXT.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++; setDisplayed(BUBBLE_TEXT.slice(0, i));
      if (i >= BUBBLE_TEXT.length) { clearInterval(intervalRef.current); setTypingDone(true); }
    }, d);
    return () => clearInterval(intervalRef.current);
  }, [showBubble]);

  useEffect(() => {
    if (typingDone) { const t = setTimeout(() => setShowCursor(false), 1000); return () => clearTimeout(t); }
    if (!showBubble) return;
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [typingDone, showBubble]);

  const options = [
    {
      val: true,
      title: "Sim, eu alterno os locais",
      sub: "Troco entre áreas para variar as aplicações",
    },
    {
      val: false,
      title: "Não, uso sempre o mesmo local",
      sub: "Costumo aplicar sempre na mesma região",
    },
  ];

  return (
    <div className="flex-1 flex flex-col px-6">
      <h1 className="text-xl font-extrabold text-foreground text-center mt-4 mb-4">
        Você alterna o local de aplicação entre as doses?
      </h1>

      {/* Mascot + Bubble */}
      <div className="flex items-end gap-3 mb-5">
        <div className="shrink-0">
          <img
            src={mascotImg}
            alt="Mounjá"
            className="w-16 h-auto object-contain transition-all duration-700 ease-out"
            style={{
              opacity: mascotVisible ? 1 : 0,
              transform: mascotVisible ? "translateY(0)" : "translateY(20px)",
              filter: "drop-shadow(0 4px 12px hsl(280 40% 30% / 0.10))",
              background: "transparent",
            }}
            onLoad={() => setMascotLoaded(true)}
          />
        </div>
        <div
          className="transition-all duration-500 ease-out flex-1"
          style={{ opacity: showBubble ? 1 : 0, transform: showBubble ? "translateY(0)" : "translateY(12px)" }}
        >
          <div className="bg-card rounded-2xl px-4 py-3 shadow-card border border-border/40 relative">
            <p className="text-[0.82rem] text-foreground leading-relaxed min-h-[1.3em]">
              {displayed}
              {showCursor && !typingDone && (
                <span className="inline-block w-[2px] h-[0.82em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
              )}
            </p>
            <div className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45" style={{ bottom: 10, left: -5 }} />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = value === opt.val;
          return (
            <button
              key={String(opt.val)}
              onClick={() => onChange(opt.val)}
              className="w-full text-left relative rounded-2xl p-5 transition-all duration-300"
              style={{
                boxShadow: isSelected
                  ? "0 0 18px hsl(340 65% 62% / 0.15)"
                  : "0 1px 6px hsl(0 0% 0% / 0.05)",
              }}
            >
              {/* Background */}
              <div className="absolute inset-0 rounded-2xl bg-card border border-border/50" />
              {/* Gradient border */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    padding: 2,
                    background: GRADIENT,
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
              )}

              <div className="relative z-10 flex items-start gap-3">
                {/* Radio */}
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300"
                  style={{
                    borderColor: isSelected ? "transparent" : "hsl(0 0% 78%)",
                    background: isSelected ? GRADIENT : "transparent",
                  }}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-foreground text-[0.95rem]">{opt.title}</span>
                  <p className="text-sm text-muted-foreground mt-0.5">{opt.sub}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Micro feedback */}
      {value === false && (
        <p
          className="text-xs text-muted-foreground text-center mt-4 px-4"
          style={{ animation: "fadeUp 0.3s ease-out" }}
        >
          💡 Você pode considerar alternar para maior conforto
        </p>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AlternateSitesStep;
