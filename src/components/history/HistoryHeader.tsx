import { ArrowLeft, FileDown, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HistoryHeaderProps {
  showExport: boolean;
  onExport: () => void;
}

const HistoryHeader = ({ showExport, onExport }: HistoryHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30">
      <div
        className="px-5 pb-14"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
          background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 50%, hsl(var(--primary) / 0.65) 70%, hsl(var(--primary) / 0.15) 85%, transparent 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          {showExport && (
            <button
              data-tutorial="export-btn"
              onClick={onExport}
              className="flex items-center gap-1.5 text-primary-foreground/80 bg-primary-foreground/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-primary-foreground/10 text-xs font-semibold"
            >
              <FileDown className="w-3.5 h-3.5" />
              Exportar PDF
            </button>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-primary-foreground" />
          <div>
            <h1 className="text-xl font-bold text-primary-foreground tracking-tight">Análise da Jornada</h1>
            <p className="text-[11px] text-primary-foreground/60 font-medium tracking-wide uppercase mt-0.5">Dados e tendências do seu tratamento</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HistoryHeader;
