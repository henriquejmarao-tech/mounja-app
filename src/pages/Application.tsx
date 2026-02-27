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
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-2xl font-bold">Aplicação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Controle e aprenda sobre suas aplicações
        </p>
      </header>

      <div className="px-5 mt-4 space-y-5">
        {/* Next application card */}
        <div className="gradient-coral rounded-xl p-5 text-secondary-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide opacity-90">
              Próxima Aplicação
            </span>
          </div>
          <p className="text-2xl font-bold">Sexta, 28 de fev</p>
          <p className="text-sm opacity-90 mt-1">Dose: 2.5mg · Semana 3</p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="text-sm">Sugestão: Abdômen direito</span>
          </div>
        </div>

        {/* Reminder status */}
        <div className="bg-card rounded-xl p-4 shadow-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
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
        <div className="bg-card rounded-xl p-4 shadow-card border-l-4 border-primary">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary">Padrão Identificado</span>
          </div>
          <p className="text-sm leading-relaxed">
            Nas últimas 3 aplicações, você relatou náusea leve no dia seguinte. 
            Isso é comum e tende a diminuir com o tempo.
          </p>
        </div>

        {/* Application history */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Histórico</h3>
            <button className="text-xs text-primary font-semibold">Ver tudo</button>
          </div>
          <div className="space-y-2">
            {applicationHistory.map((app, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card"
              >
                <div className="w-10 h-10 rounded-lg bg-sage-light flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{app.date}</p>
                  <p className="text-xs text-muted-foreground">
                    {app.site} · {app.dose}
                  </p>
                </div>
                <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center">
                  <Check className="w-3 h-3 text-success" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Educational content */}
        <div>
          <h3 className="font-semibold text-sm mb-3">Aprenda</h3>
          <div className="grid grid-cols-2 gap-2">
            {educationalCards.map((card, i) => (
              <button
                key={i}
                className="bg-card rounded-xl p-3 shadow-card text-left hover:shadow-elevated transition-shadow active:scale-[0.98]"
              >
                <span className="text-2xl">{card.icon}</span>
                <p className="font-semibold text-xs mt-2">{card.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-warning/10 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Este app é apenas para suporte educacional e não substitui o acompanhamento médico. 
            Consulte sempre seu profissional de saúde.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Application;
