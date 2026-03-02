import { ArrowLeft, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HistoryHeaderProps {
  showExport: boolean;
  onExport: () => void;
}

const HistoryHeader = ({ showExport, onExport }: HistoryHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-95" />
      <div className="relative px-5 pt-6 pb-6">
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
        <h1 className="text-xl font-bold text-primary-foreground">Sua Jornada</h1>
        <p className="text-sm text-primary-foreground/70 mt-1">Acompanhe sua evolução ao longo do tempo</p>
      </div>
    </header>
  );
};

export default HistoryHeader;
