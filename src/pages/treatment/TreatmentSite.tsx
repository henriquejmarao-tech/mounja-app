import { useState } from "react";
import { ChevronLeft, Syringe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApplicationData } from "@/hooks/useApplicationData";
import { toast } from "sonner";

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

const TreatmentSite = () => {
  const navigate = useNavigate();
  const { refresh } = useApplicationData();
  const [selected, setSelected] = useState<string | null>(null);

  const selectedLabel = sites.find((s) => s.id === selected)?.label || "";

  const handleSave = async () => {
    if (!selected) return;
    const site = sites.find((s) => s.id === selected);
    await refresh();
    toast.success(`Local: ${site?.label}`);
    navigate(-1);
  };

  return (
    <div
      className="min-h-screen pb-nav flex flex-col"
      style={{ background: "linear-gradient(180deg, hsl(20, 30%, 97%) 0%, hsl(36, 25%, 97%) 40%, hsl(0, 0%, 98%) 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-safe pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6 text-foreground/70" />
        </button>
        <div className="flex-1" />
        <div className="w-10" />
      </div>

      <div className="px-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(270,80%,96%), hsl(330,60%,96%))" }}
          >
            <Syringe className="w-5 h-5" style={{ color: "hsl(270,60%,55%)" }} />
          </div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Local de aplicação</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium mt-1 ml-[52px]">Toque na área onde você aplica</p>
      </div>

      {/* Body diagram card */}
      <div className="flex-1 px-5 mt-3">
        <div className="bg-card rounded-2xl border border-border/40 shadow-card p-5 flex flex-col items-center">
          <svg viewBox="0 0 180 280" className="w-48 h-auto" style={{ filter: "drop-shadow(0 2px 8px hsl(0 0% 0% / 0.04))" }}>
            <defs>
              <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7B2FF7" />
                <stop offset="100%" stopColor="#F857A6" />
              </linearGradient>
            </defs>

            <circle cx="90" cy="32" r="16" fill="none" stroke="hsl(0 0% 82%)" strokeWidth="2" />
            <line x1="90" y1="48" x2="90" y2="58" stroke="hsl(0 0% 82%)" strokeWidth="2" />
            <path d="M 66 58 Q 66 56 68 56 L 112 56 Q 114 56 114 58 L 118 160 Q 118 164 114 164 L 66 164 Q 62 164 62 160 Z"
              fill="hsl(0 0% 96%)" stroke="hsl(0 0% 82%)" strokeWidth="1.5" rx="4" />
            <path d="M 66 60 Q 50 70 36 100 Q 30 115 34 120 Q 38 125 42 118 Q 52 95 62 80"
              fill="none" stroke="hsl(0 0% 82%)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 114 60 Q 130 70 144 100 Q 150 115 146 120 Q 142 125 138 118 Q 128 95 118 80"
              fill="none" stroke="hsl(0 0% 82%)" strokeWidth="2" strokeLinecap="round" />
            <path d="M 70 164 L 64 240 Q 62 248 68 248 L 76 248 Q 80 248 78 240 L 86 164"
              fill="hsl(0 0% 96%)" stroke="hsl(0 0% 82%)" strokeWidth="1.5" />
            <path d="M 94 164 L 102 240 Q 104 248 108 248 L 116 248 Q 120 248 118 240 L 110 164"
              fill="hsl(0 0% 96%)" stroke="hsl(0 0% 82%)" strokeWidth="1.5" />

            {sites.map((site) => {
              const isSelected = selected === site.id;
              return (
                <g key={site.id} onClick={() => setSelected(site.id)} className="cursor-pointer">
                  {isSelected && (
                    <circle cx={site.cx} cy={site.cy} r="14" fill="none" stroke={`url(#${GRAD_ID})`} strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={site.cx} cy={site.cy}
                    r={isSelected ? 9 : 7}
                    fill={isSelected ? `url(#${GRAD_ID})` : "#E5E5E5"}
                    stroke="none"
                    style={{ transition: "all 0.3s ease" }}
                  />
                  {isSelected && <circle cx={site.cx} cy={site.cy} r="3.5" fill="white" />}
                  {isSelected && (
                    <g>
                      <rect x={site.cx - 32} y={site.cy - 26} width="64" height="16" rx="8"
                        fill="hsl(0 0% 100%)" stroke={`url(#${GRAD_ID})`} strokeWidth="1"
                        style={{ filter: "drop-shadow(0 1px 3px hsl(0 0% 0% / 0.08))" }}
                      />
                      <text x={site.cx} y={site.cy - 15} textAnchor="middle" fontSize="7" fontWeight="600" fill="hsl(0 0% 25%)">
                        {site.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {selectedLabel && (
            <span className="text-sm font-semibold text-foreground px-4 py-1.5 rounded-full border border-border/50 bg-muted/30 mt-3">
              {selectedLabel}
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <button
          onClick={handleSave}
          disabled={!selected}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
            boxShadow: "0 8px 24px hsl(300 60% 50% / 0.2), 0 2px 8px hsl(270 80% 60% / 0.15)",
          }}
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default TreatmentSite;
