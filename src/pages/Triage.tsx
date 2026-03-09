import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, ThumbsUp, CalendarCheck, TrendingDown, Brain, ShieldCheck, Utensils, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveTriageData } from "@/hooks/useTriageStorage";
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
        {/* Selection highlight */}
        <div
          className="absolute left-0 right-0 bg-muted rounded-xl z-0 pointer-events-none"
          style={{ top: padCount * itemHeight, height: itemHeight }}
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
  { value: "consistency", label: "Constância no tratamento", icon: CalendarCheck },
  { value: "weight_tracking", label: "Acompanhar perda de peso", icon: TrendingDown },
  { value: "appetite", label: "Monitorar apetite e compulsão", icon: Brain },
  { value: "side_effects", label: "Gerenciar efeitos colaterais", icon: ShieldCheck },
  { value: "nutrition", label: "Refeições e nutrição", icon: Utensils },
  { value: "motivation", label: "Manter a motivação", icon: Trophy },
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
const TOTAL_STEPS = 25;

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
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };
  const back = () => { if (step > 0) setStep(step - 1); };

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
            handleSave();
            return 100;
          }
          return prev + 2;
        });
      }, 60);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    try {
      saveTriageData({
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
      });
      navigate("/auth?mode=signup");
    } catch {
      setSaving(false);
    }
  };

  // Progress bar
  const questionSteps = step >= 2 && step <= 23;
  const progressPct = questionSteps ? ((step - 1) / 22) * 100 : 0;
  const stepsWithBack = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23];
  const showBackInProgress = stepsWithBack.includes(step);
  // Auto-advance steps (no button)
   const noButtonSteps = [24];
  const showNextBtn = !noButtonSteps.includes(step);

  const buttonLabel = step === 23 ? "Criar meu plano" : step === 0 ? "Próximo" : "Continuar";

  const renderStep = () => {
    switch (step) {
      // ===== 0: Welcome =====
      case 0:
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <h1 className="text-3xl font-extrabold text-foreground leading-tight">
              Tudo que você precisa para o seu tratamento
            </h1>
          </div>
        );

      // ===== 1: Privacy =====
      case 1:
        return (
          <div className="flex-1 flex flex-col px-8">
            
            <div className="flex-1 flex flex-col items-center">
              <img src={privacyImg} alt="Privacidade" className="w-48 h-48 object-contain mb-6" />
              <h1 className="text-2xl font-bold text-foreground text-left w-full mb-4">Saúde com privacidade</h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                O Mounjá existe para te ajudar a acompanhar e entender seu progresso, não para fornecer aconselhamento médico.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                Seus dados são tratados com total segurança, seguindo todas as normas da <span className="font-semibold text-foreground">LGPD (Lei Geral de Proteção de Dados)</span>. Não vendemos seus dados e você pode solicitar a exclusão a qualquer momento.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ao usar o Mounjá, você consente com a coleta e uso das suas informações de saúde exclusivamente para melhorar sua experiência no aplicativo.
              </p>
            </div>
            <label className="flex items-start gap-3 mb-4 cursor-pointer select-none">
              <button onClick={() => setPrivacyAccepted(!privacyAccepted)}
                className={cn("w-6 h-6 min-w-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5",
                  privacyAccepted ? "bg-triage-action border-triage-action" : "border-border")}>
                {privacyAccepted && <Check className="w-4 h-4 text-background" />}
              </button>
              <span className="text-xs text-muted-foreground leading-relaxed">
                Concordo com a coleta das minhas informações de saúde conforme as normas da LGPD.
              </span>
            </label>
          </div>
        );

      // ===== 2: Medication (auto-advance) =====
      case 2:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-extrabold text-foreground text-center mt-6 mb-8">
              Qual medicamento você usa?
            </h1>
            <div className="space-y-3">
              {medications.map((med) => (
                <button
                  key={med}
                  onClick={() => { setMedication(med); }}
                  className={cn(
                    "w-full py-4 px-6 rounded-full text-base font-semibold text-center active:scale-[0.98] transition-all",
                    medication === med ? "bg-triage-action text-white" : "bg-muted text-foreground"
                  )}
                >
                  {med}
                </button>
              ))}
            </div>
          </div>
        );

      // ===== 3: Experience (auto-advance) =====
      case 3:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-8 mt-4">
              Há quanto tempo você usa {medication || "seu medicamento"}?
            </h1>
            <div className="space-y-3">
              {experienceOptions.map((opt) => (
                <button key={opt.value}
                  onClick={() => { setExperience(opt.value); }}
                  className={cn("w-full py-4 px-5 rounded-2xl text-base font-medium transition-all text-left",
                    experience === opt.value ? "bg-triage-action text-white" : "bg-muted text-foreground")}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      // ===== 4: Motivation =====
      case 4:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-4">Por que você começou o tratamento?</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Escolha quantas quiser</p>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {motivationOptions.map((opt) => {
                const selected = motivations.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => toggleMotivation(opt.value)}
                    className={cn("w-full py-4 px-5 rounded-2xl text-left transition-all border-2",
                      selected ? "bg-triage-action/10 border-triage-action" : "bg-muted border-transparent")}>
                    <div className="flex items-center justify-between">
                      <span className={cn("font-medium", selected && "text-foreground")}>{opt.label}</span>
                      <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center",
                        selected ? "bg-triage-action border-triage-action" : "border-muted-foreground/30")}>
                        {selected && <Check className="w-3.5 h-3.5 text-background" />}
                      </div>
                    </div>
                    {selected && <p className="text-sm text-muted-foreground mt-2">{opt.description}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ===== 5: App Preview =====
      case 5:
        return (
          <div className="flex-1 flex flex-col items-center px-8">
            <div className="bg-card rounded-3xl shadow-elevated p-6 w-full max-w-xs mx-auto mb-8">
              <p className="text-center font-semibold text-foreground mb-3">
                {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </p>
              <div className="flex justify-center gap-3 mb-4">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <div key={i} className="text-center">
                    <span className="text-[10px] text-muted-foreground">{d}</span>
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs mt-1",
                      i === 3 ? "bg-triage-action text-white font-bold" : "text-muted-foreground")}>
                      {new Date().getDate() - 3 + i}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">Próximo tratamento</p>
              <p className="text-center text-4xl font-bold text-foreground">3 dias</p>
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center mb-4">O Mounjá é muito mais que um rastreador</h1>
            <div className="space-y-4 w-full">
              {["Registre suas doses e nunca mais tenha dúvidas sobre sua rotina",
                "Veja seu progresso ao longo do tempo com peso, apetite e energia",
                "Fique à frente dos efeitos colaterais acompanhando padrões e tendências",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-triage-action min-w-6 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      // ===== 6: Help needs =====
      case 6:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-4">Como podemos te ajudar?</h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Escolha quantas quiser</p>
            <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
              {helpOptions.map((opt) => {
                const selected = helpNeeds.includes(opt.value);
                return (
                  <button key={opt.value} onClick={() => toggleHelp(opt.value)}
                    className={cn("flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all text-center",
                      selected ? "border-triage-action bg-triage-action/10" : "border-border bg-card")}>
                    <opt.icon className={cn("w-7 h-7", selected ? "text-triage-action" : "text-muted-foreground")} />
                    <span className="text-sm font-semibold text-foreground leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ===== 7: Confirmation =====
      case 7:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <h1 className="text-3xl font-bold text-foreground text-center mb-8">Entendido! Vamos te ajudar a:</h1>
            <div className="space-y-6 w-full">
              {["Acompanhar seu tratamento facilmente e construir uma rotina que funcione para você.",
                "Ver seu progresso se desenrolar e manter o rumo certo.",
                "Ficar à frente dos efeitos colaterais e encontrar o que ajuda.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-4">
                  <CheckCircle2 className="w-7 h-7 text-triage-action min-w-7 mt-0.5" />
                  <p className="text-base text-foreground/80">{text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      // ===== 8: Treatment intro =====
      case 8:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <h1 className="text-3xl font-bold text-foreground text-center leading-tight">
              Agora vamos conhecer melhor o seu tratamento
            </h1>
          </div>
        );

      // ===== 9: Dose input =====
      case 9:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-12 mt-4">Qual sua dose atual de {medication || "seu medicamento"}?</h1>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <input type="number" step="0.5" inputMode="decimal" value={doseValue}
                  onChange={(e) => setDoseValue(e.target.value)} placeholder="5.0"
                  className="w-24 h-16 text-center text-2xl font-bold border-2 border-triage-action/30 rounded-xl bg-card text-foreground focus:border-triage-action focus:ring-2 focus:ring-triage-action/20 outline-none" />
                <span className="text-xl font-semibold text-muted-foreground">mg</span>
              </div>
            </div>
          </div>
        );

      // ===== 10: Injection site =====
      case 10:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-6 mt-4">Qual seu local habitual de aplicação?</h1>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-64 h-80">
                <svg viewBox="0 0 100 130" className="w-full h-full" fill="none" stroke="hsl(var(--border))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="50" cy="15" r="10" />
                  <line x1="50" y1="25" x2="50" y2="70" />
                  <line x1="50" y1="35" x2="25" y2="50" />
                  <line x1="50" y1="35" x2="75" y2="50" />
                  <line x1="50" y1="70" x2="35" y2="110" />
                  <line x1="50" y1="70" x2="65" y2="110" />
                </svg>
                {injectionSites.map((site) => {
                  const selected = injectionSite === site.value;
                  return (
                    <button key={site.value} onClick={() => setInjectionSite(site.value)}
                      className={cn("absolute w-6 h-6 rounded-full border-2 transition-all -translate-x-1/2 -translate-y-1/2",
                        selected ? "bg-triage-action border-triage-action scale-125" : "bg-card border-muted-foreground/30 hover:border-triage-action/50")}
                      style={{ left: `${site.x}%`, top: `${site.y}%` }}>
                      {selected && <div className="w-2 h-2 bg-background rounded-full mx-auto" />}
                    </button>
                  );
                })}
              </div>
            </div>
            {injectionSite && (
              <p className="text-center text-sm font-medium text-foreground mb-4">
                {injectionSites.find((s) => s.value === injectionSite)?.label}
              </p>
            )}
          </div>
        );

      // ===== 11: Alternate sites =====
      case 11:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-6 mt-4">Você alterna o local de aplicação entre as doses?</h1>
            <div className="space-y-4">
              <button onClick={() => setAlternatesSites(true)}
                className={cn("w-full p-5 rounded-2xl border-2 text-left transition-all",
                  alternatesSites === true ? "border-triage-action bg-triage-action/10" : "border-border bg-card")}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    alternatesSites === true ? "bg-triage-action border-triage-action" : "border-muted-foreground/30")}>
                    {alternatesSites === true && <Check className="w-3.5 h-3.5 text-background" />}
                  </div>
                  <span className="font-bold text-foreground">Sim, eu alterno</span>
                </div>
                <p className="text-sm text-muted-foreground ml-9">Troco entre os lados entre as doses</p>
                {alternatesSites === true && (
                  <div className="ml-9 mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                    <ThumbsUp className="w-3.5 h-3.5" /> Recomendado
                  </div>
                )}
              </button>
              <button onClick={() => setAlternatesSites(false)}
                className={cn("w-full p-5 rounded-2xl border-2 text-left transition-all",
                  alternatesSites === false ? "border-triage-action bg-triage-action/10" : "border-border bg-card")}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    alternatesSites === false ? "bg-triage-action border-triage-action" : "border-muted-foreground/30")}>
                    {alternatesSites === false && <Check className="w-3.5 h-3.5 text-background" />}
                  </div>
                  <span className="font-bold text-foreground">Não, mantenho o mesmo</span>
                </div>
                <p className="text-sm text-muted-foreground ml-9">Uso sempre o mesmo local</p>
              </button>
            </div>
          </div>
        );

      // ===== 12: Frequency =====
      case 12:
        return (
          <div className="flex-1 flex flex-col px-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-foreground text-center mb-6 mt-4">Quando você aplica {medication || "seu medicamento"}?</h1>
            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground mb-2">Frequência</p>
              <div className="flex bg-muted rounded-xl p-1">
                {(["daily", "weekly", "custom"] as const).map((f) => (
                  <button key={f} onClick={() => setFrequency(f)}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all",
                      frequency === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
                    {f === "daily" ? "Diário" : f === "weekly" ? "Semanal" : "Personalizado"}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border/50 mb-5" />
            {frequency === "weekly" && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-foreground mb-3">Dia da aplicação</p>
                <div className="flex gap-2 justify-center">
                  {weekDays.map((d, i) => (
                    <button key={i} onClick={() => setApplicationDay(i)}
                      className={cn("w-10 h-10 rounded-full text-sm font-semibold transition-all",
                        applicationDay === i ? "bg-foreground text-background" : "text-muted-foreground")}>
                      {d.short}
                    </button>
                  ))}
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
            <div className="mb-5">
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
          </div>
        );

      // ===== 13: Last application date =====
      case 13:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-4">Quando foi sua última aplicação?</h1>
            <p className="text-sm text-muted-foreground text-center mb-4">Isso nos ajuda a calcular seu próximo tratamento</p>
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
                className={cn("p-3 pointer-events-auto rounded-2xl border-2 border-triage-action/30 bg-card shadow-card")}
              />
            </div>
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
            <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-4">De quantos em quantos dias você aplica?</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">Qual o intervalo entre suas doses?</p>
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
        return (
          <div className="flex-1 flex flex-col items-center px-8">
            <h1 className="text-3xl font-bold text-foreground text-center mb-8">O Mounjá gera resultados duradouros</h1>
            <div className="bg-card rounded-2xl shadow-card p-6 w-full">
              <p className="font-semibold text-foreground mb-4">Seu peso</p>
              <svg viewBox="0 0 280 120" className="w-full h-32">
                <line x1="0" y1="30" x2="280" y2="30" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" />
                <line x1="0" y1="70" x2="280" y2="70" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="4" />
                <path d="M 10 40 C 60 35, 100 60, 140 55 C 180 50, 220 25, 270 20" fill="none" stroke="hsl(0, 72%, 51%)" strokeWidth="2.5" />
                <text x="220" y="15" fill="hsl(var(--muted-foreground))" fontSize="8">Dieta tradicional</text>
                <path d="M 10 40 C 60 50, 100 70, 140 85 C 180 95, 220 98, 270 100" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.5" />
                <text x="15" y="108" fill="hsl(var(--primary))" fontSize="9" fontWeight="bold">Mounjá</text>
                <circle cx="10" cy="40" r="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="2" />
                <circle cx="270" cy="100" r="4" fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth="2" />
              </svg>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Mês 1</span><span>Mês 6</span>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Muitos usuários alcançam perda de peso sustentável com uso consistente
              </p>
            </div>
          </div>
        );

      // ===== 16: Personal intro =====
      case 16:
        return (
          <div className="flex-1 flex flex-col items-center px-8">
            <h1 className="text-2xl font-bold text-foreground text-center mt-2 mb-2">
              Agora vamos te conhecer melhor
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Isso nos ajuda a personalizar sua experiência no Mounjá
            </p>
            <div className="w-full mb-6">
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Seu nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como quer ser chamado?"
                className="w-full px-4 py-3.5 rounded-2xl border border-border bg-card text-base focus:ring-2 focus:ring-foreground/20 focus:border-foreground outline-none" />
            </div>
            <div className="flex-1 flex items-center justify-center">
              <img src={personalImg} alt="Personalizar" className="w-56 h-56 object-contain" />
            </div>
          </div>
        );

      // ===== 17: Sex (auto-advance) =====
      case 17:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-8 mt-4">Qual seu sexo biológico?</h1>
            <div className="space-y-3">
              {[
                { value: "F", label: "Feminino" },
                { value: "M", label: "Masculino" },
                { value: "other", label: "Outro" },
              ].map((opt) => (
                <button key={opt.value}
                  onClick={() => { setSex(opt.value); }}
                  className={cn("w-full py-4 px-5 rounded-2xl text-base font-medium transition-all text-center",
                    sex === opt.value ? "bg-triage-action text-white" : "bg-muted text-foreground")}>
                  {opt.label}
                </button>
              ))}
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
              <span className="text-primary">{weightDiff.toFixed(1)} kg</span>{" "}
              é totalmente possível.
            </h1>
          </div>
        );

      // ===== 23: Health motivation =====
      case 23:
        return (
          <div className="flex-1 flex flex-col items-center px-8">
            
            <h1 className="text-2xl font-bold text-foreground text-center mt-4 mb-6 leading-tight">
              Pesquisas mostram que manter um peso saudável leva a uma vida mais longa
            </h1>
            <div className="flex-1 flex items-center justify-center">
              <img src={familyImg} alt="Família" className="w-72 h-72 object-contain" />
            </div>
            <p className="text-muted-foreground italic text-center mb-4">
              Mais tempo com quem você mais ama
            </p>
          </div>
        );

      // ===== 24: Creating plan (loading) =====
      case 24:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-8"
            style={{ background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.9) 100%)" }}>
            <div className="w-32 h-32 rounded-full bg-primary-foreground/20 flex items-center justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-primary-foreground/30 flex items-center justify-center">
                <span className="text-4xl">📋</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-primary-foreground text-center mb-3">
              Criando seu plano personalizado
            </h1>
            <p className="text-primary-foreground/70 text-center mb-8">
              Pessoas que acompanham seu tratamento têm até 175% mais chances de alcançar seus objetivos
            </p>
            <div className="w-full max-w-xs">
              <div className="h-2 bg-primary-foreground/20 rounded-full overflow-hidden">
                <div className="h-full bg-primary-foreground rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative"
      style={{ paddingTop: questionSteps ? "calc(env(safe-area-inset-top, 0px) + 1rem)" : "env(safe-area-inset-top, 0px)" }}>

      {/* Progress bar */}
      {questionSteps && (
        <div className="px-6 flex items-center gap-3 mb-2">
          {showBackInProgress && (
            <button onClick={back} className="text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
          )}
          <div className="flex-1 h-1.5 bg-foreground/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {renderStep()}

      {showNextBtn && (
        <div className="px-6 pb-8 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}>
          <button onClick={next} disabled={!canAdvance() || saving}
            className={cn("w-full font-bold py-4 rounded-[28px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]",
              canAdvance() ? "bg-triage-action text-white shadow-elevated" : "bg-muted text-muted-foreground")}>
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default Triage;
