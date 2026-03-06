import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

interface TutorialContextType {
  tutorialCompleted: boolean;
}

const TutorialContext = createContext<TutorialContextType>({
  tutorialCompleted: false,
});

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const tutorialCompleted = (profile as any)?.tutorial_version_completed === "v2";

  return (
    <TutorialContext.Provider value={{ tutorialCompleted }}>
      {children}
    </TutorialContext.Provider>
  );
};
