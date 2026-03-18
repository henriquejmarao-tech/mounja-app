import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { localDateStr, cn } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronLeft, ChevronDown, MapPin, Clock, Pill, Gauge, Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import mascotImg from "@/assets/mascot-pointing.png";

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
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory sc"
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

const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const RegisterInjection = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { setConfirmedApplication, refresh } = useApplicationData();

  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [medication, setMedication] = useState("Mounjaro®");
  const initialDose = profile?.current_dose?.replace(/[^0-9.]/g, "") || "5.0";
  const [doseInt, setDoseInt] = useState(String(Math.floor(parseFloat(initialDose) || 5)));
  const [doseDec, setDoseDec] = useState(String(Math.round(((parseFloat(initialDose) || 5) % 1) * 10)));
  const [saving, setSaving] = useState(false);
  const [showSiteMap, setShowSiteMap] = useState(false);

  const now = new Date();
  const [hour, setHour] = useState(String(now.getHours()).padStart(2, "0"));
  const [minute, setMinute] = useState(String(now.getMinutes()).padStart(2, "0"));

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showMedPicker, setShowMedPicker] = useState(false);
  const [showDosePicker, setShowDosePicker] = useState(false);

  const doseInts = Array.from({ length: 20 }, (_, i) => String(i));
  const doseDecimals = Array.from({ length: 10 }, (_, i) => String(i));
  const doseValue = `${doseInt}.${doseDec}`;

  const today = new Date();
  const dateLabel = today.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  const timeLabel = `${hour}:${minute}`;

  const selectedSiteLabel = injectionSites.find((s) => s.id === selectedSite)?.label || "Selecionar local";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const dose = `${doseValue} mg`;
      await setConfirmedApplication({
        date: localDateStr(today),
        dose,
        site: selectedSiteLabel !== "Selecionar local" ? selectedSiteLabel : null,
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
    <div
      className="min-h-screen pb-nav"
      style={{ background: "linear-gradient(180deg, hsl(20, 30%, 97%) 0%, hsl(36, 25%, 97%) 40%, hsl(0, 0%, 98%) 100%)" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center px-5 pt-safe pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-90 transition-transform">
          <ChevronLeft className="w-6 h-6 text-foreground/70" />
        </button>
        <div className="flex-1" />
        <div className="w-10" />
      </div>

      {/* ── Title area with mascot ── */}
      <div className="px-6 pb-2 flex items-end gap-4">
        <div className="flex-1">
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight leading-tight">
            Registrar aplicação
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">{dateLabel}</p>
        </div>
        <img
          src={mascotImg}
          alt=""
          className="w-16 h-16 object-contain opacity-90 shrink-0"
          style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}
        />
      </div>

      {/* ── Form Cards ── */}
      <div className="px-5 mt-5 space-y-3">

        {/* Local */}
        <button
          onClick={() => setShowSiteMap(true)}
          className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(270,80%,96%), hsl(330,60%,96%))" }}>
            <MapPin className="w-5 h-5" style={{ color: "hsl(270,60%,55%)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Local</p>
            <p className={cn(
              "text-[15px] font-semibold mt-0.5",
              selectedSite ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {selectedSiteLabel}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        </button>

        {/* Horário */}
        <button
          onClick={() => setShowTimePicker(true)}
          className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(200,60%,95%), hsl(220,50%,95%))" }}>
            <Clock className="w-5 h-5" style={{ color: "hsl(210,50%,50%)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Horário</p>
            <p className="text-[15px] font-semibold text-foreground mt-0.5">{timeLabel}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        </button>

        {/* Medicamento */}
        <button
          onClick={() => setShowMedPicker(true)}
          className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(150,40%,95%), hsl(170,35%,95%))" }}>
            <Pill className="w-5 h-5" style={{ color: "hsl(160,40%,45%)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Medicamento</p>
            <p className="text-[15px] font-semibold text-foreground mt-0.5">{medication}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        </button>

        {/* Dose */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(30,50%,95%), hsl(15,45%,95%))" }}>
            <Gauge className="w-5 h-5" style={{ color: "hsl(20,50%,50%)" }} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Dose</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <input
                type="number"
                step="0.5"
                value={doseValue}
                onChange={(e) => setDoseValue(e.target.value)}
                className="w-16 text-[15px] font-semibold bg-transparent outline-none text-foreground tabular-nums"
              />
              <span className="text-[15px] font-medium text-muted-foreground">mg</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA Button ── */}
      <div className="px-5 mt-8 mb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-all disabled:opacity-50"
          style={{
            background: "linear-gradient(to right, #7B2FF7, #F857A6)",
            boxShadow: "0 8px 24px hsl(300 60% 50% / 0.2), 0 2px 8px hsl(270 80% 60% / 0.15)",
          }}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            "Confirmar aplicação"
          )}
        </button>
      </div>

      {/* ── Site Map Drawer ── */}
      <Drawer open={showSiteMap} onOpenChange={setShowSiteMap}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <h3 className="text-lg font-bold text-foreground text-center pt-2 mb-2">Selecione o local</h3>
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
                      "absolute w-8 h-8 rounded-full border-2 transition-all duration-200 -translate-x-1/2 -translate-y-1/2 active:scale-90",
                      selectedSite === site.id
                        ? "border-transparent shadow-elevated scale-110"
                        : "bg-muted/50 border-border/60"
                    )}
                    style={selectedSite === site.id ? {
                      background: "linear-gradient(135deg, #7B2FF7, #F857A6)",
                    } : { left: `${site.x}%`, top: `${site.y}%` }}
                    // Fix: always set position
                    {...(selectedSite === site.id ? { style: { left: `${site.x}%`, top: `${site.y}%`, background: "linear-gradient(135deg, #7B2FF7, #F857A6)" } } : { style: { left: `${site.x}%`, top: `${site.y}%` } })}
                  >
                    {selectedSite === site.id && (
                      <Check className="w-3.5 h-3.5 text-white mx-auto" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>
            {selectedSite && (
              <p className="text-center text-sm font-semibold text-foreground mb-3">
                {injectionSites.find(s => s.id === selectedSite)?.label}
              </p>
            )}
            <button
              onClick={() => setShowSiteMap(false)}
              className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-transform"
              style={{
                background: "linear-gradient(to right, #7B2FF7, #F857A6)",
                boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)",
              }}
            >
              Confirmar
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Time Picker Drawer */}
      <Drawer open={showTimePicker} onOpenChange={setShowTimePicker}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <h3 className="text-lg font-bold text-foreground text-center pt-2 mb-2">Horário da aplicação</h3>
            <div className="flex items-center justify-center gap-4 py-4">
              <ScrollColumn items={hours} selected={hour} onChange={(v) => setHour(v as string)} />
              <span className="text-2xl font-bold text-foreground">:</span>
              <ScrollColumn items={minutes} selected={minute} onChange={(v) => setMinute(v as string)} />
            </div>
            <button
              onClick={() => setShowTimePicker(false)}
              className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-transform"
              style={{
                background: "linear-gradient(to right, #7B2FF7, #F857A6)",
                boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)",
              }}
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
                    "w-full text-left px-5 py-3.5 rounded-xl text-[15px] font-medium transition-all active:scale-[0.98] flex items-center justify-between",
                    medication === med
                      ? "bg-primary/8 font-semibold"
                      : "text-foreground hover:bg-muted/60"
                  )}
                  style={medication === med ? { color: "hsl(270,60%,55%)" } : undefined}
                >
                  {med}
                  {medication === med && <Check className="w-4 h-4" style={{ color: "hsl(270,60%,55%)" }} />}
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
