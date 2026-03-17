import { useState, useEffect, useRef } from "react";
import { Syringe, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const BUBBLE_TEXT = "Qual desses você está usando agora?";
const TYPING_DURATION = 1200;

interface MedicationStepProps {
  medications: string[];
  selected: string;
  onSelect: (med: string) => void;
}

const MedicationStep = ({ medications, selected, onSelect }: MedicationStepProps) => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [doneTyping, setDoneTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!mascotLoaded) return;
    const charDelay = TYPING_DURATION / BUBBLE_TEXT.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedText(BUBBLE_TEXT.slice(0, i));
      if (i >= BUBBLE_TEXT.length) {
        clearInterval(intervalRef.current);
        setDoneTyping(true);
      }
    }, charDelay);
    return () => clearInterval(intervalRef.current);
  }, [mascotLoaded]);

  useEffect(() => {
    if (doneTyping) {
      const t = setTimeout(() => setShowCursor(false), 1000);
      return () => clearTimeout(t);
    }
    if (!mascotLoaded) return;
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [doneTyping, mascotLoaded]);

  return (
    <div className="flex-1 flex flex-col px-6 overflow-y-auto">
      {/* Mascot + bubble area */}
      <div className="flex items-end gap-2 mt-2 mb-5 relative">
        {/* Subtle glow behind mascot */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 160,
            height: 160,
            bottom: 0,
            left: 20,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, hsl(15 75% 75% / 0.08) 0%, hsl(340 65% 62% / 0.04) 50%, transparent 80%)",
            filter: "blur(25px)",
          }}
        />

        {/* Mascot */}
        <img
          src={mascotPointingImg}
          alt="Mounjá"
          className="w-24 h-auto object-contain relative z-10 transition-opacity duration-300"
          style={{ opacity: mascotLoaded ? 1 : 0, background: "none" }}
          onLoad={() => setMascotLoaded(true)}
        />

        {/* Speech bubble */}
        <div
          className="relative flex-1 transition-opacity duration-300"
          style={{ opacity: mascotLoaded ? 1 : 0 }}
        >
          <div className="bg-card rounded-2xl px-4 py-3 shadow-card border border-border/40">
            <p className="text-sm font-semibold text-foreground leading-snug min-h-[2.4em]">
              {displayedText}
              {showCursor && mascotLoaded && (
                <span className="inline-block w-[2px] h-[0.9em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
              )}
            </p>
          </div>
          {/* Tail pointing to mascot */}
          <div
            className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45"
            style={{ bottom: 10, left: -5 }}
          />
        </div>
      </div>

      {/* Medication options */}
      <div className="space-y-3">
        {medications.map((med) => {
          const isSelected = selected === med;
          return (
            <button
              key={med}
              onClick={() => onSelect(med)}
              className={cn(
                "w-full py-4 px-5 rounded-2xl text-base font-semibold transition-all duration-200 active:scale-[0.98] flex items-center gap-3 relative overflow-hidden",
                isSelected
                  ? "bg-card text-foreground shadow-elevated"
                  : "bg-card text-foreground shadow-card border border-border/40"
              )}
            >
              {/* Gradient border for selected */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    padding: 2,
                    background: "linear-gradient(135deg, hsl(15 75% 75%), hsl(340 65% 62%), hsl(295 55% 42%))",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
              )}

              <Syringe
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground/50"
                )}
                strokeWidth={1.8}
              />
              <span className="flex-1 text-left">{med}</span>
              {isSelected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, hsl(15 75% 75%), hsl(340 65% 62%), hsl(295 55% 42%))",
                  }}
                >
                  <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MedicationStep;
