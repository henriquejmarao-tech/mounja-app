import { useState, useEffect } from "react";

const STATUS_MESSAGES = [
  "Identificando alimentos…",
  "Calculando nutrientes…",
  "Finalizando análise…",
];

interface MealAnalysisOverlayProps {
  photoPreview: string;
}

const MealAnalysisOverlay = ({ photoPreview }: MealAnalysisOverlayProps) => {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    setStatusIdx(0);
    const id = setInterval(() => setStatusIdx((prev) => (prev + 1) % STATUS_MESSAGES.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center">
      {/* Background photo with heavy overlay */}
      <img
        src={photoPreview}
        alt="Meal"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* Floating particles */}
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

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/70"
              style={{
                animation: "analysis-dot 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <p className="text-lg font-bold text-white/90 transition-all duration-500">
          {STATUS_MESSAGES[statusIdx]}
        </p>
      </div>

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
