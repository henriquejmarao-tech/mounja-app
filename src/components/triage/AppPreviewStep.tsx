import { useState, useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const BUBBLE_LINE1 = "Eu vou te ajudar a organizar tudo isso.";
const BUBBLE_LINE2 = "E te mostrar exatamente o que está acontecendo com o seu corpo.";
const TYPING_L1 = 1200;
const TYPING_L2 = 1400;

const benefits = [
  "Registre suas doses e nunca mais tenha dúvidas sobre sua rotina",
  "Veja seu progresso ao longo do tempo com peso, apetite e energia",
  "Fique à frente dos efeitos colaterais acompanhando padrões e tendências",
];

const AppPreviewStep = () => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
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

  // Type line 1
  useEffect(() => {
    if (typingLine !== 1) return;
    const charDelay = TYPING_L1 / BUBBLE_LINE1.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedL1(BUBBLE_LINE1.slice(0, i));
      if (i >= BUBBLE_LINE1.length) {
        clearInterval(intervalRef.current);
        setTimeout(() => setTypingLine(2), 300);
      }
    }, charDelay);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  // Type line 2
  useEffect(() => {
    if (typingLine !== 2) return;
    const charDelay = TYPING_L2 / BUBBLE_LINE2.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedL2(BUBBLE_LINE2.slice(0, i));
      if (i >= BUBBLE_LINE2.length) {
        clearInterval(intervalRef.current);
        setTypingLine(3);
        setTimeout(() => setShowBenefits(true), 200);
      }
    }, charDelay);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  // Cursor
  useEffect(() => {
    if (typingLine === 3) {
      const t = setTimeout(() => setShowCursor(false), 1000);
      return () => clearTimeout(t);
    }
    if (typingLine === 0) return;
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [typingLine]);

  return (
    <div className="flex-1 flex flex-col px-6 overflow-y-auto">
      {/* Calendar card */}
      <div className="bg-card rounded-3xl shadow-elevated p-6 w-full max-w-xs mx-auto mb-4 mt-2">
        <p className="text-center font-semibold text-foreground mb-3">
          {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
        </p>
        <div className="flex justify-center gap-3 mb-4">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i} className="text-center">
              <span className="text-[10px] text-muted-foreground">{d}</span>
              <div
                className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs mt-1",
                  i === 3 ? "text-primary-foreground font-bold" : "text-muted-foreground")}
                style={i === 3 ? { background: "linear-gradient(135deg, hsl(295 55% 42%), hsl(340 65% 62%), hsl(15 75% 75%))" } : undefined}
              >
                {new Date().getDate() - 3 + i}
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">Próximo tratamento</p>
        <p className="text-center text-4xl font-bold text-foreground">3 dias</p>
      </div>

      {/* Mascot + bubble */}
      <div className="flex items-end gap-2 mb-4 relative">
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
            <p className="text-[0.82rem] text-foreground leading-snug min-h-[1.4em]">
              {displayedL1}
            </p>
            {typingLine >= 2 && (
              <p className="text-[0.85rem] font-semibold text-foreground leading-snug mt-1 min-h-[1.4em]">
                {displayedL2}
                {showCursor && typingLine < 3 && (
                  <span className="inline-block w-[2px] h-[0.85em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </p>
            )}
            {typingLine < 2 && showCursor && typingLine > 0 && (
              <span className="inline-block w-[2px] h-[0.82em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
            )}
          </div>
          <div
            className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45"
            style={{ bottom: 10, left: -5 }}
          />
        </div>
      </div>

      {/* Benefits */}
      <div className="space-y-3 w-full">
        {benefits.map((text, i) => (
          <div
            key={i}
            className="flex items-start gap-3 transition-all duration-500 ease-out"
            style={{
              opacity: showBenefits ? 1 : 0,
              transform: showBenefits ? "translateY(0)" : "translateY(12px)",
              transitionDelay: `${i * 120}ms`,
            }}
            >
              <svg className="w-5 h-5 min-w-5 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="url(#grad-check)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="grad-check" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(295 55% 42%)" />
                    <stop offset="50%" stopColor="hsl(340 65% 62%)" />
                    <stop offset="100%" stopColor="hsl(15 75% 75%)" />
                  </linearGradient>
                </defs>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppPreviewStep;
