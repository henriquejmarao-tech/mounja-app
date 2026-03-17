import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import mascotThinkingImg from "@/assets/mascot-thinking.png";

const BUBBLE_LINE1 = "Quero entender melhor você antes da gente começar.";
const BUBBLE_LINE2 = "O que te fez iniciar esse tratamento?";
const TYPING_DURATION_L1 = 1400;
const TYPING_DURATION_L2 = 1100;

interface MotivationOption {
  value: string;
  label: string;
  description: string;
}

interface MotivationStepProps {
  options: MotivationOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

const MotivationStep = ({ options, selected, onToggle }: MotivationStepProps) => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [displayedLine1, setDisplayedLine1] = useState("");
  const [displayedLine2, setDisplayedLine2] = useState("");
  const [typingLine, setTypingLine] = useState<0 | 1 | 2 | 3>(0); // 0=waiting, 1=line1, 2=line2, 3=done
  const [showOptions, setShowOptions] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Sequence: mascot loads → fade in → bubble → type line1 → type line2 → show options
  useEffect(() => {
    if (!mascotLoaded) return;
    const t1 = setTimeout(() => setMascotVisible(true), 100);
    const t2 = setTimeout(() => {
      setShowBubble(true);
      setTypingLine(1);
    }, 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mascotLoaded]);

  // Type line 1
  useEffect(() => {
    if (typingLine !== 1) return;
    const charDelay = TYPING_DURATION_L1 / BUBBLE_LINE1.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedLine1(BUBBLE_LINE1.slice(0, i));
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
    const charDelay = TYPING_DURATION_L2 / BUBBLE_LINE2.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedLine2(BUBBLE_LINE2.slice(0, i));
      if (i >= BUBBLE_LINE2.length) {
        clearInterval(intervalRef.current);
        setTypingLine(3);
        setTimeout(() => setShowOptions(true), 200);
      }
    }, charDelay);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  // Cursor blink
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
    <div
      className="flex-1 flex flex-col overflow-y-auto relative"
      style={{
        background: "linear-gradient(135deg, hsl(280 50% 30%) 0%, hsl(320 55% 40%) 35%, hsl(350 60% 55%) 65%, hsl(20 70% 65%) 100%)",
      }}
    >
      {/* Soft glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 30% 80%, hsl(295 55% 42% / 0.3) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-5 pt-4 pb-6">
        {/* Speech bubble */}
        <div
          className="transition-all duration-500 mb-4"
          style={{
            opacity: showBubble ? 1 : 0,
            transform: showBubble ? "translateY(0)" : "translateY(12px)",
          }}
        >
          <div
            className="rounded-2xl px-5 py-4 relative"
            style={{
              background: "hsl(0 0% 100% / 0.92)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px hsl(280 50% 20% / 0.15), 0 2px 8px hsl(0 0% 0% / 0.06)",
            }}
          >
            <p className="text-[0.92rem] text-foreground leading-relaxed min-h-[1.6em]">
              {displayedLine1}
            </p>
            {(typingLine >= 2) && (
              <p className="text-[0.95rem] font-bold text-foreground leading-relaxed mt-1.5 min-h-[1.6em]">
                {displayedLine2}
                {showCursor && typingLine < 3 && (
                  <span className="inline-block w-[2px] h-[0.95em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </p>
            )}
            {typingLine < 2 && showCursor && (
              <span className="inline-block w-[2px] h-[0.92em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
            )}
            {/* Tail */}
            <div
              className="absolute w-3.5 h-3.5 rotate-45"
              style={{
                bottom: -6,
                left: 40,
                background: "hsl(0 0% 100% / 0.92)",
                boxShadow: "4px 4px 8px hsl(280 50% 20% / 0.08)",
              }}
            />
          </div>
        </div>

        {/* Mascot */}
        <div
          className="flex justify-start pl-2 mb-4 transition-all duration-700"
          style={{
            opacity: mascotVisible ? 1 : 0,
            transform: mascotVisible ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <img
            src={mascotThinkingImg}
            alt="Mounjá pensando"
            className="w-28 h-auto object-contain"
            style={{ background: "none" }}
            onLoad={() => setMascotLoaded(true)}
          />
        </div>

        {/* Options */}
        <div className="space-y-3 flex-1">
          {options.map((opt, idx) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => onToggle(opt.value)}
                className={cn(
                  "w-full py-4 px-5 rounded-2xl text-left transition-all duration-300 active:scale-[0.98] relative overflow-hidden",
                )}
                style={{
                  opacity: showOptions ? 1 : 0,
                  transform: showOptions ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: `${idx * 80}ms`,
                  background: isSelected
                    ? "hsl(0 0% 100% / 0.95)"
                    : "hsl(0 0% 100% / 0.15)",
                  backdropFilter: "blur(16px)",
                  boxShadow: isSelected
                    ? "0 4px 20px hsl(280 50% 30% / 0.2), 0 2px 8px hsl(0 0% 0% / 0.06)"
                    : "0 2px 12px hsl(0 0% 0% / 0.08)",
                  border: isSelected
                    ? "2px solid transparent"
                    : "1px solid hsl(0 0% 100% / 0.25)",
                }}
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

                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "font-semibold text-[0.92rem] leading-snug",
                      isSelected ? "text-foreground" : "text-white"
                    )}
                  >
                    {opt.label}
                  </span>
                  <div
                    className={cn(
                      "w-6 h-6 min-w-6 rounded-full flex items-center justify-center transition-all duration-200",
                      isSelected ? "" : "border-2 border-white/40"
                    )}
                    style={
                      isSelected
                        ? { background: "linear-gradient(135deg, hsl(15 75% 75%), hsl(340 65% 62%), hsl(295 55% 42%))" }
                        : undefined
                    }
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                </div>
                {isSelected && (
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed animate-fade-in">
                    {opt.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MotivationStep;
