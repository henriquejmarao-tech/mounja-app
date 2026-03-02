import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const CURRENT_TUTORIAL_VERSION = "v1";

export interface TutorialStep {
  id: string;
  page: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const FULL_STEPS: TutorialStep[] = [
  // Dashboard
  { id: "dose", page: "/", title: "Sua dose e próxima aplicação", description: "Aqui você acompanha sua dose atual e quantos dias faltam para a próxima aplicação.", targetSelector: "[data-tutorial='dose-card']", position: "bottom" },
  { id: "suggestion", page: "/", title: "Sugestão do dia", description: "Receba dicas de alimentação e treino adaptadas ao seu momento.", targetSelector: "[data-tutorial='suggestion-card']", position: "bottom" },
  { id: "register-btn", page: "/", title: "Registre seu dia", description: "Toque aqui para registrar peso, sintomas, treino ou aplicação.", targetSelector: "[data-tutorial='register-btn']", position: "top" },
  // Register
  { id: "register-tabs", page: "/registrar", title: "Três tipos de registro", description: "Dia para o diário, Treino para exercícios e Aplicação para a injeção.", targetSelector: "[data-tutorial='register-tabs']", position: "bottom" },
  { id: "register-why", page: "/registrar", title: "Registre todos os dias", description: "Quanto mais você registra, mais preciso o app fica nas recomendações.", targetSelector: "[data-tutorial='register-form']", position: "top" },
  // History
  { id: "history-filter", page: "/historico", title: "Filtre por período", description: "Use 7, 30 ou 90 dias para ver diferentes recortes da sua jornada.", targetSelector: "[data-tutorial='period-filter']", position: "bottom" },
  { id: "history-charts", page: "/historico", title: "Gráficos e evolução", description: "Acompanhe peso, sintomas e treinos de forma visual.", targetSelector: "[data-tutorial='charts-area']", position: "top" },
  { id: "history-pdf", page: "/historico", title: "Exporte seu relatório", description: "Gere um PDF completo para compartilhar com seu médico.", targetSelector: "[data-tutorial='export-btn']", position: "bottom" },
  // Nutrition
  { id: "nutrition-ai", page: "/nutricao", title: "Dieta personalizada por IA", description: "Gere uma sugestão de cardápio adaptada aos seus sintomas e objetivos.", targetSelector: "[data-tutorial='diet-btn']", position: "bottom" },
  { id: "nutrition-save", page: "/nutricao", title: "Salve sua dieta", description: "Salve a sugestão para acompanhar no histórico e no relatório.", targetSelector: "[data-tutorial='diet-btn']", position: "bottom" },
  // Workouts
  { id: "workout-goal", page: "/treinos", title: "Meta semanal de treinos", description: "Defina quantos treinos quer fazer por semana. O app ajusta recomendações.", targetSelector: "[data-tutorial='workout-goal']", position: "bottom" },
  { id: "workout-adapt", page: "/treinos", title: "Recomendações adaptativas", description: "O app considera seus sintomas e aplicações para sugerir a intensidade ideal.", targetSelector: "[data-tutorial='workout-tips']", position: "top" },
];

const QUICK_STEPS = FULL_STEPS.filter((s) => ["dose", "register-btn", "history-filter"].includes(s.id));

type HintId = "export-pdf" | "save-diet" | "register-workout";

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  mode: "full" | "quick" | null;
  startTutorial: (mode: "full" | "quick") => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  closeTutorial: () => void;
  shouldShowHint: (id: HintId) => boolean;
  dismissHint: (id: HintId) => void;
  showStartDialog: boolean;
  setShowStartDialog: (v: boolean) => void;
  resumeAvailable: boolean;
}

const TutorialContext = createContext<TutorialContextType>({
  isActive: false,
  currentStep: 0,
  steps: [],
  mode: null,
  startTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  closeTutorial: () => {},
  shouldShowHint: () => false,
  dismissHint: () => {},
  showStartDialog: false,
  setShowStartDialog: () => {},
  resumeAvailable: false,
});

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<"full" | "quick" | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [hintsSeen, setHintsSeen] = useState<string[]>([]);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check if tutorial should show on load
  useEffect(() => {
    if (!user || !profile || initialized) return;
    setInitialized(true);

    const completed = (profile as any).tutorial_version_completed;
    const savedStep = (profile as any).tutorial_step || 0;
    const seenHints = ((profile as any).tutorial_hints_seen as string[]) || [];
    setHintsSeen(seenHints);

    if (completed === CURRENT_TUTORIAL_VERSION) {
      // Already completed current version
      return;
    }

    if (savedStep > 0 && !completed) {
      // Was in progress
      setResumeAvailable(true);
      setShowStartDialog(true);
    } else if (!completed) {
      // First time
      setShowStartDialog(true);
    }
  }, [user, profile, initialized]);

  const startTutorial = useCallback((m: "full" | "quick") => {
    setMode(m);
    const s = m === "quick" ? QUICK_STEPS : FULL_STEPS;
    setSteps(s);
    setCurrentStep(0);
    setIsActive(true);
    setShowStartDialog(false);
    setResumeAvailable(false);
  }, []);

  const saveProgress = useCallback(async (step: number, completed: boolean) => {
    if (!user) return;
    const update: any = { tutorial_step: step };
    if (completed) update.tutorial_version_completed = CURRENT_TUTORIAL_VERSION;
    await supabase.from("profiles").update(update).eq("id", user.id);
  }, [user]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      saveProgress(next, false);
    } else {
      // Complete
      setIsActive(false);
      setMode(null);
      saveProgress(steps.length, true);
    }
  }, [currentStep, steps, saveProgress]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsActive(false);
    setMode(null);
    saveProgress(currentStep, true);
  }, [currentStep, saveProgress]);

  const closeTutorial = useCallback(() => {
    setIsActive(false);
    saveProgress(currentStep, false);
  }, [currentStep, saveProgress]);

  const shouldShowHint = useCallback((id: HintId): boolean => {
    if (!profile) return false;
    const completed = (profile as any).tutorial_version_completed;
    if (completed !== CURRENT_TUTORIAL_VERSION) return false;
    return !hintsSeen.includes(id);
  }, [profile, hintsSeen]);

  const dismissHint = useCallback(async (id: HintId) => {
    const updated = [...hintsSeen, id];
    setHintsSeen(updated);
    if (!user) return;
    await supabase.from("profiles").update({ tutorial_hints_seen: updated } as any).eq("id", user.id);
  }, [user, hintsSeen]);

  return (
    <TutorialContext.Provider value={{
      isActive, currentStep, steps, mode,
      startTutorial, nextStep, prevStep, skipTutorial, closeTutorial,
      shouldShowHint, dismissHint,
      showStartDialog, setShowStartDialog, resumeAvailable,
    }}>
      {children}
    </TutorialContext.Provider>
  );
};
