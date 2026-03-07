import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn, localDateStr } from "@/lib/utils";

import welcomeImg from "@/assets/onboarding-welcome.png";
import privacyImg from "@/assets/onboarding-privacy.png";
import celebrationImg from "@/assets/onboarding-celebration.png";
import logoImg from "@/assets/logo-mounja.png";

const TOTAL_STEPS = 9;

// Step data
const experienceOptions = [
  { value: "starting", label: "Estou começando!" },
  { value: "less_month", label: "Menos de 1 mês" },
  { value: "1_3_months", label: "1 – 3 meses" },
  { value: "4_12_months", label: "4 – 12 meses" },
  { value: "over_year", label: "Mais de 1 ano" },
  { value: "exploring", label: "Só explorando" },
];

const motivationOptions = [
  {
    value: "health_control",
    label: "Ter mais controle da minha saúde",
    description: "Acompanhar de perto cada etapa do tratamento com clareza.",
  },
  {
    value: "energy",
    label: "Ter mais energia no dia a dia",
    description: "Pequenas mudanças que fazem diferença na disposição.",
  },
  {
    value: "food_relationship",
    label: "Melhorar minha relação com a comida",
    description: "Entender seus padrões alimentares sem julgamento.",
  },
  {
    value: "confidence",
    label: "Me sentir mais confiante no meu corpo",
    description: "Confiança começa em se sentir bem consigo. Vamos celebrar cada vitória.",
  },
  {
    value: "last_resort",
    label: "Porque nada mais estava funcionando",
    description: "Você não está sozinho. Vamos encontrar o que funciona para você.",
  },
];

const helpOptions = [
  { value: "consistency", label: "Manter a constância no tratamento", emoji: "✅✅✅" },
  { value: "weight_tracking", label: "Acompanhar minha perda de peso", emoji: "📉" },
  { value: "appetite", label: "Monitorar apetite e compulsão", emoji: "🍕" },
  { value: "side_effects", label: "Gerenciar efeitos colaterais", emoji: "🧘‍♀️" },
  { value: "nutrition", label: "Registrar refeições e nutrição", emoji: "🥗" },
  { value: "motivation", label: "Manter a motivação em alta", emoji: "🏆" },
];

const doses = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];

const Triage = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Engagement data (not saved to DB but enrich experience)
  const [experience, setExperience] = useState("");
  const [motivations, setMotivations] = useState<string[]>([]);
  const [helpNeeds, setHelpNeeds] = useState<string[]>([]);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Profile data (saved to DB)
  const [name, setName] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentDose, setCurrentDose] = useState("");
  const [lastApplicationDate, setLastApplicationDate] = useState("");
  const [goal, setGoal] = useState("");

  const toggleMotivation = (v: string) =>
    setMotivations((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleHelp = (v: string) =>
    setHelpNeeds((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const canAdvance = () => {
    switch (step) {
      case 2: return privacyAccepted;
      case 3: return !!experience;
      case 4: return motivations.length > 0;
      case 6: return helpNeeds.length > 0;
      case 8: return name && currentWeight && currentDose && lastApplicationDate;
      default: return true;
    }
  };

  const next = () => {
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
    else handleSave();
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  // Map motivations to goal
  const deriveGoal = () => {
    if (motivations.includes("health_control")) return "weight_loss";
    if (motivations.includes("food_relationship")) return "glycemic_control";
    return "weight_loss";
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const derivedGoal = goal || deriveGoal();
      const { error } = await supabase
        .from("profiles")
        .update({
          name,
          current_weight: currentWeight ? parseFloat(currentWeight) : null,
          goal: derivedGoal,
          current_dose: currentDose,
          triage_completed: true,
        } as any)
        .eq("id", user.id);

      if (error) throw error;

      if (currentDose && lastApplicationDate) {
        await supabase.from("injections").insert({
          user_id: user.id,
          date: lastApplicationDate,
          dose: currentDose,
          site: null,
          notes: "Registrado via triagem inicial",
        });
      }

      if (currentWeight) {
        await supabase.from("daily_logs").insert({
          user_id: user.id,
          date: localDateStr(),
          weight: parseFloat(currentWeight),
        });
      }

      await refreshProfile();
      toast.success("Tudo pronto! 🎉");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // Progress bar (only for question steps 3-8)
  const showProgress = step >= 3 && step <= 8;
  const progressPct = showProgress ? ((step - 2) / 6) * 100 : 0;

  const renderStep = () => {
    switch (step) {
      // ===== STEP 0: Welcome =====
      case 0:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center"
            style={{ background: "linear-gradient(180deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.05) 50%, hsl(var(--background)) 100%)" }}>
            <img src={logoImg} alt="Mounjá" className="h-14 mb-3" />
            <h1 className="text-xl font-bold text-foreground mb-2">
              Tudo que você precisa para o seu tratamento com Mounjaro
            </h1>
            <img src={welcomeImg} alt="Bem-vindo" className="w-64 h-64 object-contain my-8" />
          </div>
        );

      // ===== STEP 1: Social proof =====
      case 1:
        return (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center"
            style={{ background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%)" }}>
            <button onClick={back} className="absolute top-14 left-5 text-primary-foreground/80">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-3xl font-bold text-primary-foreground mb-6 leading-tight">
              Apoio em cada{"\n"}etapa do caminho
            </h1>
            <div className="text-6xl mb-8">🌍</div>
            <p className="text-primary-foreground/80 text-lg mt-auto mb-4">
              Junte-se a uma comunidade crescente de{" "}
              <span className="font-bold text-primary-foreground">milhares de pessoas</span>{" "}
              em todo o Brasil
            </p>
          </div>
        );

      // ===== STEP 2: Privacy =====
      case 2:
        return (
          <div className="flex-1 flex flex-col px-8">
            <button onClick={back} className="mt-2 mb-4 self-start text-muted-foreground">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 flex flex-col items-center">
              <img src={privacyImg} alt="Privacidade" className="w-48 h-48 object-contain mb-6" />
              <h1 className="text-2xl font-bold text-foreground text-left w-full mb-4">
                Saúde com privacidade
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                O Mounjá existe para te ajudar a acompanhar e entender seu progresso, não para fornecer aconselhamento médico. Consulte sempre seu profissional de saúde antes de alterar sua medicação ou rotina.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ao usar o Mounjá, você consente com a coleta e uso das suas informações de saúde para funcionalidades do app. Não vendemos seus dados e você pode excluí-los a qualquer momento.
              </p>
            </div>
            <label className="flex items-start gap-3 mb-4 cursor-pointer select-none">
              <button
                onClick={() => setPrivacyAccepted(!privacyAccepted)}
                className={cn(
                  "w-6 h-6 min-w-6 rounded-md border-2 flex items-center justify-center transition-all mt-0.5",
                  privacyAccepted ? "bg-primary border-primary" : "border-border"
                )}
              >
                {privacyAccepted && <Check className="w-4 h-4 text-primary-foreground" />}
              </button>
              <span className="text-xs text-muted-foreground leading-relaxed">
                Concordo com a coleta das minhas informações de saúde e com a{" "}
                <span className="text-primary underline">Política de Privacidade</span> e{" "}
                <span className="text-primary underline">Termos de Uso</span>.
              </span>
            </label>
          </div>
        );

      // ===== STEP 3: Experience =====
      case 3:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-8 mt-4">
              Há quanto tempo você usa Mounjaro?
            </h1>
            <div className="space-y-3">
              {experienceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setExperience(opt.value); setTimeout(() => setStep(4), 300); }}
                  className={cn(
                    "w-full py-4 px-5 rounded-2xl text-base font-medium transition-all text-left",
                    experience === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      // ===== STEP 4: Motivation =====
      case 4:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-4">
              Por que você começou o tratamento?
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Escolha quantas quiser</p>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {motivationOptions.map((opt) => {
                const selected = motivations.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleMotivation(opt.value)}
                    className={cn(
                      "w-full py-4 px-5 rounded-2xl text-left transition-all border-2",
                      selected
                        ? "bg-primary/10 border-primary"
                        : "bg-secondary border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className={cn("font-medium", selected && "text-primary")}>{opt.label}</span>
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                      )}>
                        {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                      </div>
                    </div>
                    {selected && (
                      <p className="text-sm text-muted-foreground mt-2">{opt.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ===== STEP 5: App Preview =====
      case 5:
        return (
          <div className="flex-1 flex flex-col items-center px-8">
            <button onClick={back} className="self-start mt-2 mb-4 text-muted-foreground">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="bg-card rounded-3xl shadow-elevated p-6 w-full max-w-xs mx-auto mb-8">
              <p className="text-center font-semibold text-foreground mb-3">
                {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </p>
              <div className="flex justify-center gap-3 mb-4">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <div key={i} className="text-center">
                    <span className="text-[10px] text-muted-foreground">{d}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs mt-1",
                      i === 3 ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                    )}>
                      {new Date().getDate() - 3 + i}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">Próximo tratamento</p>
              <p className="text-center text-4xl font-bold text-foreground">3 dias</p>
            </div>
            <h1 className="text-2xl font-bold text-foreground text-center mb-4">
              O Mounjá é muito mais que um rastreador
            </h1>
            <div className="space-y-4 w-full">
              {[
                "Registre suas doses e nunca mais tenha dúvidas sobre sua rotina",
                "Veja seu progresso ao longo do tempo com peso, apetite e energia",
                "Fique à frente dos efeitos colaterais acompanhando padrões e tendências",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary min-w-6 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      // ===== STEP 6: Help needs =====
      case 6:
        return (
          <div className="flex-1 flex flex-col px-6">
            <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-4">
              Como podemos te ajudar?
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">Escolha quantas quiser</p>
            <div className="grid grid-cols-2 gap-3 flex-1 overflow-y-auto">
              {helpOptions.map((opt) => {
                const selected = helpNeeds.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleHelp(opt.value)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all text-center",
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-xs font-medium text-foreground leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      // ===== STEP 7: Confirmation =====
      case 7:
        return (
          <div className="flex-1 flex flex-col items-center px-8">
            <button onClick={back} className="self-start mt-2 mb-4 text-muted-foreground">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <img src={celebrationImg} alt="Celebração" className="w-52 h-52 object-contain mb-6" />
            <h1 className="text-2xl font-bold text-foreground text-center mb-6">
              Entendido! Vamos te ajudar a:
            </h1>
            <div className="space-y-5 w-full">
              {[
                "Acompanhar seu tratamento facilmente e construir uma rotina que funcione para você.",
                "Ver seu progresso se desenrolar e manter o rumo certo.",
                "Ficar à frente dos efeitos colaterais e encontrar o que ajuda.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-primary min-w-6 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        );

      // ===== STEP 8: Data collection =====
      case 8:
        return (
          <div className="flex-1 flex flex-col px-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-foreground text-center mb-2 mt-4">
              Quase lá! 🌿
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Precisamos de algumas informações para personalizar sua experiência
            </p>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Seu nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como quer ser chamado?"
                  className="w-full px-4 py-3.5 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Peso atual (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={currentWeight}
                  onChange={(e) => setCurrentWeight(e.target.value)}
                  placeholder="Ex: 85.5"
                  className="w-full px-4 py-3.5 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Dose atual</label>
                <div className="grid grid-cols-3 gap-2">
                  {doses.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCurrentDose(d)}
                      className={cn(
                        "py-3 rounded-2xl text-sm font-semibold transition-all",
                        currentDose === d
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Data da última aplicação</label>
                <input
                  type="date"
                  value={lastApplicationDate}
                  max={localDateStr()}
                  onChange={(e) => setLastApplicationDate(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Button config per step
  const showBackBtn = [4, 6].includes(step);
  const showNextBtn = ![3].includes(step); // step 3 auto-advances on selection
  const buttonLabel = step === 8 ? "Começar" : step === 0 ? "Próximo" : "Continuar";

  return (
    <div className="min-h-screen bg-background flex flex-col relative" style={{ paddingTop: step >= 3 ? "calc(env(safe-area-inset-top, 0px) + 1rem)" : "env(safe-area-inset-top, 0px)" }}>
      {/* Progress bar for question steps */}
      {showProgress && (
        <div className="px-6 flex items-center gap-3 mb-2">
          {showBackBtn && (
            <button onClick={back} className="text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {renderStep()}

      {/* Bottom button */}
      {showNextBtn && (
        <div className="px-6 pb-8 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2rem)" }}>
          <button
            onClick={next}
            disabled={!canAdvance() || saving}
            className={cn(
              "w-full font-bold py-4 rounded-[28px] flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]",
              canAdvance()
                ? "bg-primary text-primary-foreground shadow-elevated"
                : "bg-muted text-muted-foreground"
            )}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              buttonLabel
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Triage;
