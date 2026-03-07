import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const sites = [
  { id: "abdomen-esq", label: "Abdômen esquerdo", cx: 75, cy: 155 },
  { id: "abdomen-dir", label: "Abdômen direito", cx: 105, cy: 155 },
  { id: "braco-esq", label: "Braço esquerdo", cx: 40, cy: 115 },
  { id: "braco-dir", label: "Braço direito", cx: 140, cy: 115 },
  { id: "coxa-esq", label: "Coxa esquerda", cx: 70, cy: 200 },
  { id: "coxa-dir", label: "Coxa direita", cx: 110, cy: 200 },
];

const TreatmentSite = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSave = async () => {
    if (!selected) return;
    const site = sites.find((s) => s.id === selected);
    toast.success(`Local: ${site?.label}`);
    navigate(-1);
  };

  const selectedLabel = sites.find((s) => s.id === selected)?.label || "";

  return (
    <div className="min-h-screen bg-background pb-safe flex flex-col">
      <div className="px-6 pt-safe">
        <div className="flex items-center gap-3 mt-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-1">
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <Progress value={66} className="flex-1 h-2" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground text-center mt-6 mb-4">
          Qual seu local de aplicação?
        </h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Simple body outline with clickable dots */}
        <svg viewBox="0 0 180 280" className="w-48 h-auto">
          {/* Head */}
          <circle cx="90" cy="35" r="18" fill="none" stroke="hsl(var(--border))" strokeWidth="2.5" />
          {/* Body */}
          <line x1="90" y1="53" x2="90" y2="160" stroke="hsl(var(--border))" strokeWidth="2.5" />
          {/* Arms */}
          <line x1="90" y1="80" x2="35" y2="120" stroke="hsl(var(--border))" strokeWidth="2.5" />
          <line x1="90" y1="80" x2="145" y2="120" stroke="hsl(var(--border))" strokeWidth="2.5" />
          {/* Legs */}
          <line x1="90" y1="160" x2="65" y2="250" stroke="hsl(var(--border))" strokeWidth="2.5" />
          <line x1="90" y1="160" x2="115" y2="250" stroke="hsl(var(--border))" strokeWidth="2.5" />

          {/* Clickable dots */}
          {sites.map((site) => (
            <g key={site.id} onClick={() => setSelected(site.id)} className="cursor-pointer">
              <circle
                cx={site.cx}
                cy={site.cy}
                r={selected === site.id ? 10 : 7}
                fill={selected === site.id ? "hsl(var(--primary))" : "hsl(var(--muted))"}
                stroke={selected === site.id ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth="2"
                className="transition-all"
              />
              {selected === site.id && (
                <circle cx={site.cx} cy={site.cy} r="5" fill="white" />
              )}
            </g>
          ))}
        </svg>

        {selectedLabel && (
          <p className="text-base font-semibold text-foreground mt-4">{selectedLabel}</p>
        )}
      </div>

      <div className="px-6 pb-8">
        <button
          onClick={handleSave}
          disabled={!selected}
          className={cn(
            "w-full py-4 rounded-full text-base font-bold active:scale-[0.98] transition-transform",
            selected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default TreatmentSite;
