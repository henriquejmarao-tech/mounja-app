import { useState, useEffect, useRef } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import mascotImg from "@/assets/mascot-thinking.png";

const DOSES = ["2.5", "5", "7.5", "10", "12.5", "15"];
const L1 = "Se você não tiver certeza, tudo bem.";
const L2 = "Você pode ajustar isso depois.";
const GRADIENT = "linear-gradient(135deg, hsl(295 55% 42%), hsl(340 65% 62%), hsl(15 75% 75%))";

const DosageInput = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { refresh } = useApplicationData();
  const currentDose = profile?.current_dose?.replace(/[^\d.]/g, "") || "";
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    DOSES.includes(currentDose) ? currentDose : null
  );
  const [customDose, setCustomDose] = useState(
    DOSES.includes(currentDose) ? "" : currentDose
  );
  const [inputFocused, setInputFocused] = useState(false);

  // Mascot & bubble animation
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
    const d = 1000 / L1.length;
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++; setDisplayedL1(L1.slice(0, i));
      if (i >= L1.length) { clearInterval(intervalRef.current); setTimeout(() => setTypingLine(2), 300); }
    }, d);
    return () => clearInterval(intervalRef.current);
  }, [typingLine]);

  useEffect(() => {
    if (typingLine !== 2) return;
    const d = 1200 / L2.length;
    let i = 0;
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

  const activeDose = selectedPreset || customDose;
  const canContinue = !!activeDose && Number(activeDose) > 0;

  const handlePreset = (d: string) => {
    setSelectedPreset(d);
    setCustomDose("");
  };

  const handleCustomChange = (v: string) => {
    setCustomDose(v);
    if (v) setSelectedPreset(null);
  };

  const handleSave = async () => {
    if (!user || !canContinue) return;
    const doseStr = `${activeDose} mg`;
    const { error } = await supabase
      .from("profiles")
      .update({ current_dose: doseStr })
      .eq("id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Dosagem atualizada");
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
          <Progress value={50} className="flex-1 h-2" />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-y-auto">
        {/* Mascot + Bubble */}
        <div className="flex items-end gap-3 mt-4 mb-4">
          <div className="shrink-0 relative">
            <img
              src={mascotImg}
              alt="Mounjá"
              className="w-20 h-auto object-contain relative z-10 transition-all duration-700 ease-out"
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
              <p className="text-[0.82rem] text-foreground leading-relaxed min-h-[1.3em]">
                {displayedL1}
                {typingLine === 1 && showCursor && (
                  <span className="inline-block w-[2px] h-[0.82em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                )}
              </p>
              {typingLine >= 2 && (
                <p className="text-[0.85rem] font-semibold text-foreground leading-relaxed mt-1 min-h-[1.3em]">
                  {displayedL2}
                  {showCursor && typingLine < 3 && (
                    <span className="inline-block w-[2px] h-[0.85em] bg-foreground/50 ml-0.5 align-text-bottom animate-pulse" />
                  )}
                </p>
              )}
              {/* Tail */}
              <div
                className="absolute w-3 h-3 bg-card border-l border-b border-border/40 rotate-45"
                style={{ bottom: 12, left: -5 }}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-extrabold text-foreground text-center mb-1">
          Qual a sua dose atual?
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-5">
          Selecione ou digite o valor em mg
        </p>

        {/* Dose grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {DOSES.map((d) => {
            const isSelected = selectedPreset === d;
            return (
              <button
                key={d}
                onClick={() => handlePreset(d)}
                className="relative rounded-2xl h-14 text-center font-bold text-foreground transition-all duration-300"
                style={{
                  transform: isSelected ? "scale(1.03)" : "scale(1)",
                  boxShadow: isSelected
                    ? "0 0 16px hsl(340 65% 62% / 0.18)"
                    : "0 1px 6px hsl(0 0% 0% / 0.05)",
                }}
              >
                {/* Background */}
                <div className="absolute inset-0 rounded-2xl bg-card border border-border/50" />
                {/* Gradient border when selected */}
                {isSelected && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      padding: 2,
                      background: GRADIENT,
                      WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      WebkitMaskComposite: "xor",
                      maskComposite: "exclude",
                    }}
                  />
                )}
                <span className="relative z-10 text-base">{d} mg</span>
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        <div className="flex flex-col items-center gap-1.5 mb-4">
          <div
            className="relative rounded-2xl transition-all duration-300"
            style={{
              boxShadow: inputFocused ? "0 0 16px hsl(340 65% 62% / 0.15)" : "0 1px 4px hsl(0 0% 0% / 0.04)",
            }}
          >
            <div className="absolute inset-0 rounded-2xl bg-card border border-border/50" />
            {inputFocused && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  padding: 2,
                  background: GRADIENT,
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
            )}
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={customDose}
              onChange={(e) => handleCustomChange(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ex: 7.5"
              className="relative z-10 w-40 h-14 text-center text-xl font-bold text-foreground bg-transparent outline-none placeholder:text-muted-foreground/50 rounded-2xl"
            />
          </div>
          <span className="text-xs text-muted-foreground">Valor em miligramas (mg)</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-8">
        <button
          onClick={handleSave}
          disabled={!canContinue}
          className="w-full py-4 rounded-full text-primary-foreground text-base font-bold active:scale-[0.98] transition-all shadow-elevated disabled:opacity-40 disabled:pointer-events-none"
          style={{ background: GRADIENT }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default DosageInput;
