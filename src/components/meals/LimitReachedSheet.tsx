import { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

interface LimitReachedSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LimitReachedSheet = ({ open, onOpenChange }: LimitReachedSheetProps) => {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <div className="px-6 pt-6 pb-8 flex flex-col items-center text-center">
          <span className="text-5xl mb-4">🔒</span>
          <h3 className="text-lg font-extrabold text-foreground">
            Você usou seus 2 registros
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-[280px] leading-relaxed">
            O plano gratuito inclui 2 refeições por dia. Seus créditos renovam automaticamente à meia-noite.
          </p>
          <div className="mt-4 px-5 py-2 rounded-xl bg-muted/60">
            <span className="text-2xl font-extrabold text-foreground tabular-nums">
              {countdown}
            </span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="mt-6 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-[0.97] transition-transform"
          >
            Ok, entendi
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default LimitReachedSheet;
