import React, { useState } from "react";
import { ChevronLeft, ChevronDown, Gauge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

const DOSES = ["2.5", "5", "7.5", "10", "12.5", "15"];

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

const DosageInput = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { refresh } = useApplicationData();
  const currentDose = profile?.current_dose?.replace(/[^\d.]/g, "") || "5.0";

  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    DOSES.includes(currentDose) ? currentDose : null
  );
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const parsedDose = parseFloat(currentDose) || 5;
  const [doseInt, setDoseInt] = useState(String(Math.floor(parsedDose)));
  const [doseDec, setDoseDec] = useState(String(Math.round((parsedDose % 1) * 10)));
  const customDoseValue = `${doseInt}.${doseDec}`;

  const doseInts = Array.from({ length: 20 }, (_, i) => String(i));
  const doseDecimals = Array.from({ length: 10 }, (_, i) => String(i));

  const activeDose = selectedPreset || (showCustomPicker ? customDoseValue : null);
  const canContinue = !!activeDose && Number(activeDose) > 0;

  const handlePreset = (d: string) => {
    setSelectedPreset(d);
  };

  const handleCustomConfirm = () => {
    setSelectedPreset(null);
    setShowCustomPicker(false);
  };

  const handleSave = async () => {
    if (!user || !canContinue) return;
    const finalDose = selectedPreset || customDoseValue;
    const doseStr = `${finalDose} mg`;
    const { error } = await supabase
      .from("profiles")
      .update({ current_dose: doseStr })
      .eq("id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    await refreshProfile();
    await refresh();
    toast.success("Dosagem atualizada");
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

      <div className="px-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(30,50%,95%), hsl(15,45%,95%))" }}
          >
            <Gauge className="w-5 h-5" style={{ color: "hsl(20,50%,50%)" }} />
          </div>
          <h1 className="text-[22px] font-extrabold text-foreground tracking-tight">Dosagem</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium mt-1 ml-[52px]">Selecione sua dose atual em mg</p>
      </div>

      <div className="flex-1 px-5">
        {/* Preset dose cards */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {DOSES.map((d) => {
            const isSelected = selectedPreset === d;
            return (
              <button
                key={d}
                onClick={() => handlePreset(d)}
                className={cn(
                  "bg-card rounded-2xl border h-14 text-center font-bold text-foreground transition-all active:scale-[0.96]",
                  isSelected
                    ? "border-transparent"
                    : "border-border/40 shadow-card"
                )}
                style={isSelected ? {
                  boxShadow: "0 0 0 2px hsl(295 55% 42% / 0.3), 0 4px 16px hsl(300 60% 50% / 0.1)",
                } : undefined}
              >
                <span className="text-[15px]">{d} mg</span>
              </button>
            );
          })}
        </div>

        {/* Custom dose card */}
        <button
          onClick={() => {
            setSelectedPreset(null);
            setShowCustomPicker(true);
          }}
          className="w-full bg-card rounded-2xl border border-border/40 shadow-card px-5 py-4 flex items-center gap-4 active:scale-[0.98] transition-transform"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, hsl(30,50%,95%), hsl(15,45%,95%))" }}
          >
            <Gauge className="w-5 h-5" style={{ color: "hsl(20,50%,50%)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Dose personalizada</p>
            <p className={cn(
              "text-[15px] font-semibold mt-0.5",
              !selectedPreset ? "text-foreground" : "text-muted-foreground/50"
            )}>
              {!selectedPreset ? `${customDoseValue} mg` : "Escolher valor"}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40" />
        </button>
      </div>

      {/* CTA */}
      <div className="px-5 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <button
          onClick={handleSave}
          disabled={!canContinue}
          className="w-full py-4 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-all disabled:opacity-40 disabled:pointer-events-none"
          style={{
            background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
            boxShadow: "0 8px 24px hsl(300 60% 50% / 0.2), 0 2px 8px hsl(270 80% 60% / 0.15)",
          }}
        >
          Confirmar
        </button>
      </div>

      {/* Custom Dose Picker Drawer */}
      <Drawer open={showCustomPicker} onOpenChange={setShowCustomPicker}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <h3 className="text-lg font-bold text-foreground text-center pt-2 mb-2">Dose personalizada (mg)</h3>
            <div className="flex items-center justify-center gap-2 py-4">
              <ScrollColumn items={doseInts} selected={doseInt} onChange={(v) => setDoseInt(v as string)} />
              <span className="text-3xl font-bold text-foreground">,</span>
              <ScrollColumn items={doseDecimals} selected={doseDec} onChange={(v) => setDoseDec(v as string)} />
              <span className="text-lg font-semibold text-muted-foreground ml-2">mg</span>
            </div>
            <button
              onClick={handleCustomConfirm}
              className="w-full py-3.5 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-transform"
              style={{
                background: "linear-gradient(to right, hsl(295 55% 42%), hsl(340 65% 62%))",
                boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)",
              }}
            >
              Confirmar
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default DosageInput;
