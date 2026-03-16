import { useState, useEffect, useRef } from "react";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const FULL_TEXT = "Tudo que você precisa para o seu tratamento";
const TYPING_DURATION = 1500; // ms

const WelcomeStep = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [doneTyping, setDoneTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
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
  }, []);

  // Blink cursor
  useEffect(() => {
    if (doneTyping) {
      const t = setTimeout(() => setShowCursor(false), 1200);
      return () => clearTimeout(t);
    }
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [doneTyping]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      {/* Speech bubble */}
      <div className="relative bg-card rounded-2xl px-6 py-5 shadow-card border border-border/50 max-w-[300px] mb-4">
        <p className="text-lg font-bold text-foreground leading-snug min-h-[3.6em]">
          {displayedText}
          {showCursor && (
            <span className="inline-block w-[2px] h-[1.1em] bg-foreground/60 ml-0.5 align-text-bottom animate-pulse" />
          )}
        </p>
        {/* Bubble tail */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-r border-b border-border/50 rotate-45" />
      </div>

      {/* Mascot */}
      <img
        src={mascotPointingImg}
        alt="Mounjá mascot"
        className="w-56 h-auto object-contain drop-shadow-lg"
      />
    </div>
  );
};

export default WelcomeStep;
