import { CalendarDays } from "lucide-react";
import { useSelectedDate } from "@/contexts/SelectedDateContext";

const RetroactiveDateBanner = () => {
  const { selectedDate, isViewingToday, resetSelectedDate } = useSelectedDate();

  if (isViewingToday) return null;

  const label = selectedDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

  return (
    <div className="px-5 pt-2 animate-fade-in">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-primary/5 px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="w-4 h-4 text-primary shrink-0" />
          <p className="text-xs font-semibold text-foreground truncate">Visualizando {label}</p>
        </div>
        <button onClick={resetSelectedDate} className="text-xs font-bold text-primary shrink-0 active:scale-95 transition-transform">
          voltar pra hoje
        </button>
      </div>
    </div>
  );
};

export default RetroactiveDateBanner;