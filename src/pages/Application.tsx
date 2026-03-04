import { ArrowLeft, Calendar, MapPin, AlertCircle, ChevronRight, Check, Clock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const applicationHistory = [
  { date: "21 fev", site: "Coxa direita", dose: "2.5mg", status: "done" },
  { date: "14 fev", site: "Abdômen esquerdo", dose: "2.5mg", status: "done" },
  { date: "7 fev", site: "Coxa esquerda", dose: "2.5mg", status: "done" },
];

const educationalCards = [
  {
    title: "Como aplicar corretamente",
    description: "Guia passo a passo com imagens",
    icon: "💉",
  },
  {
    title: "Rodízio de locais",
    description: "Por que alternar o local de aplicação",
    icon: "🔄",
  },
  {
    title: "Armazenamento",
    description: "Temperatura e cuidados com a caneta",
    icon: "❄️",
  },
  {
    title: "Efeitos colaterais comuns",
    description: "O que esperar nas primeiras semanas",
    icon: "📋",
  },
];

const Application = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 space-y-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        {/* Next application card */}
        <div className="relative overflow-hidden bg-card rounded-2xl p-5 shadow-elevated border border-secondary/15">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-coral" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg gradient-coral flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-secondary-foreground" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Próxima Aplicação
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">Sexta, 28 de fev</p>
            <p className="text-sm text-muted-foreground mt-1">Dose: 2.5mg · Semana 3</p>
            <div className="flex items-center gap-2 mt-4 bg-secondary/8 rounded-xl px-3 py-2.5">
              <MapPin className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Sugestão: Abdômen direito</span>
            </div>
          </div>
        </div>

        {/* Reminder status */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <Check className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Lembrete ativo</p>
            <p className="text-xs text-muted-foreground">
              Você será notificada 1 dia antes e no dia
            </p>
          </div>
        </div>

        {/* AI pattern insight */}
        <div className="relative overflow-hidden bg-card rounded-2xl p-4 shadow-card border border-primary/15">
          <div className="absolute top-0 left-0 w-1 h-full gradient-hero rounded-r" />
          <div className="pl-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Padrão Identificado</span>
            </div>
            <p className="text-sm leading-relaxed">
              Nas últimas 3 aplicações, você relatou náusea leve no dia seguinte. 
              Isso é comum e tende a diminuir com o tempo.
            </p>
          </div>
        </div>




        {/* Educational content */}
        <div>
          <h3 className="font-bold text-sm mb-3 tracking-tight">Aprenda</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {educationalCards.map((card, i) => (
              <button
                key={i}
                className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-left hover:shadow-elevated hover:border-primary/10 transition-all duration-300 active:scale-[0.98] group"
              >
                <span className="text-2xl">{card.icon}</span>
                <p className="font-bold text-xs mt-2.5">{card.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-warning/8 rounded-2xl p-4 border border-warning/15">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Este app é apenas para suporte educacional e não substitui o acompanhamento médico. 
            Consulte sempre seu profissional de saúde.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Application;
