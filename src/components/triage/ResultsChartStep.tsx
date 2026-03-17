import { useState, useEffect } from "react";

const TRAD_PATH = "M 10 42 C 60 38, 100 50, 140 48 C 180 46, 220 43, 270 40";
const MOUNJA_PATH = "M 10 42 C 60 52, 100 72, 140 88 C 180 98, 220 104, 270 108";

const ResultsChartStep = () => {
  const [phase, setPhase] = useState(0);
  // 0=nothing, 1=title, 2=card, 3=trad line, 4=mounja line, 5=emphasis, 6=micro copy

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 800),
      setTimeout(() => setPhase(4), 1600),
      setTimeout(() => setPhase(5), 2600),
      setTimeout(() => setPhase(6), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center px-8">
      {/* Title */}
      <h1
        className="text-2xl font-extrabold text-foreground text-center mb-8 transition-all duration-500 ease-out"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? "translateY(0)" : "translateY(16px)",
        }}
      >
        O Mounjá gera resultados duradouros
      </h1>

      {/* Card */}
      <div
        className="bg-white rounded-2xl p-6 w-full transition-all duration-500 ease-out"
        style={{
          border: "1.5px solid #E5E5E5",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          opacity: phase >= 2 ? 1 : 0,
          transform: phase >= 2 ? "translateY(0)" : "translateY(12px)",
        }}
      >
        <p className="font-bold text-foreground mb-1">Evolução do seu peso com Mounjá</p>
        <p className="text-xs mb-4" style={{ color: "#aaa" }}>
          Baseado em usuários com padrão semelhante ao seu
        </p>

        <svg viewBox="0 0 280 130" className="w-full h-36">
          <defs>
            <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7B2FF7" />
              <stop offset="100%" stopColor="#F857A6" />
            </linearGradient>
            <filter id="gl">
              <feGaussianBlur stdDeviation="2.5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid */}
          <line x1="0" y1="30" x2="280" y2="30" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1="65" x2="280" y2="65" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="4" />
          <line x1="0" y1="100" x2="280" y2="100" stroke="#E5E5E5" strokeWidth="0.5" strokeDasharray="4" />

          {/* Traditional diet line */}
          <path
            d={TRAD_PATH}
            fill="none"
            stroke="#C0C0C0"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            style={{
              strokeDashoffset: phase >= 3 ? 0 : 400,
              transition: "stroke-dashoffset 0.7s ease-in-out",
            }}
            strokeDashoffset={phase >= 3 ? 0 : undefined}
          >
            {phase < 3 && (
              <animate attributeName="stroke-dashoffset" from="400" to="400" dur="0s" fill="freeze" />
            )}
          </path>
          {/* Trad dots */}
          {[{ cx: 10, cy: 42 }, { cx: 140, cy: 48 }, { cx: 270, cy: 40 }].map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r="2.5"
              fill="#C0C0C0"
              style={{
                opacity: phase >= 3 ? 1 : 0,
                transition: `opacity 0.3s ease ${0.2 + i * 0.2}s`,
              }}
            />
          ))}
          <text
            x="195"
            y="33"
            fill="#999"
            fontSize="7.5"
            fontWeight="500"
            style={{ opacity: phase >= 3 ? 1 : 0, transition: "opacity 0.4s ease 0.5s" }}
          >
            Dieta tradicional
          </text>

          {/* Mounjá line — draw animation via dasharray */}
          <path
            d={MOUNJA_PATH}
            fill="none"
            stroke="url(#cg)"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#gl)"
            pathLength="1"
            strokeDasharray="1"
            style={{
              strokeDashoffset: phase >= 4 ? 0 : 1,
              transition: "stroke-dashoffset 0.8s ease-in-out",
            }}
          />

          {/* Mounjá dots */}
          {[
            { cx: 10, cy: 42, r: 5, delay: 0 },
            { cx: 140, cy: 88, r: 4, delay: 0.3 },
            { cx: 270, cy: 108, r: 5, delay: 0.6, emphasis: true },
          ].map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.emphasis && phase >= 5 ? 6 : p.r}
              fill="white"
              stroke="url(#cg)"
              strokeWidth="2"
              style={{
                opacity: phase >= 4 ? 1 : 0,
                transition: `opacity 0.3s ease ${p.delay}s, r 0.4s ease`,
              }}
            />
          ))}

          {/* Emphasis glow on last point */}
          {phase >= 5 && (
            <circle cx="270" cy="108" r="12" fill="none" stroke="url(#cg)" strokeWidth="1" opacity="0.3">
              <animate attributeName="r" values="10;16;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          )}

          <text
            x="205"
            y="118"
            fill="url(#cg)"
            fontSize="9"
            fontWeight="bold"
            style={{ opacity: phase >= 4 ? 1 : 0, transition: "opacity 0.4s ease 0.6s" }}
          >
            Mounjá
          </text>
        </svg>

        <div className="flex justify-between text-xs mt-2" style={{ color: "#aaa" }}>
          <span>Mês 1</span>
          <span>Mês 3</span>
          <span>Mês 6</span>
        </div>
      </div>

      {/* Micro copy */}
      <p
        className="text-xs text-center mt-5 transition-all duration-500 ease-out"
        style={{
          color: "#999",
          opacity: phase >= 6 ? 1 : 0,
          transform: phase >= 6 ? "translateY(0)" : "translateY(8px)",
        }}
      >
        ✨ Resultados consistentes ao longo do tempo
      </p>

      {/* CTA pulse style */}
      <style>{`
        @keyframes ctaPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        .cta-pulse-active { animation: ctaPulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default ResultsChartStep;
