import { useState, useEffect, useRef } from "react";
import { Clock, Calendar, TrendingUp, Rocket, Search, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const BUBBLE_TEXT = "Isso me ajuda a entender seu progresso.";
const TYPING_DURATION = 1200;

interface ExperienceOption {
  value: string;
  label: string;
}

interface ExperienceStepProps {
  medication: string;
  options: ExperienceOption[];
  selected: string;
  onSelect: (value: string) => void;
}

const optionIcons = [Rocket, Clock, Calendar, TrendingUp, Sparkles, Search];

const ExperienceStep = ({ medication, options, selected, onSelect }: ExperienceStepProps) => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [doneTyping, setDoneTyping] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Sequence: mascot loads → fade in → bubble → type → show options
  useEffect(() => {
    if (!mascotLoaded) return;
    const t1 = setTimeout(() => setMascotVisible(true), 100);
    const t2 = setTimeout(() => setShowBubble(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [mascotLoaded]);

  useEffect(() => {
    if (!showBubble) return;
    const charDelay = TYPING_DURATION / BUBBLE_TEXT.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedText(BUBBLE_TEXT.slice(0, i));
      if (i >= BUBBLE_TEXT.length) {
        clearInterval(intervalRef.current);
        setDoneTyping(true);
        setTimeout(() => setShowOptions(true), 200);
      }
    }, charDelay);
    return () => clearInterval(intervalRef.current);
  }, [showBubble]);

  useEffect(() => {
    if (doneTyping) {
      const t = setTimeout(() => setShowCursor(false), 1000);
      return () => clearTimeout(t);
    }
    if (!showBubble) return;
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [doneTyping, showBubble]);

  return (
    <div className="flex-1 flex flex-col px-6 overflow-y-auto">
      {/* Title */}
      <h1 className="text-[1.4rem] font-extrabold text-foreground text-center mt-4 mb-5 leading-tight tracking-tight font-display">
        Há quanto tempo você usa {medication || "seu medicamento"}?
      </h1>

      {/* Mascot + bubble */}
      <div className="flex items-end gap-2 mb-5 relative">
        {/* Subtle glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 140,
            height: 140,
            bottom: 0,
            left: 16,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, hsl(15 75% 75% / 0.07) 0%, hsl(340 65% 62% / 0.03) 50%, transparent 80%)",
            filter: "blur(25px)",
          }}
        />

        {/* Mascot with entrance animation */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: mascotVisible ? 1 : 0,
            transform: mascotVisible ? "translateY(0)" : "translateY(16px)",
          }}
        >
          <img
            src={mascotPointingImg}
            alt="Mounjá"
            className="w-20 h-auto object-contain relative z-10"
            style={{ background: "none" }}
            onLoad={() => setMascotLoaded(true)}
          />
        </div>

        {/* Speech bubble */}
        <div
          className="relative flex-1 transition-all duration-500 ease-out"
          style={{
            opacity: showBubble ? 1 : 0,
            transform: showBubble ? "translateY(0)" : "translateY(8px)",
          }}
        >
          <div className="bg-card rounded-2xl px-4 py-3 shadow-card border border-border/40">
            <p className="text-[0.85rem] font-semibold text-foreground leading-snug min-h-[2em]">
              {displayedText}
              {showCursor && showBubble && !doneTyping && (
                <span className="inline-block w-[2px] h-[0.85em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
              )}
            </p>
          </div>
          {/* Tail */}
          <div
            className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45"
            style={{ bottom: 10, left: -5 }}
          />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const isSelected = selected === opt.value;
          const Icon = optionIcons[idx % optionIcons.length];
          return (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className={cn(
                "w-full py-3.5 px-4 rounded-2xl text-[0.92rem] font-semibold transition-all duration-200 active:scale-[0.98] flex items-center gap-3 relative overflow-hidden",
                isSelected
                  ? "bg-card text-foreground shadow-elevated"
                  : "bg-card text-foreground shadow-card border border-border/40"
              )}
              style={{
                opacity: showOptions ? 1 : 0,
                transform: showOptions ? "translateY(0)" : "translateY(12px)",
                transitionDelay: `${idx * 60}ms`,
                transitionProperty: "opacity, transform, box-shadow",
                transitionDuration: "400ms",
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

              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isSelected ? "text-primary" : "text-muted-foreground/40"
                )}
                strokeWidth={1.8}
              />
              <span className="flex-1 text-left">{opt.label}</span>
              {isSelected && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center animate-scale-in"
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

export default ExperienceStep;
