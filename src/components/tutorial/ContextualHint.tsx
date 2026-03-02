import { useState, useEffect } from "react";
import { useTutorial } from "@/hooks/useTutorial";
import { X, Lightbulb } from "lucide-react";

interface ContextualHintProps {
  id: "export-pdf" | "save-diet" | "register-workout";
  message: string;
  className?: string;
}

const ContextualHint = ({ id, message, className = "" }: ContextualHintProps) => {
  const { shouldShowHint, dismissHint } = useTutorial();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldShowHint(id)) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [id, shouldShowHint]);

  if (!visible) return null;

  return (
    <div className={`flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-xl px-3 py-2 animate-fade-in-up ${className}`}>
      <Lightbulb className="w-3.5 h-3.5 text-primary shrink-0" />
      <p className="text-[11px] text-primary font-medium flex-1">{message}</p>
      <button
        onClick={() => { setVisible(false); dismissHint(id); }}
        className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
      >
        <X className="w-3 h-3 text-primary" />
      </button>
    </div>
  );
};

export default ContextualHint;
