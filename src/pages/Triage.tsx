import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, CheckCircle2, ThumbsUp, CalendarCheck, TrendingDown, Brain, ShieldCheck, Utensils, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTriageData, clearTriageData } from "@/hooks/useTriageStorage";
import { localDateStr } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import welcomeImg from "@/assets/onboarding-welcome.png";
import privacyImg from "@/assets/onboarding-privacy.png";
import celebrationImg from "@/assets/onboarding-celebration.png";
import treatmentImg from "@/assets/onboarding-treatment.png";
import personalImg from "@/assets/onboarding-personal.png";
import familyImg from "@/assets/onboarding-family.png";
import logoImg from "@/assets/logo-mounja.png";
import mascotPointingImg from "@/assets/mascot-pointing.png";
import WelcomeStep from "@/components/triage/WelcomeStep";
import PrivacyStep from "@/components/triage/PrivacyStep";
import MedicationStep from "@/components/triage/MedicationStep";
import ExperienceStep from "@/components/triage/ExperienceStep";
import MotivationStep from "@/components/triage/MotivationStep";
import AppPreviewStep from "@/components/triage/AppPreviewStep";
import HelpNeedsStep from "@/components/triage/HelpNeedsStep";
import ConfirmationStep from "@/components/triage/ConfirmationStep";
import TreatmentIntroStep from "@/components/triage/TreatmentIntroStep";
import AlternateSitesStep from "@/components/triage/AlternateSitesStep";
import ResultsChartStep from "@/components/triage/ResultsChartStep";

/* ─── Scroll Picker Component ─── */
const ScrollPicker = ({
  items,
  value,
  onChange,
  suffix,
  itemHeight = 44,
}: {
  items: (string | number)[];
  value: string | number;
  onChange: (v: string | number) => void;
  suffix?: string;
  itemHeight?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const snapTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const visibleItems = 5;
  const containerHeight = itemHeight * visibleItems;
  const padCount = Math.floor(visibleItems / 2);

  const snapToNearest = useCallback(() => {
    if (!containerRef.current) return;

    const idx = Math.round(containerRef.current.scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));

    isProgrammaticScrollRef.current = true;
    containerRef.current.scrollTo({ top: clamped * itemHeight, behavior: "auto" });
    onChange(items[clamped]);

    requestAnimationFrame(() => {
      isProgrammaticScrollRef.current = false;
    });
  }, [items, itemHeight, onChange]);

  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx < 0 || !containerRef.current) return;

    const targetTop = idx * itemHeight;
    // Force scroll position on mount and value changes
    isProgrammaticScrollRef.current = true;
    containerRef.current.scrollTop = targetTop;
    // Also schedule a rAF to ensure it sticks after layout
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = targetTop;
      }
      isProgrammaticScrollRef.current = false;
    });
  }, [value, items, itemHeight]);

  useEffect(() => {
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    };
  }, []);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || isProgrammaticScrollRef.current) return;

    const idx = Math.round(containerRef.current.scrollTop / itemHeight);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    const nextValue = items[clamped];

    if (nextValue !== value) onChange(nextValue);

    if (snapTimerRef.current) clearTimeout(snapTimerRef.current);
    snapTimerRef.current = setTimeout(snapToNearest, 140);
  }, [items, itemHeight, onChange, snapToNearest, value]);

  return (
    <div className="relative flex items-center justify-center gap-2">
      <div className="relative" style={{ height: containerHeight }}>
        {/* Selection highlight — gradient border, white bg */}
        <div
          className="absolute left-0 right-0 rounded-xl z-0 pointer-events-none"
          style={{
            top: padCount * itemHeight,
            height: itemHeight,
            background: "#fff",
            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
          }}
        />
        <div
          className="absolute left-0 right-0 rounded-xl z-0 pointer-events-none"
          style={{
            top: padCount * itemHeight,
            height: itemHeight,
            padding: 1.5,
            background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude" as any,
          }}
        />
        {/* Gradient masks */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-y-auto scrollbar-hide"
          style={{
            height: containerHeight,
            width: 128,
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            touchAction: "pan-y",
            position: "relative",
            zIndex: 5,
          }}
        >
          {/* Top padding */}
          {Array.from({ length: padCount }).map((_, i) => (
            <div key={`pad-top-${i}`} style={{ height: itemHeight }} />
          ))}
          {items.map((item, i) => {
            const isSelected = item === value;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-center transition-all duration-150 relative z-[1]",
                  isSelected ? "text-foreground text-xl font-bold" : "text-muted-foreground/50 text-base"
                )}
                style={{ height: itemHeight }}
                onClick={() => {
                  onChange(item);
                  containerRef.current?.scrollTo({ top: i * itemHeight, behavior: "smooth" });
                }}
              >
                {item}
              </div>
            );
          })}
          {/* Bottom padding */}
          {Array.from({ length: padCount }).map((_, i) => (
            <div key={`pad-bot-${i}`} style={{ height: itemHeight }} />
          ))}
        </div>
      </div>
      {suffix && <span className="text-lg font-semibold text-muted-foreground">{suffix}</span>}
    </div>
  );
};

/* ─── Step Data ─── */
const experienceOptions = [
  { value: "starting", label: "Estou começando!" },
  { value: "less_month", label: "Menos de 1 mês" },
  { value: "1_3_months", label: "1 – 3 meses" },
  { value: "4_12_months", label: "4 – 12 meses" },
  { value: "over_year", label: "Mais de 1 ano" },
  { value: "exploring", label: "Só explorando" },
];

const motivationOptions = [
  { value: "health_control", label: "Ter mais controle da minha saúde", description: "Acompanhar de perto cada etapa do tratamento com clareza." },
  { value: "energy", label: "Ter mais energia no dia a dia", description: "Pequenas mudanças que fazem diferença na disposição." },
  { value: "food_relationship", label: "Melhorar minha relação com a comida", description: "Entender seus padrões alimentares sem julgamento." },
  { value: "confidence", label: "Me sentir mais confiante no meu corpo", description: "Confiança começa em se sentir bem consigo. Vamos celebrar cada vitória." },
  { value: "last_resort", label: "Porque nada mais estava funcionando", description: "Você não está sozinho. Vamos encontrar o que funciona para você." },
];

const helpOptions = [
  { value: "consistency", label: "Constância no tratamento", highlight: "Constância", icon: CalendarCheck },
  { value: "weight_tracking", label: "Acompanhar perda de peso", highlight: "perda de peso", icon: TrendingDown },
  { value: "appetite", label: "Monitorar apetite e compulsão", highlight: "Monitorar", icon: Brain },
  { value: "side_effects", label: "Gerenciar efeitos colaterais", highlight: "colaterais", icon: ShieldCheck },
  { value: "nutrition", label: "Refeições e nutrição", highlight: "nutrição", icon: Utensils },
  { value: "motivation", label: "Manter a motivação", highlight: "motivação", icon: Trophy },
];

const injectionSites = [
  { value: "abdomen_left", label: "Abdômen esq.", x: 42, y: 52 },
  { value: "abdomen_right", label: "Abdômen dir.", x: 58, y: 52 },
  { value: "thigh_left", label: "Coxa esq.", x: 40, y: 72 },
  { value: "thigh_right", label: "Coxa dir.", x: 60, y: 72 },
  { value: "arm_left", label: "Braço esq.", x: 25, y: 40 },
  { value: "arm_right", label: "Braço dir.", x: 75, y: 40 },
];

const weekDays = [
  { short: "S", full: "Segunda" },
  { short: "T", full: "Terça" },
  { short: "Q", full: "Quarta" },
  { short: "Q", full: "Quinta" },
  { short: "S", full: "Sexta" },
  { short: "S", full: "Sábado" },
  { short: "D", full: "Domingo" },
];

// Generate arrays for pickers
const heightValues = Array.from({ length: 81 }, (_, i) => 140 + i); // 140-220 cm
const yearValues = Array.from({ length: 80 }, (_, i) => 2010 - i);  // 2010-1931
const weightKgValues = Array.from({ length: 161 }, (_, i) => 40 + i); // 40-200 kg
const weightDecimalValues = Array.from({ length: 10 }, (_, i) => i); // 0-9

const medications = [
  "Zepbound®",
  "Mounjaro®",
  "Tirzepatida",
  "Wegovy®",
  "Ozempic®",
  "Semaglutida",
  "Retatrutida",
];

/*
  Steps:
  0  Welcome
  1  Privacy
  2  Medication (auto-advance)
  3  Experience
  4  Motivation
  5  App preview
  6  Help needs
  7  Confirmation
  8  Treatment intro
  9  Dose input
  10 Injection site
  11 Alternate sites
  12 Frequency & schedule
  13 Last application date
  14 Dose interval
  15 Results motivation chart
  16 Personal intro
  17 Sex
  18 Height
  19 Birth year
  20 Current weight (picker)
  21 Weight goal (picker)
  22 Motivational calculation
  23 Health motivation (family)
  24 Creating plan (loading → save)
*/
const TOTAL_STEPS = 26;

const Triage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Engagement
  const [medication, setMedication] = useState("");
  const [experience, setExperience] = useState("");
  const [motivations, setMotivations] = useState<string[]>([]);
  const [helpNeeds, setHelpNeeds] = useState<string[]>([]);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Treatment
  const [doseValue, setDoseValue] = useState("");
  const [injectionSite, setInjectionSite] = useState("");
  const [alternatesSites, setAlternatesSites] = useState<boolean | null>(null);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("weekly");
  const [applicationDay, setApplicationDay] = useState(0);
  const [applicationTime, setApplicationTime] = useState("08:00");
  const [customIntervalDays, setCustomIntervalDays] = useState(7);
  const [lastApplicationDate, setLastApplicationDate] = useState("");
  const [doseIntervalDays, setDoseIntervalDays] = useState(7);

  // Personal
  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [heightCm, setHeightCm] = useState(165);
  const [birthYear, setBirthYear] = useState(1990);
  const [weightKg, setWeightKg] = useState(80);
  const [weightDecimal, setWeightDecimal] = useState(0);
  const [goalKg, setGoalKg] = useState(70);
  const [goalDecimal, setGoalDecimal] = useState(0);

  const currentWeight = weightKg + weightDecimal / 10;
  const goalWeight = goalKg + goalDecimal / 10;
  const weightDiff = Math.max(0, currentWeight - goalWeight);

  const toggleMotivation = (v: string) =>
    setMotivations((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleHelp = (v: string) =>
    setHelpNeeds((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const canAdvance = () => {
    switch (step) {
      case 1: return privacyAccepted;
      case 2: return !!medication;
      case 3: return !!experience;
      case 4: return motivations.length > 0;
      case 6: return helpNeeds.length > 0;
      case 9: return !!doseValue;
      case 10: return !!injectionSite;
      case 11: return alternatesSites !== null;
      case 13: return !!lastApplicationDate;
      case 16: return !!name;
      default: return true;
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      let nextStep = step + 1;
      // Skip interval step (14) for daily/weekly — auto-set interval
      if (nextStep === 14 && frequency !== "custom") {
        if (frequency === "daily") setDoseIntervalDays(1);
        if (frequency === "weekly") setDoseIntervalDays(7);
        nextStep = 15;
      }
      setStep(nextStep);
    }
  };
  const back = () => {
    if (step > 0) {
      let prevStep = step - 1;
      // Skip interval step (14) going back for daily/weekly
      if (prevStep === 14 && frequency !== "custom") prevStep = 13;
      setStep(prevStep);
    }
  };

  const deriveGoal = () => {
    if (motivations.includes("health_control")) return "weight_loss";
    if (motivations.includes("food_relationship")) return "glycemic_control";
    return "weight_loss";
  };

  const deriveIntervalDays = () => {
    if (frequency === "daily") return 1;
    if (frequency === "weekly") return 7;
    return customIntervalDays;
  };

  // Loading screen triggers save
  useEffect(() => {
    if (step === 24) {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // Transition to plan ready screen
            setTimeout(() => setStep(25), 400);
            return 100;
          }
          return prev + 2;
        });
      }, 60);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const triagePayload = {
        medication,
        experience,
        motivations,
        helpNeeds,
        doseValue,
        injectionSite,
        alternatesSites,
        frequency,
        applicationDay,
        applicationTime,
        customIntervalDays,
        doseIntervalDays,
        lastApplicationDate,
        name,
        sex,
        heightCm,
        birthYear,
        weightKg,
        weightDecimal,
        goalKg,
        goalDecimal,
      };

      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Save directly to profile
        saveTriageData(triagePayload);
        const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
        const cw = weightKg + weightDecimal / 10;
        const currentDose = doseValue ? `${doseValue} mg` : null;
        const age = new Date().getFullYear() - birthYear;
        const deriveGoal = () => {
          if (motivations.includes("health_control")) return "weight_loss";
          if (motivations.includes("food_relationship")) return "glycemic_control";
          return "weight_loss";
        };
        const deriveInterval = () => {
          if (doseIntervalDays) return doseIntervalDays;
          if (frequency === "daily") return 1;
          if (frequency === "weekly") return 7;
          return customIntervalDays;
        };
        await supabase.from("profiles").update({
          name, sex: sex || null, age, height_cm: heightCm,
          current_weight: cw, goal: deriveGoal(), current_dose: currentDose,
          medication: medication || null,
          weight_goal: goalKg + goalDecimal / 10,
          application_interval_days: deriveInterval(),
          application_day: weekDays[applicationDay] || null,
          application_frequency: frequency, triage_completed: true,
        } as any).eq("id", session.user.id);
        if (currentDose && lastApplicationDate) {
          await supabase.from("injections").insert({
            user_id: session.user.id, date: lastApplicationDate, dose: currentDose,
            site: injectionSite || null, notes: "Registrado via triagem inicial",
          });
        }
        await supabase.from("daily_logs").insert({
          user_id: session.user.id, date: localDateStr(), weight: cw,
        });
        clearTriageData();
        navigate("/");
        // Force page reload to refresh profile
        window.location.reload();
      } else {
        saveTriageData(triagePayload);
        navigate("/auth?mode=signup");
      }
    } catch {
      setSaving(false);
    }
  };

  // Progress bar
  const questionSteps = step >= 2 && step <= 23;
  const progressPct = questionSteps ? ((step - 1) / 22) * 100 : 0;
  const showBackInProgress = step > 0;
  // Auto-advance steps (no button)
   const noButtonSteps = [24, 25];
  const showNextBtn = !noButtonSteps.includes(step);

  const buttonLabel = step === 23 ? "Criar meu plano" : step === 8 ? "Vamos lá" : step === 7 ? "Perfeito, continuar" : step === 5 ? "Entendi, vamos lá" : step === 0 ? "Próximo" : "Continuar";

  const renderStep = () => {
    switch (step) {
      // ===== 0: Welcome =====
      case 0:
        return <WelcomeStep />;

      // ===== 1: Privacy =====
      case 1:
        return <PrivacyStep accepted={privacyAccepted} onToggle={() => setPrivacyAccepted(!privacyAccepted)} />;

      // ===== 2: Medication =====
      case 2:
        return (
          <MedicationStep
            medications={medications}
            selected={medication}
            onSelect={(med) => setMedication(med)}
          />
        );

      // ===== 3: Experience =====
      case 3:
        return (
          <ExperienceStep
            medication={medication || "seu medicamento"}
            options={experienceOptions}
            selected={experience}
            onSelect={(v) => setExperience(v)}
          />
        );

      // ===== 4: Motivation =====
      case 4:
        return (
          <MotivationStep
            options={motivationOptions}
            selected={motivations}
            onToggle={toggleMotivation}
          />
        );

      // ===== 5: App Preview =====
      case 5:
        return <AppPreviewStep />;

      // ===== 6: Help needs =====
      case 6:
        return (
          <HelpNeedsStep
            options={helpOptions}
            selected={helpNeeds}
            onToggle={toggleHelp}
          />
        );

      // ===== 7: Confirmation =====
      case 7:
        return <ConfirmationStep />;

      // ===== 8: Treatment intro =====
      case 8:
        return <TreatmentIntroStep />;

      // ===== 9: Dose input =====
      case 9:
        const commonDoses = medication === "Ozempic®" 
          ? ["0.25", "0.5", "1.0", "2.0"] 
          : medication === "Mounjaro®" 
          ? ["2.5", "5.0", "7.5", "10.0", "12.5", "15.0"] 
          : medication === "Wegovy®"
          ? ["0.25", "0.5", "1.0", "1.7", "2.4"]
          : medication === "Zepbound®"
          ? ["2.5", "5.0", "7.5", "10.0", "12.5", "15.0"]
          : ["0.25", "0.5", "1.0", "2.5", "5.0", "7.5", "10.0"];
        const GRAD = "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)";
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-xl font-extrabold text-center mb-6 mt-4" style={{ color: "#222" }}>
              Qual sua dose atual de {medication || "seu medicamento"}?
            </h1>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {commonDoses.map((dose) => {
                const isSelected = doseValue === dose;
                return (
                  <button key={dose} onClick={() => setDoseValue(dose)}
                    className="relative px-5 py-3 rounded-2xl text-base font-semibold transition-all"
                    style={{
                      background: "#fff",
                      color: isSelected ? "#111" : "#333",
                      border: isSelected ? "none" : "1.5px solid #E5E5E5",
                      boxShadow: isSelected ? "0 0 0 2px rgba(123,47,247,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                    }}>
                    {isSelected && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                        padding: 2, background: GRAD,
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor", maskComposite: "exclude",
                      }} />
                    )}
                    <span className="relative z-10">{dose} mg</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm" style={{ color: "#888" }}>Ou digite:</span>
              <div className="relative rounded-xl" style={{
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}>
                <input type="number" step="0.5" inputMode="decimal" value={doseValue}
                  onChange={(e) => setDoseValue(e.target.value)} placeholder="Ex: 7.5"
                  className="w-28 h-14 text-center text-xl font-bold rounded-xl outline-none peer"
                  style={{ background: "#fff", color: "#222", border: "1.5px solid #E5E5E5" }}
                  onFocus={(e) => { e.currentTarget.style.border = "none"; e.currentTarget.style.boxShadow = "none"; (e.currentTarget.parentElement!.querySelector('.grad-border') as HTMLElement)!.style.opacity = "1"; }}
                  onBlur={(e) => { e.currentTarget.style.border = "1.5px solid #E5E5E5"; (e.currentTarget.parentElement!.querySelector('.grad-border') as HTMLElement)!.style.opacity = "0"; }}
                />
                <div className="grad-border absolute inset-0 rounded-xl pointer-events-none transition-opacity" style={{
                  opacity: 0, padding: 2, background: GRAD,
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor", maskComposite: "exclude",
                }} />
              </div>
              <span className="text-lg font-semibold" style={{ color: "#888" }}>mg</span>
            </div>
          </div>
        );

      // ===== 10: Injection site =====
      case 10: {
        const SITE_GRAD = "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)";
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-xl font-extrabold text-foreground text-center mb-6 mt-4">Qual seu local habitual de aplicação?</h1>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-64 h-80">
                <svg viewBox="0 0 100 130" className="w-full h-full" fill="none" stroke="#D0D0D0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="triage-site-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7B2FF7" />
                      <stop offset="100%" stopColor="#F857A6" />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="15" r="10" />
                  <line x1="50" y1="25" x2="50" y2="70" />
                  <line x1="50" y1="35" x2="25" y2="50" />
                  <line x1="50" y1="35" x2="75" y2="50" />
                  <line x1="50" y1="70" x2="35" y2="110" />
                  <line x1="50" y1="70" x2="65" y2="110" />
                </svg>
                {injectionSites.map((site) => {
                  const isSel = injectionSite === site.value;
                  return (
                    <button key={site.value} onClick={() => setInjectionSite(site.value)}
                      className="absolute w-7 h-7 rounded-full transition-all -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: `${site.x}%`, top: `${site.y}%`,
                        background: isSel ? SITE_GRAD : "#E5E5E5",
                        border: "none",
                        boxShadow: isSel ? "0 0 0 4px rgba(123,47,247,0.15)" : "none",
                        transform: `translate(-50%, -50%) scale(${isSel ? 1.2 : 1})`,
                      }}>
                      {isSel && <div className="w-2.5 h-2.5 bg-white rounded-full mx-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
            {injectionSite && (
              <p className="text-center text-sm font-medium mb-4" style={{ color: "#333" }}>
                {injectionSites.find((s) => s.value === injectionSite)?.label}
              </p>
            )}
          </div>
        );
      }

      // ===== 11: Alternate sites =====
      case 11:
        return <AlternateSitesStep value={alternatesSites} onChange={setAlternatesSites} />;

      // ===== 12: Frequency =====
      case 12: {
        const SGRAD = "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)";
        return (
          <div className="flex-1 flex flex-col px-6 overflow-y-auto">
            <h1 className="text-xl font-extrabold text-foreground text-center mb-6 mt-4">Quando você aplica {medication || "seu medicamento"}?</h1>
            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground mb-2">Frequência</p>
              <div className="flex rounded-xl p-1" style={{ background: "#F5F5F5" }}>
                {(["daily", "weekly", "custom"] as const).map((f) => {
                  const isSel = frequency === f;
                  return (
                    <button key={f} onClick={() => setFrequency(f)}
                      className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all relative"
                      style={{
                        color: isSel ? "#222" : "#999",
                        fontWeight: isSel ? 700 : 500,
                        background: isSel ? "#fff" : "transparent",
                        boxShadow: isSel ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
                      }}>
                      {isSel && (
                        <div className="absolute inset-0 rounded-lg pointer-events-none" style={{
                          padding: 1.5, background: SGRAD,
                          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                          WebkitMaskComposite: "xor", maskComposite: "exclude" as any,
                        }} />
                      )}
                      <span className="relative z-10">{f === "daily" ? "Diário" : f === "weekly" ? "Semanal" : "Personalizado"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-border/50 mb-5" />
            {frequency === "weekly" && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-foreground mb-3">Dia da aplicação</p>
                <div className="flex gap-2 justify-center">
                  {weekDays.map((d, i) => {
                    const isSel = applicationDay === i;
                    return (
                      <button key={i} onClick={() => setApplicationDay(i)}
                        className="w-10 h-10 rounded-full text-sm font-semibold transition-all relative"
                        style={{
                          background: "#fff",
                          border: isSel ? "none" : "1.5px solid #E5E5E5",
                          color: isSel ? "#222" : "#999",
                          transform: isSel ? "scale(1.05)" : "scale(1)",
                          boxShadow: isSel ? "0 0 0 2px rgba(123,47,247,0.15)" : "none",
                        }}>
                        {isSel && (
                          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
                            padding: 2, background: SGRAD,
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor", maskComposite: "exclude" as any,
                          }} />
                        )}
                        <span className="relative z-10">{d.short}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {frequency === "custom" && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-foreground mb-3">Frequência de tratamento</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-foreground font-medium">A cada</span>
                  <ScrollPicker items={Array.from({ length: 28 }, (_, i) => i + 3)} value={customIntervalDays}
                    onChange={(v) => setCustomIntervalDays(v as number)} />
                  <span className="text-foreground font-medium">dias</span>
                </div>
              </div>
            )}
            <div className="border-t border-border/50 mb-5" />
            <div className="mb-3">
              <p className="text-sm font-semibold text-foreground mb-3">Horário da aplicação</p>
              <div className="flex items-center justify-center gap-2">
                <ScrollPicker
                  items={Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))}
                  value={applicationTime.split(":")[0]}
                  onChange={(v) => setApplicationTime(`${v}:${applicationTime.split(":")[1]}`)}
                />
                <span className="text-2xl font-bold text-muted-foreground">:</span>
                <ScrollPicker
                  items={["00", "15", "30", "45"]}
                  value={applicationTime.split(":")[1]}
                  onChange={(v) => setApplicationTime(`${applicationTime.split(":")[0]}:${v}`)}
                />
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: "#aaa" }}>Você pode ajustar esse horário depois</p>
          </div>
        );
      }

      // ===== 13: Last application date =====
      case 13:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-xl font-extrabold text-foreground text-center mb-1 mt-4">Quando foi sua última aplicação?</h1>
            <p className="text-sm text-center mb-4" style={{ color: "#999" }}>Usamos isso para calcular seu próximo dia automaticamente</p>
            <div className="flex-1 flex items-center justify-center">
              <Calendar
                mode="single"
                selected={lastApplicationDate ? new Date(lastApplicationDate + "T12:00:00") : undefined}
                onSelect={(date) => {
                  if (date) {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    setLastApplicationDate(`${yyyy}-${mm}-${dd}`);
                  }
                }}
                disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                locale={ptBR}
                className={cn("p-3 pointer-events-auto rounded-2xl bg-white")}
                style={{
                  border: "1.5px solid #E5E5E5",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                }}
              />
            </div>
            <p className="text-xs text-center mt-3" style={{ color: "#aaa" }}>Selecione o dia da sua última aplicação</p>
            {lastApplicationDate && (
              <p className="text-center text-sm font-semibold text-foreground mt-2">
                {format(new Date(lastApplicationDate + "T12:00:00"), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        );

      // ===== 14: Dose interval =====
      case 14:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-xl font-extrabold text-foreground text-center mb-1 mt-4">Defina seu intervalo de aplicação</h1>
            <p className="text-sm text-center mb-8" style={{ color: "#999" }}>A cada quantos dias você aplica?</p>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-4">
                <span className="text-lg font-medium text-foreground">A cada</span>
                <ScrollPicker items={Array.from({ length: 26 }, (_, i) => i + 3)} value={doseIntervalDays}
                  onChange={(v) => setDoseIntervalDays(v as number)} />
                <span className="text-lg font-medium text-foreground">dias</span>
              </div>
            </div>
          </div>
        );

      // ===== 15: Results motivation =====
      case 15:
        return <ResultsChartStep />;

      // ===== 16: Personal intro =====
      case 16:
        return (
          <div className="flex-1 flex flex-col items-center px-8" style={{ animation: "fadeUp 0.4s ease-out" }}>
            <h1 className="text-xl font-extrabold text-foreground text-center mt-2 mb-1">
              Vamos montar seu plano personalizado
            </h1>
            <p className="text-sm text-center mb-4" style={{ color: "#999" }}>
              Falta só um passo rápido
            </p>
            <div className="w-full">
              <label className="text-xs font-semibold block mb-1.5" style={{ color: "#888" }}>Como podemos te chamar?</label>
              <div className="relative">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  autoFocus
                  className="w-full px-4 py-3.5 rounded-2xl text-base outline-none transition-all duration-300 peer"
                  style={{
                    background: "#fff",
                    border: "1px solid #E5E5E5",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1px solid transparent";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(123,47,247,0.12)";
                    const gb = e.currentTarget.parentElement?.querySelector('.focus-grad') as HTMLElement;
                    if (gb) gb.style.opacity = "1";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1px solid #E5E5E5";
                    e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                    const gb = e.currentTarget.parentElement?.querySelector('.focus-grad') as HTMLElement;
                    if (gb) gb.style.opacity = "0";
                  }}
                />
                <div className="focus-grad absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300" style={{
                  opacity: 0, padding: 1.5,
                  background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor", maskComposite: "exclude" as any,
                }} />
              </div>
              <p className="text-xs mt-1.5" style={{ color: "#bbb" }}>Usaremos isso para personalizar sua experiência</p>
            </div>
            <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
          </div>
        );

      // ===== 17: Sex (auto-advance) =====
      case 17:
        const SGRAD = "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)";
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-xl font-extrabold text-foreground text-center mb-8 mt-4">Qual seu sexo biológico?</h1>
            <div className="space-y-3">
              {[
                { value: "F", label: "Feminino" },
                { value: "M", label: "Masculino" },
                { value: "other", label: "Outro" },
              ].map((opt) => {
                const isSel = sex === opt.value;
                return (
                  <button key={opt.value}
                    onClick={() => { setSex(opt.value); }}
                    className="w-full py-4 px-5 rounded-2xl text-base font-medium transition-all text-center relative"
                    style={{
                      background: "#fff",
                      color: isSel ? "#111" : "#666",
                      fontWeight: isSel ? 700 : 500,
                      border: isSel ? "none" : "1.5px solid #E5E5E5",
                      boxShadow: isSel ? "0 0 0 2px rgba(123,47,247,0.15)" : "0 1px 4px rgba(0,0,0,0.04)",
                    }}>
                    {isSel && (
                      <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
                        padding: 2, background: SGRAD,
                        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor", maskComposite: "exclude" as any,
                      }} />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ===== 18: Height =====
      case 18:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-4 mt-4">Qual sua altura?</h1>
            <div className="flex-1 flex items-center justify-center">
              <ScrollPicker items={heightValues} value={heightCm}
                onChange={(v) => setHeightCm(v as number)} suffix="cm" />
            </div>
          </div>
        );

      // ===== 19: Birth year =====
      case 19:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-4 mt-4">Qual seu ano de nascimento?</h1>
            <div className="flex-1 flex items-center justify-center">
              <ScrollPicker items={yearValues} value={birthYear}
                onChange={(v) => setBirthYear(v as number)} />
            </div>
          </div>
        );

      // ===== 20: Current weight =====
      case 20:
        return (
          <div className="flex-1 flex flex-col px-6" style={{ touchAction: "pan-y" }}>
            <h1 className="text-2xl font-bold text-foreground text-center mb-4 mt-4">Quanto você pesa?</h1>
            <div className="flex-1 flex items-center justify-center" style={{ overflow: "visible" }}>
              <div className="flex items-center gap-1">
                <ScrollPicker items={weightKgValues} value={weightKg}
                  onChange={(v) => setWeightKg(v as number)} />
                <span className="text-2xl font-bold text-muted-foreground mb-1">.</span>
                <ScrollPicker items={weightDecimalValues} value={weightDecimal}
                  onChange={(v) => setWeightDecimal(v as number)} />
                <span className="text-lg font-semibold text-muted-foreground ml-2">kg</span>
              </div>
            </div>
          </div>
        );

      // ===== 21: Weight goal =====
      case 21:
        return (
          <div className="flex-1 flex flex-col px-6" style={{ touchAction: "pan-y" }}>
            <h1 className="text-2xl font-bold text-foreground text-center mb-4 mt-4">Qual seu peso meta?</h1>
            <div className="flex-1 flex items-center justify-center" style={{ overflow: "visible" }}>
              <div className="flex items-center gap-1">
                <ScrollPicker items={weightKgValues} value={goalKg}
                  onChange={(v) => setGoalKg(v as number)} />
                <span className="text-2xl font-bold text-muted-foreground mb-1">.</span>
                <ScrollPicker items={weightDecimalValues} value={goalDecimal}
                  onChange={(v) => setGoalDecimal(v as number)} />
                <span className="text-lg font-semibold text-muted-foreground ml-2">kg</span>
              </div>
            </div>
          </div>
        );

      // ===== 22: Motivational calculation =====
      case 22:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            
            <h1 className="text-3xl font-bold text-foreground text-center leading-tight">
              Boa notícia! Perder{" "}
              <span style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{weightDiff.toFixed(1)} kg</span>{" "}
              é totalmente possível.
            </h1>
          </div>
        );

      // ===== 23: Health motivation =====
      case 23:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <h1 className="text-3xl font-bold text-foreground text-center leading-tight mb-6">
              Pesquisas mostram que manter um peso saudável leva a uma vida mais longa
            </h1>
            <p className="text-lg text-muted-foreground italic text-center">
              Mais tempo com quem você mais ama
            </p>
          </div>
        );

      // ===== 24: Creating plan (loading) =====
      case 24:
        return (
          <div className="z-50 flex flex-col items-center justify-center px-8"
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              width: "100vw", height: "100dvh",
              background: "#FAFAFA",
            }}>
            <div className="flex flex-col items-center w-full max-w-sm">
              {/* Animated icon */}
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 animate-scale-in"
                style={{
                  background: "linear-gradient(135deg, rgba(123,47,247,0.08) 0%, rgba(248,87,166,0.08) 100%)",
                  boxShadow: "0 4px 24px rgba(123,47,247,0.08)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)",
                  }}
                >
                  <div className="w-3 h-3 bg-white rounded-full" style={{ animation: "blob-float 1.5s ease-in-out infinite" }} />
                </div>
              </div>

              <h1 className="text-2xl font-extrabold text-center mb-2 animate-fade-in-up" style={{ color: "#222" }}>
                Montando seu plano ideal
              </h1>
              <p className="text-center mb-10 text-sm animate-fade-in-up" style={{ color: "#999", animationDelay: "0.15s" }}>
                Analisando seus dados e objetivos
              </p>

              {/* Progress bar */}
              <div className="w-full animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#E5E5E5" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${loadingProgress}%`,
                      background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)",
                    }}
                  />
                </div>
                <p className="text-xs text-center mt-3" style={{ color: "#bbb" }}>{Math.round(loadingProgress)}%</p>
              </div>
            </div>
          </div>
        );

      // ===== 25: Plan ready screen =====
      case 25: {
        const age = new Date().getFullYear() - birthYear;
        const projectedLoss = Math.min(weightDiff, Math.round((currentWeight * 0.025) * 10) / 10);
        const dayLabel = weekDays[applicationDay]?.full || "Segunda";
        const displayName = name?.trim().split(" ")[0];

        return (
          <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#FAFAFA" }}>
            <div className="min-h-full flex flex-col px-6 pt-6 pb-10">
              {/* Back button */}
              <button onClick={() => setStep(23)} className="self-start mb-4 text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              {/* Hero with mascot */}
              <div className="flex flex-col items-center text-center mb-6 animate-fade-in">
                <img
                  src={mascotPointingImg}
                  alt="Mascote"
                  className="w-28 h-28 object-contain mb-4"
                  style={{ filter: "drop-shadow(0 4px 16px rgba(123,47,247,0.10))" }}
                />
                <h1 className="text-2xl font-extrabold leading-tight mb-2" style={{ color: "#1A1A1A" }}>
                  {displayName
                    ? <>{displayName}, esse é o seu{" "}<span style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>plano ideal</span></>
                    : <>Seu <span style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>plano ideal</span> está pronto</>
                  }
                </h1>
                <p className="text-sm" style={{ color: "#888" }}>
                  Baseado no seu perfil, rotina e objetivos
                </p>
              </div>

              {/* Main value card */}
              <div
                className="rounded-3xl p-6 mb-5 animate-fade-in"
                style={{
                  background: "linear-gradient(135deg, rgba(123,47,247,0.06) 0%, rgba(248,87,166,0.06) 100%)",
                  border: "1px solid rgba(123,47,247,0.10)",
                  animationDelay: "0.1s",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)" }}>
                    <TrendingDown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: "#1A1A1A" }}>
                      Você pode perder até <span style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{projectedLoss.toFixed(1)} kg</span> nas próximas semanas
                    </p>
                  </div>
                </div>
                <p className="text-xs ml-[52px]" style={{ color: "#999" }}>Com consistência e acompanhamento</p>
              </div>

              {/* Summary - 3 items */}
              <div className="grid grid-cols-3 gap-3 mb-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                {[
                  { icon: Utensils, value: "1700 kcal", sub: "Déficit ideal para você" },
                  { icon: Trophy, value: "112g/dia", sub: "Para preservar massa magra" },
                  { icon: CalendarCheck, value: dayLabel, sub: "Consistência semanal" },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl p-3 text-center" style={{ background: "#fff", border: "1px solid #F0F0F0" }}>
                    <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(123,47,247,0.08), rgba(248,87,166,0.08))" }}>
                      <item.icon className="w-4 h-4" style={{ color: "#7B2FF7" }} />
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#1A1A1A" }}>{item.value}</p>
                    <p className="text-[10px] mt-1 leading-tight" style={{ color: "#AAA" }}>{item.sub}</p>
                  </div>
                ))}
              </div>

              {/* Personalization block */}
              <div className="rounded-2xl p-4 mb-5 animate-fade-in" style={{ background: "#fff", border: "1px solid #F0F0F0", animationDelay: "0.3s" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "#999" }}>Criado com base em:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    `${age} anos`,
                    `${currentWeight.toFixed(1)} kg`,
                    `Meta: ${goalWeight.toFixed(1)} kg`,
                  ].map((tag, i) => (
                    <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: "linear-gradient(135deg, rgba(123,47,247,0.06), rgba(248,87,166,0.06))", color: "#7B2FF7" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Scientific trust */}
              <p className="text-[11px] text-center mb-6 italic animate-fade-in" style={{ color: "#BBB", animationDelay: "0.35s" }}>
                Baseado em estudos clínicos sobre GLP-1
              </p>

              {/* Spacer */}
              <div className="flex-1" />

              {/* CTA */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full font-bold py-4 rounded-[28px] flex items-center justify-center gap-2 text-white shadow-elevated active:scale-[0.98] transition-all duration-300 animate-fade-in disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)",
                  animationDelay: "0.4s",
                }}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Quero começar meu plano"
                )}
              </button>

              <p className="text-[11px] text-center mt-3" style={{ color: "#CCC" }}>
                Salve seu plano para acessar quando quiser
              </p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative"
      style={{
        paddingTop: (questionSteps || step === 0) ? "calc(env(safe-area-inset-top, 0px) + 1rem)" : "env(safe-area-inset-top, 0px)",
      }}>

      {/* Progress bar */}
      {/* Back button for non-progress steps (24, 25) */}
      {showBackInProgress && !questionSteps && step !== 0 && (
        <div className="px-6 pt-2 pb-1 relative z-20">
          <button onClick={back} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
        </div>
      )}

      {/* Progress bar with back button */}
      {(questionSteps || step === 0) && (
        <div className="px-6 flex items-center gap-3 mb-2 relative z-20">
          {showBackInProgress && (
            <button onClick={back} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
          )}
          <div className="flex-1 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
            <div className="h-full gradient-hero rounded-full transition-all duration-500"
              style={{ width: `${step === 0 ? 2 : progressPct}%` }} />
          </div>
        </div>
      )}

      {renderStep()}

      {showNextBtn && (
        <div className="px-6 pb-8 pt-4 relative z-20" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}>
          <button onClick={next} disabled={!canAdvance() || saving}
            className={cn("w-full font-bold py-4 rounded-[28px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]",
              canAdvance()
                ? "gradient-hero text-primary-foreground shadow-elevated"
                : "bg-muted text-muted-foreground",
              step === 15 && canAdvance() && "cta-pulse-active")}>
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default Triage;
