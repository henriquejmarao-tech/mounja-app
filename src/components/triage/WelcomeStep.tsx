import { useState, useEffect, useRef } from "react";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const FULL_TEXT = "Tudo que você precisa para o seu tratamento";
const TYPING_DURATION = 1500;

const WelcomeStep = () => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [doneTyping, setDoneTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Start typing only after mascot image has loaded
  useEffect(() => {
    if (!mascotLoaded) return;
    const charDelay = TYPING_DURATION / FULL_TEXT.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedText(FULL_TEXT.slice(0, i));
      if (i >= FULL_TEXT.length) {
        clearInterval(intervalRef.current);
        setDoneTyping(true);
      }
    }, charDelay);
    return () => clearInterval(intervalRef.current);
  }, [mascotLoaded]);

  useEffect(() => {
    if (doneTyping) {
      const t = setTimeout(() => setShowCursor(false), 1200);
      return () => clearTimeout(t);
    }
    if (!mascotLoaded) return;
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [doneTyping, mascotLoaded]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
      {/* Soft radial glow behind mascot */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 320,
          height: 320,
          top: "52%",
          left: "50%",
          transform: "translate(-50%, -30%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, hsl(15 75% 75% / 0.10) 0%, hsl(340 65% 62% / 0.06) 40%, hsl(295 55% 42% / 0.03) 70%, transparent 100%)",
          filter: "blur(40px)",
        }}
      />

      {/* Speech bubble — only visible after mascot loads */}
      <div
        className="relative ml-4 max-w-[260px] transition-opacity duration-300"
        style={{ marginBottom: 20, opacity: mascotLoaded ? 1 : 0 }}
      >
        <div className="bg-card rounded-2xl px-5 py-4 shadow-card border border-border/40">
          <p className="text-[1.05rem] font-bold text-foreground leading-snug min-h-[3.2em]">
            {displayedText}
            {showCursor && mascotLoaded && (
              <span className="inline-block w-[2px] h-[1.05em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
            )}
          </p>
        </div>
        <div
          className="absolute w-3.5 h-3.5 bg-card border-r border-b border-border/40 rotate-45"
          style={{ bottom: -6, left: 36 }}
        />
      </div>

      {/* Mascot */}
      <img
        src={mascotPointingImg}
        alt="Mounjá"
        className="w-52 h-auto object-contain relative z-10 transition-opacity duration-300"
        style={{ marginBottom: 48, background: "none", opacity: mascotLoaded ? 1 : 0 }}
        onLoad={() => setMascotLoaded(true)}
      />
    </div>
  );
};

export default WelcomeStep;
