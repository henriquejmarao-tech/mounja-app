import { useNavigate } from "react-router-dom";
import { Lock, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PremiumGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
}

const PremiumGateModal = ({
  open,
  onOpenChange,
  title = "Funcionalidade premium",
  description = "Este recurso está disponível apenas para usuários premium.",
  ctaLabel = "Ver planos",
}: PremiumGateModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-3xl border-border/50 p-6 text-center">
        <DialogHeader className="items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
            style={{
              background:
                "linear-gradient(135deg, hsl(270,80%,60%) 0%, hsl(330,80%,65%) 100%)",
              boxShadow: "0 6px 20px hsl(300 70% 60% / 0.25)",
            }}
          >
            <Crown className="w-7 h-7 text-white" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>

        <button
          onClick={() => {
            onOpenChange(false);
            navigate("/planos");
          }}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-bold text-white active:scale-[0.97] transition-transform"
          style={{
            background:
              "linear-gradient(135deg, hsl(270,80%,60%) 0%, hsl(330,80%,65%) 100%)",
            boxShadow: "0 4px 16px hsl(300 70% 60% / 0.3)",
          }}
        >
          {ctaLabel}
        </button>

        <button
          onClick={() => onOpenChange(false)}
          className="text-xs text-muted-foreground/60 font-medium mt-1"
        >
          Agora não
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumGateModal;
