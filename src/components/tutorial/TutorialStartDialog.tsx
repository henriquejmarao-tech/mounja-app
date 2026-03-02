import { useTutorial } from "@/hooks/useTutorial";
import { BookOpen, Zap, X } from "lucide-react";

const TutorialStartDialog = () => {
  const { showStartDialog, setShowStartDialog, startTutorial, resumeAvailable, skipTutorial } = useTutorial();

  if (!showStartDialog) return null;

  const handleSkip = () => {
    setShowStartDialog(false);
    skipTutorial();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-sm rounded-3xl shadow-elevated border border-border/50 p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary-foreground" />
          </div>
          <button onClick={handleSkip} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <h2 className="text-lg font-bold mb-1">
          {resumeAvailable ? "Continuar o tour?" : "Bem-vindo ao Mounjá! 🌿"}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {resumeAvailable
            ? "Você começou o tour na última vez. Quer continuar de onde parou?"
            : "Vamos te mostrar como tudo funciona, com calma."}
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => startTutorial("full")}
            className="w-full gradient-hero text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Tutorial completo
          </button>

          <button
            onClick={() => startTutorial("quick")}
            className="w-full bg-muted text-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-warning" />
            Rápido (30 segundos)
          </button>

          <button
            onClick={handleSkip}
            className="w-full text-muted-foreground text-sm font-medium py-2"
          >
            Pular por agora
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialStartDialog;
