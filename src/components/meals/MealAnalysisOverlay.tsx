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
  "Identificando alimentos…",
  "Calculando nutrientes…",
  "Finalizando análise…",
];

const MealAnalysisOverlay = ({ photoPreview, analyzing, result, onClose }: MealAnalysisOverlayProps) => {
  const [statusIdx, setStatusIdx] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [counters, setCounters] = useState({ cal: 0, prot: 0, fib: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Cycle status messages
  useEffect(() => {
    if (!analyzing) return;
    setStatusIdx(0);
    const id = setInterval(() => setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length), 2400);
    return () => clearInterval(id);
  }, [analyzing]);

  // Animate counters when result arrives — use rAF for smooth, non-blocking animation
  useEffect(() => {
    if (!result) {
      setShowResult(false);
      setCounters({ cal: 0, prot: 0, fib: 0 });
      return;
    }

    // Show result card immediately — no delay
    setShowResult(true);

    const targetCal = result.total_calories || 0;
    const targetProt = result.total_protein || 0;
    const targetFib = result.total_fiber || 0;
    const duration = 900;
    let start: number | null = null;
    let rafId: number;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCounters({
        cal: Math.round(targetCal * ease),
        prot: Math.round(targetProt * ease),
        fib: Math.round(targetFib * ease),
      });
      if (progress < 1) rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [result]);

  // Progress bar percentages (based on common daily goals)
  const calPct = result ? Math.min(100, ((result.total_calories || 0) / 2000) * 100) : 0;
  const protPct = result ? Math.min(100, ((result.total_protein || 0) / 120) * 100) : 0;
  const fibPct = result ? Math.min(100, ((result.total_fiber || 0) / 25) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
      {/* ── Fullscreen photo with soft overlay ── */}
      <div className="relative w-full shrink-0" style={{ height: "45vh", minHeight: "260px" }}>
        <img
          src={photoPreview}
          alt="Meal"
          className="absolute inset-0 w-full h-full object-cover"
          crossOrigin="anonymous"
        />

        {/* Subtle dark overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.35) 100%)" }} />

        {/* Soft floating particles */}
        {analyzing && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${4 + Math.random() * 6}px`,
                  height: `${4 + Math.random() * 6}px`,
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  background: `hsl(${295 + Math.random() * 45}, ${55 + Math.random() * 15}%, ${50 + Math.random() * 20}%)`,
                  opacity: 0.4,
                  animation: `analysis-float ${3 + Math.random() * 4}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Centered analysis pill ── */}
        {analyzing && !result && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div
              className="flex items-center gap-3 px-6 py-3 rounded-full shadow-lg"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(16px)" }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/70"
                    style={{
                      animation: "analysis-dot 1.4s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-white/90 transition-all duration-500">
                {STATUS_MESSAGES[statusIdx]}
              </span>
            </div>
          </div>
        )}

        {/* Success pill */}
        {result && showResult && (
          <div
            className="absolute z-20 flex justify-center animate-fade-in"
            style={{ bottom: "24px", left: 0, right: 0 }}
          >
            <div
              className="flex items-center gap-2 px-5 py-2.5 rounded-full"
              style={{ background: "rgba(16,185,129,0.2)", backdropFilter: "blur(16px)", border: "1px solid rgba(16,185,129,0.3)" }}
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Análise concluída</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom result panel ── */}
      <div
        className="relative z-30 bg-card rounded-t-[28px] -mt-6 flex-1 flex flex-col min-h-0"
        style={{ touchAction: "pan-y" }}
      >
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 pt-6 pb-2"
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" } as React.CSSProperties}
        >
          {/* Analyzing skeleton */}
          {analyzing && !result && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex gap-3">
                {[
                  { icon: Flame, label: "Calorias" },
                  { icon: Beef, label: "Proteína" },
                  { icon: Leaf, label: "Fibra" },
                ].map((m, i) => (
                  <div
                    key={m.label}
                    className="flex-1 rounded-2xl p-4 text-center bg-muted/30 border border-border/30"
                    style={{ animation: `pulse 2s ease-in-out infinite`, animationDelay: `${i * 200}ms` }}
                  >
                    <m.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground/30" />
                    <div className="h-6 w-12 mx-auto rounded-lg bg-muted/50 mb-1" />
                    <p className="text-[10px] text-muted-foreground/40 font-medium">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground/50 text-center">Analisando sua refeição…</p>
            </div>
          )}

          {/* Result */}
          {result && showResult && (
            <div className="space-y-5 animate-fade-in">
              {/* Description + Insight */}
              {result.description && (
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "hsl(340, 65%, 62%)" }} />
                  <p className="text-sm font-bold text-foreground leading-snug">{result.description}</p>
                </div>
              )}

              {/* Macro cards with progress bars */}
              <div className="flex gap-3">
                {[
                  { icon: Flame, label: "Calorias", value: counters.cal, unit: "", pct: calPct, gradStart: "hsl(340,65%,62%)", gradEnd: "hsl(15,75%,75%)" },
                  { icon: Beef, label: "Proteína", value: counters.prot, unit: "g", pct: protPct, gradStart: "hsl(295,55%,42%)", gradEnd: "hsl(340,65%,62%)" },
                  { icon: Leaf, label: "Fibra", value: counters.fib, unit: "g", pct: fibPct, gradStart: "hsl(160,45%,45%)", gradEnd: "hsl(180,50%,55%)" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex-1 rounded-2xl p-4 text-center bg-muted/20 border border-border/30"
                  >
                    <m.icon className="w-5 h-5 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="text-xl font-extrabold tabular-nums text-foreground">
                      {m.value}<span className="text-xs font-semibold text-muted-foreground">{m.unit}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-1 mb-2">{m.label}</p>
                    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${m.pct}%`,
                          background: `linear-gradient(to right, ${m.gradStart}, ${m.gradEnd})`,
                        }}
                      />
                    </div>
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

              {/* Tip / Insight */}
              {result.tip && (
                <div className="rounded-xl p-3.5 border border-border/30" style={{ background: "hsl(var(--muted) / 0.4)" }}>
                  <p className="text-xs text-foreground/70 leading-relaxed">💡 {result.tip}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save button */}
        {result && showResult && (
          <div className="shrink-0 px-5 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-bold text-base text-white shadow-elevated active:scale-[0.98] transition-all touch-manipulation"
              style={{ background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))" }}
            >
              Salvar refeição ✓
            </button>
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes analysis-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-15px) scale(1.3); opacity: 0.6; }
        }
        @keyframes analysis-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MealAnalysisOverlay;
