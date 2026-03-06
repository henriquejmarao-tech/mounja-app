import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const injectionSites = [
  { id: "left_arm", label: "Braço esquerdo", x: 18, y: 38 },
  { id: "right_arm", label: "Braço direito", x: 82, y: 38 },
  { id: "left_abdomen", label: "Abdômen esq.", x: 38, y: 48 },
  { id: "right_abdomen", label: "Abdômen dir.", x: 62, y: 48 },
  { id: "left_thigh", label: "Coxa esquerda", x: 38, y: 68 },
  { id: "right_thigh", label: "Coxa direita", x: 62, y: 68 },
];

const doses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];

const RegisterInjection = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { setConfirmedApplication, refresh } = useApplicationData();

  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [selectedDose, setSelectedDose] = useState(profile?.current_dose || "5 mg");
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" });
  const timeLabel = today.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const selectedSiteLabel = injectionSites.find((s) => s.id === selectedSite)?.label || "—";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setConfirmedApplication({
        date: localDateStr(today),
        dose: selectedDose,
        site: selectedSiteLabel !== "—" ? selectedSiteLabel : null,
        notes: `Horário: ${timeLabel}`,
      });
      await refresh();
      toast.success("Aplicação registrada ✓");
      navigate("/");
    } catch {
      toast.error("Erro ao registrar");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pb-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{dateLabel}</h1>
        <div className="w-10" />
      </div>

      <div className="px-6 space-y-5">
        {/* Body map */}
        <div className="flex justify-center py-4">
          <div className="relative" style={{ width: 220, height: 300 }}>
            {/* SVG Body outline */}
            <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" stroke="hsl(var(--border))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {/* Head */}
              <circle cx="50" cy="16" r="10" />
              {/* Neck */}
              <line x1="50" y1="26" x2="50" y2="30" />
              {/* Shoulders */}
              <line x1="50" y1="30" x2="20" y2="38" />
              <line x1="50" y1="30" x2="80" y2="38" />
              {/* Body */}
              <line x1="50" y1="30" x2="50" y2="72" />
              {/* Arms */}
              <line x1="20" y1="38" x2="12" y2="60" />
              <line x1="80" y1="38" x2="88" y2="60" />
              {/* Hands */}
              <circle cx="12" cy="62" r="3" />
              <circle cx="88" cy="62" r="3" />
              {/* Hips */}
              <line x1="50" y1="72" x2="35" y2="78" />
              <line x1="50" y1="72" x2="65" y2="78" />
              {/* Legs */}
              <line x1="35" y1="78" x2="32" y2="110" />
              <line x1="65" y1="78" x2="68" y2="110" />
              {/* Feet */}
              <line x1="32" y1="110" x2="26" y2="115" />
              <line x1="68" y1="110" x2="74" y2="115" />
            </svg>

            {/* Injection site markers */}
            {injectionSites.map((site) => (
              <button
                key={site.id}
                onClick={() => setSelectedSite(selectedSite === site.id ? null : site.id)}
                className={cn(
                  "absolute w-7 h-7 rounded-full border-2 transition-all duration-200 -translate-x-1/2 -translate-y-1/2 active:scale-90",
                  selectedSite === site.id
                    ? "bg-primary border-primary shadow-elevated scale-110"
                    : "bg-muted/50 border-border/60"
                )}
                style={{
                  left: `${site.x}%`,
                  top: `${site.y}%`,
                }}
              >
                {selectedSite === site.id && (
                  <div className="w-2 h-2 bg-primary-foreground rounded-full mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Treatment Site */}
        <div className="bg-muted/40 rounded-2xl px-5 py-4 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Local</span>
          <span className="text-base text-muted-foreground font-medium">{selectedSiteLabel}</span>
        </div>

        {/* Time */}
        <div className="bg-muted/40 rounded-2xl px-5 py-4 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Horário</span>
          <span className="text-base text-muted-foreground font-medium">{timeLabel}</span>
        </div>

        {/* Medication */}
        <div className="bg-muted/40 rounded-2xl px-5 py-4 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Medicamento</span>
          <span className="text-base text-muted-foreground font-medium">Mounjaro®</span>
        </div>

        {/* Dose */}
        <div className="bg-muted/40 rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-foreground">Dose</span>
            <span className="text-base text-muted-foreground font-medium">{selectedDose}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {doses.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDose(d)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95",
                  selectedDose === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-background border border-border text-muted-foreground"
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-base font-bold shadow-elevated active:scale-[0.97] transition-transform disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mx-auto" />
          ) : (
            "Salvar"
          )}
        </button>
      </div>
    </div>
  );
};

export default RegisterInjection;
