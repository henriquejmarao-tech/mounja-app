import { Bell, X } from "lucide-react";

interface PushRequestBannerProps {
  loading?: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

const PushRequestBanner = ({ loading = false, onAccept, onDismiss }: PushRequestBannerProps) => {
  return (
    <div className="mx-5 mb-4 rounded-2xl bg-card border border-border/50 shadow-card p-4 flex items-start gap-3 animate-fade-in-up">
      <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">
          Novidade: a gente te avisa 1h antes de aplicar a próxima dose. Quer ativar?
        </p>
        <button
          onClick={onAccept}
          disabled={loading}
          className="mt-3 px-4 py-2 rounded-full gradient-hero text-primary-foreground text-xs font-bold disabled:opacity-60 active:scale-95 transition-transform"
        >
          Ativar lembrete
        </button>
      </div>
      <button onClick={onDismiss} className="p-1 -mr-1 -mt-1 text-muted-foreground active:scale-90 transition-transform" aria-label="Fechar lembrete">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PushRequestBanner;
