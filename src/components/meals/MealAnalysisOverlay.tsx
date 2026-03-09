import { useState, useEffect, useRef } from "react";
import { Flame, Beef, Leaf, Sparkles, Check } from "lucide-react";

interface AnalysisResult {
  description?: string;
  total_calories?: number;
  total_protein?: number;
  total_fiber?: number;
  items?: { name: string; calories: number; protein: number; fiber: number }[];
  tip?: string;
}

interface MealAnalysisOverlayProps {
  photoPreview: string;
  analyzing: boolean;
  result: AnalysisResult | null;
  onClose: () => void;
}

const STATUS_MESSAGES = [
  "Identificando alimentos...",
  "Analisando composição...",
  "Calculando macronutrientes...",
  "Estimando calorias...",
  "Finalizando análise...",
];

const MealAnalysisOverlay = ({ photoPreview, analyzing, result, onClose }: MealAnalysisOverlayProps) => {
  const [statusIdx, setStatusIdx] = useState(0);
  const [scanY, setScanY] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [counters, setCounters] = useState({ cal: 0, prot: 0, fib: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const scanRef = useRef<ReturnType<typeof setInterval>>();

  // Cycle status messages
  useEffect(() => {
    if (!analyzing) return;
    setStatusIdx(0);
    const id = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [analyzing]);

  // Scan line animation
  useEffect(() => {
    if (!analyzing) {
      setScanY(0);
      return;
    }
    let y = 0;
    let dir = 1;
    scanRef.current = setInterval(() => {
      y += dir * 1.5;
      if (y >= 100) dir = -1;
      if (y <= 0) dir = 1;
      setScanY(y);
    }, 25);
    return () => clearInterval(scanRef.current);
  }, [analyzing]);

  // Animate counters when result arrives
  useEffect(() => {
    if (!result) {
      setShowResult(false);
      setCounters({ cal: 0, prot: 0, fib: 0 });
      return;
    }

    const targetCal = result.total_calories || 0;
    const targetProt = result.total_protein || 0;
    const targetFib = result.total_fiber || 0;
    const duration = 1200;
    const steps = 40;
    let step = 0;

    setTimeout(() => setShowResult(true), 300);

    intervalRef.current = setInterval(() => {
      step++;
      const progress = Math.min(step / steps, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounters({
        cal: Math.round(targetCal * ease),
        prot: Math.round(targetProt * ease),
        fib: Math.round(targetFib * ease),
      });
      if (step >= steps) clearInterval(intervalRef.current);
    }, duration / steps);

    return () => clearInterval(intervalRef.current);
  }, [result]);

  return (
    <div className="fixed inset-0 z-[60] bg-black overflow-y-auto overscroll-contain">
      {/* Photo section - fixed height on top */}
      <div className="relative w-full" style={{ height: "45vh", minHeight: "280px" }}>
        <img
          src={photoPreview}
          alt="Meal"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

        {/* Scanning effect */}
        {analyzing && (
          <>
            <div
              className="absolute left-0 right-0 h-[2px] z-10 transition-none"
              style={{
                top: `${scanY}%`,
                background: "linear-gradient(90deg, transparent 0%, hsl(174, 80%, 50%) 20%, hsl(174, 90%, 70%) 50%, hsl(174, 80%, 50%) 80%, transparent 100%)",
                boxShadow: "0 0 20px 4px hsla(174, 80%, 50%, 0.5), 0 0 60px 8px hsla(174, 80%, 50%, 0.2)",
              }}
            />

            {/* Corner brackets */}
            <div className="absolute inset-6 z-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/70 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/70 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/70 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/70 rounded-br-lg" />
            </div>

            {/* Pulsing grid overlay */}
            <div
              className="absolute inset-0 z-[5] opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(hsla(174,80%,50%,1) 1px, transparent 1px), linear-gradient(90deg, hsla(174,80%,50%,1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                animation: "pulse 3s ease-in-out infinite",
              }}
            />
          </>
        )}

        {/* Status badge (analyzing) */}
        {analyzing && (
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-center" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
            <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/60 backdrop-blur-xl border border-primary/30">
              <div className="relative w-5 h-5">
                <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
              <span className="text-sm font-semibold text-white/90 transition-all duration-300">
                {STATUS_MESSAGES[statusIdx]}
              </span>
            </div>
          </div>
        )}

        {/* Success badge */}
        {result && showResult && (
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-center animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500/20 backdrop-blur-xl border border-emerald-400/40">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Análise concluída</span>
            </div>
          </div>
        )}

        {/* Floating particles during analysis */}
        {analyzing && (
          <div className="absolute inset-0 z-[8] pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-primary/60"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  animation: `float-particle ${2 + Math.random() * 3}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom content panel - scrollable */}
      <div className="relative z-30 bg-card rounded-t-[28px] -mt-6 min-h-[55vh]">
        <div className="px-5 pt-6" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
          {/* Analyzing state */}
          {analyzing && !result && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex gap-3">
                {[
                  { icon: Flame, label: "Calorias", color: "hsl(25, 85%, 55%)" },
                  { icon: Beef, label: "Proteína", color: "hsl(350, 50%, 42%)" },
                  { icon: Leaf, label: "Fibra", color: "hsl(145, 55%, 42%)" },
                ].map((m, i) => (
                  <div
                    key={m.label}
                    className="flex-1 rounded-2xl p-4 text-center animate-pulse"
                    style={{
                      background: `${m.color}08`,
                      border: `1px solid ${m.color}15`,
                      animationDelay: `${i * 200}ms`,
                    }}
                  >
                    <m.icon className="w-5 h-5 mx-auto mb-2" style={{ color: m.color, opacity: 0.5 }} />
                    <div className="h-6 w-12 mx-auto rounded-lg bg-muted/50 mb-1" />
                    <p className="text-[10px] text-muted-foreground/40 font-medium">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Result state */}
          {result && showResult && (
            <div className="space-y-4 animate-fade-in">
              {/* Description */}
              {result.description && (
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-foreground leading-snug">{result.description}</p>
                </div>
              )}

              {/* Macro cards with animated counters */}
              <div className="flex gap-3">
                {[
                  { icon: Flame, label: "Calorias", value: counters.cal, unit: "", color: "hsl(25, 85%, 55%)" },
                  { icon: Beef, label: "Proteína", value: counters.prot, unit: "g", color: "hsl(350, 50%, 42%)" },
                  { icon: Leaf, label: "Fibra", value: counters.fib, unit: "g", color: "hsl(145, 55%, 42%)" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex-1 rounded-2xl p-4 text-center"
                    style={{
                      background: `${m.color}08`,
                      border: `1px solid ${m.color}15`,
                    }}
                  >
                    <m.icon className="w-5 h-5 mx-auto mb-2" style={{ color: m.color }} />
                    <p className="text-xl font-extrabold tabular-nums" style={{ color: m.color }}>
                      {m.value}{m.unit}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{m.label}</p>
                  </div>
                ))}
              </div>

              {/* Detected items */}
              {result.items && result.items.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 mb-2">
                    Itens identificados
                  </p>
                  {result.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-3.5 bg-muted/30 rounded-xl animate-fade-in"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                        <span>{item.calories} cal</span>
                        <span>{item.protein}g P</span>
                        <span>{item.fiber}g F</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tip */}
              {result.tip && (
                <div className="bg-accent/50 rounded-xl p-3.5">
                  <p className="text-xs text-accent-foreground leading-relaxed">💡 {result.tip}</p>
                </div>
              )}

              {/* Action button */}
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-2xl font-bold text-sm gradient-hero text-primary-foreground shadow-elevated active:scale-[0.98] transition-all touch-manipulation"
              >
                Salvar refeição ✓
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global particle keyframes */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MealAnalysisOverlay;
