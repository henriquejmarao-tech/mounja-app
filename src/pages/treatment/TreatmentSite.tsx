import { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import mascotImg from "@/assets/mascot-pointing.png";

const GRADIENT = "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)";
const GRAD_ID = "site-grad";

const sites = [
  { id: "abdomen-esq", label: "Abdômen esquerdo", cx: 75, cy: 148 },
  { id: "abdomen-dir", label: "Abdômen direito", cx: 105, cy: 148 },
  { id: "braco-esq", label: "Braço esquerdo", cx: 38, cy: 108 },
  { id: "braco-dir", label: "Braço direito", cx: 142, cy: 108 },
  { id: "coxa-esq", label: "Coxa esquerda", cx: 68, cy: 210 },
  { id: "coxa-dir", label: "Coxa direita", cx: 112, cy: 210 },
];

const L1 = "Toque na área onde você costuma aplicar.";
const L2 = "Isso me ajuda a personalizar melhor suas recomendações.";

const TreatmentSite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh } = useApplicationData();
  const [selected, setSelected] = useState<string | null>(null);

  // Mascot animation
  const [mascotLoaded, setMascotLoaded] = useState(false);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
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
    const d = 1000 / L1.length; let i = 0;
    intervalRef.current = setInterval(() => {
      i++; setDisplayedL1(L1.slice(0, i));
      if (i >= L1.length) { clearInterval(intervalRef.current); setTimeout(() => setTypingLine(2), 300); }
    }, d);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  useEffect(() => {
    if (typingLine !== 2) return;
    const d = 1200 / L2.length; let i = 0;
    intervalRef.current = setInterval(() => {
      i++; setDisplayedL2(L2.slice(0, i));
      if (i >= L2.length) { clearInterval(intervalRef.current); setTypingLine(3); }
    }, d);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  useEffect(() => {
    if (typingLine === 3) { const t = setTimeout(() => setShowCursor(false), 1000); return () => clearTimeout(t); }
    if (typingLine === 0) return;
    const blink = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(blink);
  }, [typingLine]);

  const selectedLabel = sites.find((s) => s.id === selected)?.label || "";

  const handleSave = async () => {
    if (!selected) return;
    const site = sites.find((s) => s.id === selected);
    await refresh();
    toast.success(`Local: ${site?.label}`);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      {/* Header */}
      <div className="px-6 pt-safe">
        <div className="flex items-center gap-3 mt-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <Progress value={66} className="flex-1 h-2" />
        </div>

        <h1 className="text-xl font-extrabold text-foreground text-center mt-5 mb-1">
          Qual seu local habitual de aplicação?
        </h1>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-y-auto">
        {/* Body diagram */}
        <div className="flex justify-center mt-3 mb-2">
          <svg viewBox="0 0 180 280" className="w-44 h-auto" style={{ filter: "drop-shadow(0 2px 8px hsl(0 0% 0% / 0.04))" }}>
            <defs>
              <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B2FF7" />
                <stop offset="100%" stopColor="#F857A6" />
              </linearGradient>
            </defs>

            {/* Body outline */}
            <circle cx="90" cy="32" r="16" fill="none" stroke="hsl(0 0% 82%)" strokeWidth="2" />
            {/* Neck */}
            <line x1="90" y1="48" x2="90" y2="58" stroke="hsl(0 0% 82%)" strokeWidth="2" />
            {/* Torso */}
            <path d="M 66 58 Q 66 56 68 56 L 112 56 Q 114 56 114 58 L 118 160 Q 118 164 114 164 L 66 164 Q 62 164 62 160 Z"
              fill="hsl(0 0% 96%)" stroke="hsl(0 0% 82%)" strokeWidth="1.5" rx="4" />
            {/* Arms */}
            <path d="M 66 60 Q 50 70 36 100 Q 30 115 34 120 Q 38 125 42 118 Q 52 95 62 80"
              fill="none" stroke="hsl(0 0% 82%)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 114 60 Q 130 70 144 100 Q 150 115 146 120 Q 142 125 138 118 Q 128 95 118 80"
              fill="none" stroke="hsl(0 0% 82%)" strokeWidth="2" strokeLinecap="round" />
            {/* Legs */}
            <path d="M 70 164 L 64 240 Q 62 248 68 248 L 76 248 Q 80 248 78 240 L 86 164"
              fill="hsl(0 0% 96%)" stroke="hsl(0 0% 82%)" strokeWidth="1.5" />
            <path d="M 94 164 L 102 240 Q 104 248 108 248 L 116 248 Q 120 248 118 240 L 110 164"
              fill="hsl(0 0% 96%)" stroke="hsl(0 0% 82%)" strokeWidth="1.5" />

            {/* Clickable points */}
            {sites.map((site) => {
              const isSelected = selected === site.id;
              return (
                <g
                  key={site.id}
                  onClick={() => setSelected(site.id)}
                  className="cursor-pointer"
                  style={{ transition: "transform 0.2s" }}
                >
                  {/* Hover/pulse ring */}
                  {isSelected && (
                    <circle
                      cx={site.cx} cy={site.cy} r="14"
                      fill="none" stroke={`url(#${GRAD_ID})`} strokeWidth="1.5"
                      opacity="0.4"
                    >
                      <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  {/* Main dot */}
                  <circle
                    cx={site.cx} cy={site.cy}
                    r={isSelected ? 9 : 7}
                    fill={isSelected ? `url(#${GRAD_ID})` : "#E5E5E5"}
                    stroke="none"
                    style={{ transition: "all 0.3s ease" }}
                  />
                  {isSelected && (
                    <circle cx={site.cx} cy={site.cy} r="3.5" fill="white" />
                  )}
                  {/* Label on selection */}
                  {isSelected && (
                    <g>
                      <rect
                        x={site.cx - 32} y={site.cy - 26}
                        width="64" height="16" rx="8"
                        fill="hsl(0 0% 100%)" stroke={`url(#${GRAD_ID})`} strokeWidth="1"
                        style={{ filter: "drop-shadow(0 1px 3px hsl(0 0% 0% / 0.08))" }}
                      />
                      <text
                        x={site.cx} y={site.cy - 15}
                        textAnchor="middle" fontSize="7" fontWeight="600"
                        fill="hsl(0 0% 25%)"
                      >
                        {site.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected label below body */}
        <div className="h-7 flex justify-center items-center">
          {selectedLabel && (
            <span
              className="text-sm font-semibold text-foreground px-4 py-1 rounded-full border border-border/50 bg-card shadow-sm"
              style={{
                animation: "fadeUp 0.3s ease-out",
              }}
            >
              {selectedLabel}
            </span>
          )}
        </div>

        {/* Mascot + Bubble */}
        <div className="flex items-end gap-3 mt-3 mb-2">
          <div className="shrink-0">
            <img
              src={mascotImg}
              alt="Mounjá"
              className="w-16 h-auto object-contain transition-all duration-700 ease-out"
              style={{
                opacity: mascotVisible ? 1 : 0,
                transform: mascotVisible ? "translateY(0)" : "translateY(20px)",
                filter: "drop-shadow(0 4px 12px hsl(280 40% 30% / 0.10))",
                background: "transparent",
              }}
              onLoad={() => setMascotLoaded(true)}
            />
          </div>
          <div
            className="transition-all duration-500 ease-out flex-1"
            style={{ opacity: showBubble ? 1 : 0, transform: showBubble ? "translateY(0)" : "translateY(12px)" }}
          >
            <div className="bg-card rounded-2xl px-4 py-3 shadow-card border border-border/40 relative">
              <p className="text-[0.78rem] text-foreground leading-relaxed min-h-[1.2em]">
                {displayedL1}
                {typingLine === 1 && showCursor && (
                  <span className="inline-block w-[2px] h-[0.78em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </p>
              {typingLine >= 2 && (
                <p className="text-[0.8rem] font-semibold text-foreground leading-relaxed mt-1 min-h-[1.2em]">
                  {displayedL2}
                  {showCursor && typingLine < 3 && (
                    <span className="inline-block w-[2px] h-[0.8em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                  )}
                </p>
              )}
              <div className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45" style={{ bottom: 10, left: -5 }} />
            </div>
          </div>
        </div>

        {/* Fallback text */}
        <p className="text-xs text-muted-foreground text-center mt-1 mb-2">
          Ou selecione manualmente tocando nos pontos
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 pb-8">
        <button
          onClick={handleSave}
          disabled={!selected}
          className="w-full py-4 rounded-full text-primary-foreground text-base font-bold active:scale-[0.98] transition-all shadow-elevated disabled:opacity-40 disabled:pointer-events-none"
          style={{ background: GRADIENT }}
        >
          Continuar
        </button>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default TreatmentSite;
