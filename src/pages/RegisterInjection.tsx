import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const injectionSites = [
  { id: "left_arm", label: "Braço esquerdo", x: 18, y: 38 },
  { id: "right_arm", label: "Braço direito", x: 82, y: 38 },
  { id: "left_abdomen", label: "Abdômen esq.", x: 38, y: 48 },
  { id: "right_abdomen", label: "Abdômen dir.", x: 62, y: 48 },
  { id: "left_thigh", label: "Coxa esquerda", x: 38, y: 68 },
  { id: "right_thigh", label: "Coxa direita", x: 62, y: 68 },
];

const medications = ["Mounjaro®", "Zepbound®", "Ozempic®", "Wegovy®", "Tirzepatide", "Semaglutide", "Retatrutide"];

const ITEM_HEIGHT = 44;
const VISIBLE = 5;
const CENTER = Math.floor(VISIBLE / 2);

function ScrollColumn({ items, selected, onChange }: { items: (string | number)[]; selected: string | number; onChange: (v: string | number) => void }) {
  const containerHeight = VISIBLE * ITEM_HEIGHT;
  const ref = React.useRef<HTMLDivElement>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    const idx = items.indexOf(selected);
    if (idx >= 0 && ref.current) {
      ref.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "auto" });
    }
  }, []);

  const handleScroll = () => {
    if (!ref.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const index = Math.round(ref.current!.scrollTop / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      onChange(items[clamped]);
      ref.current!.scrollTo({ top: clamped * ITEM_HEIGHT, behavior: "smooth" });
    }, 80);
  };

  return (
    <div className="relative overflow-hidden" style={{ height: containerHeight, flex: 1 }}>
      <div
        className="absolute left-0 right-0 bg-muted/60 rounded-xl pointer-events-none z-10"
        style={{ top: CENTER * ITEM_HEIGHT, height: ITEM_HEIGHT }}
      />
      <div
        ref={ref}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory"
        style={{ paddingTop: CENTER * ITEM_HEIGHT, paddingBottom: CENTER * ITEM_HEIGHT, scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.sc::-webkit-scrollbar{display:none}`}</style>
        {items.map((val) => (
          <div
            key={val}
            className={cn(
              "flex items-center justify-center snap-center transition-all",
              val === selected ? "text-foreground text-2xl font-bold" : "text-muted-foreground/50 text-lg"
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {val}
          </div>
        ))}
      </div>
      <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-background to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
    </div>
  );
}

import React from "react";

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const RegisterInjection = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { setConfirmedApplication, refresh } = useApplicationData();

  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [medication, setMedication] = useState("Mounjaro®");
  const [doseValue, setDoseValue] = useState(profile?.current_dose?.replace(/[^0-9.]/g, "") || "5.0");
  const [saving, setSaving] = useState(false);

  // Time state
  const now = new Date();
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(String(now.getMinutes()).padStart(2, "0"));

  // Drawers
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMedPicker, setShowMedPicker] = useState(false);

  const today = new Date();
  const dateLabel = today.toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" });
  const timeLabel = `${hour}:${minute} ${period}`;

  const selectedSiteLabel = injectionSites.find((s) => s.id === selectedSite)?.label || "—";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const dose = `${doseValue} mg`;
      // Update profile current_dose so Dashboard reflects the change
      await setConfirmedApplication({
        date: localDateStr(today),
        dose,
        site: selectedSiteLabel !== "—" ? selectedSiteLabel : null,
        notes: `Horário: ${timeLabel} | Medicamento: ${medication}`,
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

      <div className="px-6 space-y-4">
        {/* Body map */}
        <div className="flex justify-center py-2">
          <div className="relative" style={{ width: 220, height: 300 }}>
            <svg viewBox="0 0 100 120" className="w-full h-full" fill="none" stroke="hsl(var(--border))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="50" cy="16" r="10" />
              <line x1="50" y1="26" x2="50" y2="30" />
              <line x1="50" y1="30" x2="20" y2="38" />
              <line x1="50" y1="30" x2="80" y2="38" />
              <line x1="50" y1="30" x2="50" y2="72" />
              <line x1="20" y1="38" x2="12" y2="60" />
              <line x1="80" y1="38" x2="88" y2="60" />
              <circle cx="12" cy="62" r="3" />
              <circle cx="88" cy="62" r="3" />
              <line x1="50" y1="72" x2="35" y2="78" />
              <line x1="50" y1="72" x2="65" y2="78" />
              <line x1="35" y1="78" x2="32" y2="110" />
              <line x1="65" y1="78" x2="68" y2="110" />
              <line x1="32" y1="110" x2="26" y2="115" />
              <line x1="68" y1="110" x2="74" y2="115" />
            </svg>
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
                style={{ left: `${site.x}%`, top: `${site.y}%` }}
              >
                {selectedSite === site.id && (
                  <div className="w-2 h-2 bg-primary-foreground rounded-full mx-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Treatment Site - tappable */}
        <div className="bg-muted/40 rounded-2xl px-5 py-4 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Local</span>
          <span className="text-base text-muted-foreground font-medium">{selectedSiteLabel}</span>
        </div>

        {/* Time - tappable */}
        <button
          onClick={() => setShowTimePicker(true)}
          className="w-full bg-muted/40 rounded-2xl px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span className="text-base font-semibold text-foreground">Horário</span>
          <span className="text-base text-muted-foreground font-medium">{timeLabel}</span>
        </button>

        {/* Medication - tappable */}
        <button
          onClick={() => setShowMedPicker(true)}
          className="w-full bg-muted/40 rounded-2xl px-5 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span className="text-base font-semibold text-foreground">Medicamento</span>
          <span className="text-base text-muted-foreground font-medium flex items-center gap-1">
            {medication} <ChevronDown className="w-4 h-4" />
          </span>
        </button>

        {/* Dose - editable input */}
        <div className="bg-muted/40 rounded-2xl px-5 py-4 flex items-center justify-between">
          <span className="text-base font-semibold text-foreground">Dose</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              value={doseValue}
              onChange={(e) => setDoseValue(e.target.value)}
              className="w-16 text-right text-base font-medium bg-transparent outline-none text-foreground"
            />
            <span className="text-base text-muted-foreground font-medium">mg</span>
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

      {/* Time Picker Drawer */}
      <Drawer open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <div className="flex items-center justify-center gap-4 py-4">
              <ScrollColumn items={hours} selected={hour} onChange={(v) => setHour(v as string)} />
              <ScrollColumn items={minutes} selected={minute} onChange={(v) => setMinute(v as string)} />
              <ScrollColumn items={periods} selected={period} onChange={(v) => setPeriod(v as string)} />
            </div>
            <button
              onClick={() => setShowTimePicker(false)}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl text-base font-bold active:scale-[0.97] transition-transform"
            >
              Confirmar
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Medication Picker Drawer */}
      <Drawer open={showMedPicker} onOpenChange={setShowMedPicker}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <h3 className="text-lg font-bold text-foreground text-center mb-4 pt-2">Medicamento</h3>
            <div className="space-y-1">
              {medications.map((med) => (
                <button
                  key={med}
                  onClick={() => { setMedication(med); setShowMedPicker(false); }}
                  className={cn(
                    "w-full text-left px-5 py-3.5 rounded-xl text-base font-medium transition-all active:scale-[0.98]",
                    medication === med
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default RegisterInjection;
