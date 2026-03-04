import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HistoryHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30">
      <div
        className="px-5 pb-10"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
          background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 40%, hsl(var(--primary) / 0.5) 70%, transparent 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
        </div>
        <h1 className="text-xl font-bold text-primary-foreground tracking-tight">Seu Progresso</h1>
      </div>
    </header>
  );
};

export default HistoryHeader;
