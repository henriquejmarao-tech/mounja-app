import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import mascotPointingImg from "@/assets/mascot-pointing.png";

const BUBBLE_LINE1 = "Agora me conta uma coisa importante.";
const BUBBLE_LINE2 = "Onde você mais quer ajuda no seu tratamento?";
const TYPING_L1 = 1100;
const TYPING_L2 = 1200;

interface HelpOption {
  value: string;
  label: string;
  highlight?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface HelpNeedsStepProps {
  options: HelpOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

const HelpNeedsStep = ({ options, selected, onToggle }: HelpNeedsStepProps) => {
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
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
      i++;
      setDisplayedL1(BUBBLE_LINE1.slice(0, i));
      if (i >= BUBBLE_LINE1.length) { clearInterval(intervalRef.current); setTimeout(() => setTypingLine(2), 300); }
    }, d);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  useEffect(() => {
    if (typingLine !== 2) return;
    const d = TYPING_L2 / BUBBLE_LINE2.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayedL2(BUBBLE_LINE2.slice(0, i));
      if (i >= BUBBLE_LINE2.length) { clearInterval(intervalRef.current); setTypingLine(3); setTimeout(() => setShowOptions(true), 200); }
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
    <div className="flex-1 flex flex-col px-5 overflow-y-auto">
      {/* Mascot + bubble */}
      <div className="flex items-end gap-2 mb-4 mt-2 relative">
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
          className="w-[68px] h-auto object-contain relative z-10 transition-all duration-700 ease-out"
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
            <p className="text-[0.82rem] text-foreground leading-snug min-h-[1.4em]">{displayedL1}</p>
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
          <div className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45" style={{ bottom: 10, left: -5 }} />
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-xs text-muted-foreground text-center mb-3">Escolha quantas quiser</p>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {options.map((opt, idx) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={cn(
                "flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl transition-all duration-200 active:scale-[0.97] text-center relative overflow-hidden",
                isSelected
                  ? "bg-card shadow-elevated"
                  : "bg-card shadow-card border border-border/40"
              )}
              style={{
                opacity: showOptions ? 1 : 0,
                transform: showOptions ? "translateY(0) scale(1)" : "translateY(12px) scale(0.98)",
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
                    background: "linear-gradient(135deg, hsl(295 55% 42%), hsl(340 65% 62%), hsl(15 75% 75%))",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
              )}

              <opt.icon
                className={cn("w-6 h-6 transition-colors", isSelected ? "text-primary" : "text-muted-foreground/50")}
                strokeWidth={1.6}
              />
              <span className="text-xs font-semibold text-foreground leading-tight">{opt.label}</span>

              {isSelected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center animate-scale-in"
                  style={{ background: "linear-gradient(135deg, hsl(295 55% 42%), hsl(340 65% 62%), hsl(15 75% 75%))" }}
                >
                  <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HelpNeedsStep;
