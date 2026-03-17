import { useState, useEffect, useRef } from "react";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const BUBBLE_LINE1 = "Perfeito, já entendi o que você precisa.";
const BUBBLE_LINE2 = "Agora vou te ajudar exatamente nisso:";
const TYPING_L1 = 1100;
const TYPING_L2 = 1000;

const confirmItems = [
  "Acompanhar seu tratamento facilmente e construir uma rotina que funcione para você.",
  "Ver seu progresso se desenrolar e manter o rumo certo.",
  "Ficar à frente dos efeitos colaterais e encontrar o que ajuda.",
];

const ConfirmationStep = () => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [displayedL1, setDisplayedL1] = useState("");
  const [displayedL2, setDisplayedL2] = useState("");
  const [typingLine, setTypingLine] = useState<0 | 1 | 2 | 3>(0);
  const [showCursor, setShowCursor] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!mascotLoaded) return;
    const t1 = setTimeout(() => setMascotVisible(true), 100);
    const t2 = setTimeout(() => { setShowBubble(true); setTypingLine(1); }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mascotLoaded]);

  useEffect(() => {
    if (typingLine !== 1) return;
    const d = TYPING_L1 / BUBBLE_LINE1.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++; setDisplayedL1(BUBBLE_LINE1.slice(0, i));
      if (i >= BUBBLE_LINE1.length) { clearInterval(intervalRef.current); setTimeout(() => setTypingLine(2), 300); }
    }, d);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  useEffect(() => {
    if (typingLine !== 2) return;
    const d = TYPING_L2 / BUBBLE_LINE2.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++; setDisplayedL2(BUBBLE_LINE2.slice(0, i));
      if (i >= BUBBLE_LINE2.length) { clearInterval(intervalRef.current); setTypingLine(3); setTimeout(() => setShowItems(true), 200); }
    }, d);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  useEffect(() => {
    if (typingLine === 3) { const t = setTimeout(() => setShowCursor(false), 1000); return () => clearTimeout(t); }
    if (typingLine === 0) return;
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [typingLine]);

  return (
    <div className="flex-1 flex flex-col px-6 overflow-y-auto">
      {/* Mascot + bubble */}
      <div className="flex items-end gap-2 mb-6 mt-4 relative">
        <div
          className="absolute pointer-events-none"
          style={{
            width: 120, height: 120, bottom: 0, left: 12, borderRadius: "50%",
            background: "radial-gradient(circle, hsl(15 75% 75% / 0.06) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
        <img
          src={mascotPointingImg}
          alt="Mounjá"
          className="w-[72px] h-auto object-contain relative z-10 transition-all duration-700 ease-out"
          style={{
            background: "transparent",
            opacity: mascotVisible ? 1 : 0,
            transform: mascotVisible ? "translateY(0)" : "translateY(16px)",
            filter: "drop-shadow(0 4px 10px hsl(280 40% 30% / 0.10))",
          }}
          onLoad={() => setMascotLoaded(true)}
        />
        <div
          className="relative flex-1 transition-all duration-500 ease-out"
          style={{ opacity: showBubble ? 1 : 0, transform: showBubble ? "translateY(0)" : "translateY(8px)" }}
        >
          <div className="bg-card rounded-2xl px-4 py-3 shadow-card border border-border/40">
            <p className="text-[0.85rem] text-foreground leading-snug min-h-[1.4em]">{displayedL1}</p>
            {typingLine >= 2 && (
              <p className="text-[0.88rem] font-semibold text-foreground leading-snug mt-1 min-h-[1.4em]">
                {displayedL2}
                {showCursor && typingLine < 3 && (
                  <span className="inline-block w-[2px] h-[0.88em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </p>
            )}
            {typingLine < 2 && showCursor && typingLine > 0 && (
              <span className="inline-block w-[2px] h-[0.85em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
            )}
          </div>
          <div className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45" style={{ bottom: 10, left: -5 }} />
        </div>
      </div>

      {/* Confirmation items */}
      <div className="space-y-5 w-full flex-1">
        {confirmItems.map((text, i) => (
          <div
            key={i}
            className="flex items-start gap-3.5 transition-all duration-500 ease-out"
            style={{
              opacity: showItems ? 1 : 0,
              transform: showItems ? "translateY(0)" : "translateY(12px)",
              transitionDelay: `${i * 150}ms`,
            }}
          >
            <svg className="w-6 h-6 min-w-6 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="url(#grad-confirm)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="grad-confirm" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(295, 55%, 42%)" />
                  <stop offset="50%" stopColor="hsl(340, 65%, 62%)" />
                  <stop offset="100%" stopColor="hsl(15, 75%, 75%)" />
                </linearGradient>
              </defs>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="m9 11 3 3L22 4" />
            </svg>
            <p className="text-[0.92rem] text-foreground/80 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfirmationStep;
