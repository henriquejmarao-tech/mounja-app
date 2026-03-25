import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import FireIcon from "./FireIcon";
import { localDateStr } from "@/lib/utils";

const STREAK_START_DATE = "2026-03-25";

interface StreakModalProps {
  open: boolean;
  onClose: () => void;
  streakCount: number;
  onCheckin: () => void;
}

const StreakModal = ({ open, onClose, streakCount, onCheckin }: StreakModalProps) => {
  const today = localDateStr(new Date());
  const isFirstDay = today === STREAK_START_DATE;
  const [step, setStep] = useState(isFirstDay ? 0 : 1);

  useEffect(() => {
    if (open) setStep(isFirstDay ? 0 : 1);
  }, [open, isFirstDay]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ backdropFilter: "blur(4px)", background: "rgba(15,10,30,0.65)" }}
      onClick={onClose}
    >
      <div
        className="bg-card w-full max-w-sm rounded-3xl p-6 pt-5 relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-muted-foreground active:scale-90 transition-transform">
          <X className="w-5 h-5" />
        </button>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-5">
          <div className={`w-2 h-2 rounded-full transition-all ${step === 0 ? "bg-foreground" : "bg-border"}`} />
          <div className={`w-2 h-2 rounded-full transition-all ${step === 1 ? "bg-foreground" : "bg-border"}`} />
        </div>

        {step === 0 ? (
          /* Tela 1 — Intro (only on first day) */
          <div className="flex flex-col items-center text-center">
            <FireIcon width={56} height={64} />
            <h2 className="text-xl font-extrabold text-foreground mt-4">Alimente o fogo</h2>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Cada check-in diário mantém sua chama acesa. Não deixe ela apagar.
            </p>

            {/* Progression illustration */}
            <div className="flex items-center gap-2 mt-6 mb-2">
              {[
                { day: "Dia 1", opacity: 0.3 },
                { day: "Dia 3", opacity: 0.6 },
                { day: "Dia 7", opacity: 1.0 },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <span className="text-muted-foreground text-xs">→</span>}
                  <div className="flex flex-col items-center gap-1">
                    <FireIcon width={24} height={28} opacity={item.opacity} />
                    <span className="text-[10px] font-semibold text-muted-foreground">{item.day}</span>
                  </div>
                </div>
              ))}
              <span className="text-muted-foreground text-xs ml-1">→</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f97316, #ec4899)" }}>
                  <span className="text-white text-[10px]">✓</span>
                </div>
                <span className="text-[10px] font-bold" style={{ color: "#f97316" }}>Sequência!</span>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full mt-5 py-3.5 rounded-2xl text-sm font-bold text-card flex items-center justify-center gap-1 active:scale-[0.97] transition-transform"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f97316)" }}
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Tela 2 — Streak status */
          <div className="flex flex-col items-center text-center">
            <FireIcon width={64} height={72} />
            <p className="text-5xl font-extrabold text-foreground mt-3">{streakCount}</p>
            <p className="text-sm text-muted-foreground mt-0.5">dia(s) de check-in seguido(s)</p>

            {/* Message card */}
            <div className="w-full mt-5 rounded-2xl p-4" style={{ background: "linear-gradient(135deg, hsl(270 50% 96%), hsl(25 60% 96%))" }}>
              <p className="text-sm text-foreground font-medium leading-relaxed">
                Faça seu check-in de sintomas hoje para não perder sua sequência
              </p>
            </div>

            <button
              onClick={onCheckin}
              className="w-full mt-4 py-3.5 rounded-2xl text-sm font-bold text-card active:scale-[0.97] transition-transform"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899, #f97316)" }}
            >
              Fazer check-in agora
            </button>
            <button
              onClick={onClose}
              className="mt-2 py-2 text-sm text-muted-foreground font-medium active:opacity-60 transition-opacity"
            >
              Fazer depois
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreakModal;
