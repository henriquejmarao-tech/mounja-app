import { useEffect, useState, useRef } from "react";
import { useTutorial } from "@/hooks/useTutorial";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

const TutorialOverlay = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTutorial, closeTutorial } = useTutorial();
  const navigate = useNavigate();
  const location = useLocation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [navigating, setNavigating] = useState(false);
  const timerRef = useRef<any>(null);

  const step = steps[currentStep];

  // Navigate to the correct page for current step
  useEffect(() => {
    if (!isActive || !step) return;
    if (location.pathname !== step.page) {
      setNavigating(true);
      navigate(step.page);
    }
  }, [isActive, step, location.pathname, navigate]);

  // Find and highlight the target element
  useEffect(() => {
    if (!isActive || !step) return;

    const findTarget = () => {
      if (!step.targetSelector) {
        setTargetRect(null);
        setNavigating(false);
        return;
      }
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        setNavigating(false);
      } else {
        setTargetRect(null);
      }
    };

    // Small delay to let page render
    timerRef.current = setTimeout(findTarget, 400);
    return () => clearTimeout(timerRef.current);
  }, [isActive, step, currentStep, location.pathname]);

  if (!isActive || !step) return null;

  const isLast = currentStep === steps.length - 1;
  const padding = 8;

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

    const pos = step.position || "bottom";
    switch (pos) {
      case "bottom":
        return { top: targetRect.bottom + padding + 8, left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 300)), maxWidth: "calc(100vw - 32px)" };
      case "top":
        return { bottom: window.innerHeight - targetRect.top + padding + 8, left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 300)), maxWidth: "calc(100vw - 32px)" };
      default:
        return { top: targetRect.bottom + padding + 8, left: 16, maxWidth: "calc(100vw - 32px)" };
    }
  };

  return (
    <div className="fixed inset-0 z-[100]" onClick={closeTutorial}>
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tutorial-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - padding}
                y={targetRect.top - padding}
                width={targetRect.width + padding * 2}
                height={targetRect.height + padding * 2}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%" 
          fill="rgba(0,0,0,0.6)" 
          mask="url(#tutorial-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={closeTutorial}
        />
      </svg>

      {/* Highlight border */}
      {targetRect && (
        <div
          className="absolute border-2 border-primary rounded-2xl pointer-events-none animate-pulse"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
          }}
        />
      )}

      {/* Tooltip */}
      {!navigating && (
        <div
          className="absolute bg-card rounded-2xl shadow-elevated border border-border/50 p-4 z-[101] animate-fade-in-up"
          style={getTooltipStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep ? "w-6 gradient-hero" : i < currentStep ? "w-3 bg-primary/30" : "w-3 bg-muted"
                  )}
                />
              ))}
            </div>
            <button onClick={skipTutorial} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <h3 className="font-bold text-sm mb-1">{step.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Voltar
            </button>

            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 gradient-hero text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
            >
              {isLast ? "Concluir" : "Próximo"}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorialOverlay;
