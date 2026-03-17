import { useState, useEffect, useRef } from "react";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const BUBBLE_LINE1 = "Perfeito, agora vamos organizar tudo direitinho.";
const BUBBLE_LINE2 = "Só preciso entender um pouco mais sobre o seu tratamento.";
const TYPING_L1 = 1200;
const TYPING_L2 = 1400;

const TreatmentIntroStep = () => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showMicro, setShowMicro] = useState(false);
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
      if (i >= BUBBLE_LINE2.length) { clearInterval(intervalRef.current); setTypingLine(3); setTimeout(() => setShowMicro(true), 300); }
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
    <div className="flex-1 flex flex-col px-6">
      <div className="flex-1 flex flex-col justify-center">
        {/* Speech bubble */}
        <div
          className="mb-5 ml-2 transition-all duration-500 ease-out"
          style={{ opacity: showBubble ? 1 : 0, transform: showBubble ? "translateY(0)" : "translateY(12px)" }}
        >
          <div className="bg-card rounded-2xl px-5 py-4 shadow-card border border-border/40 max-w-[300px] relative">
            <p className="text-[0.88rem] text-foreground leading-relaxed min-h-[1.4em]">{displayedL1}</p>
            {typingLine >= 2 && (
              <p className="text-[0.92rem] font-bold text-foreground leading-relaxed mt-1.5 min-h-[1.4em]">
                {displayedL2}
                {showCursor && typingLine < 3 && (
                  <span className="inline-block w-[2px] h-[0.92em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </p>
            )}
            {typingLine < 2 && showCursor && typingLine > 0 && (
              <span className="inline-block w-[2px] h-[0.88em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
            )}
            {/* Tail */}
            <div
              className="absolute w-3.5 h-3.5 bg-card border-r border-b border-border/40 rotate-45"
              style={{ bottom: -6, left: 40 }}
            />
          </div>
        </div>

        {/* Mascot */}
        <div className="flex justify-start pl-4 relative">
          <div
            className="absolute pointer-events-none"
            style={{
              width: 140, height: 140, bottom: -10, left: 20, borderRadius: "50%",
              background: "radial-gradient(circle, hsl(15 75% 75% / 0.07) 0%, transparent 70%)",
              filter: "blur(25px)",
            }}
          />
          <img
            src={mascotPointingImg}
            alt="Mounjá"
            className="w-28 h-auto object-contain relative z-10 transition-all duration-700 ease-out"
            style={{
              background: "transparent",
              opacity: mascotVisible ? 1 : 0,
              transform: mascotVisible ? "translateY(0)" : "translateY(20px)",
              filter: "drop-shadow(0 4px 12px hsl(280 40% 30% / 0.10))",
            }}
            onLoad={() => setMascotLoaded(true)}
          />
        </div>

        {/* Micro text */}
        <p
          className="text-xs text-muted-foreground text-center mt-6 transition-all duration-500"
          style={{ opacity: showMicro ? 1 : 0, transform: showMicro ? "translateY(0)" : "translateY(8px)" }}
        >
          Isso leva menos de 1 minuto ⏱️
        </p>
      </div>
    </div>
  );
};

export default TreatmentIntroStep;
