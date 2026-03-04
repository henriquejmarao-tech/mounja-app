import { ArrowLeft, Calendar, MapPin, AlertCircle, ChevronRight, Check, Clock, Sparkles, Bell, BellOff, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

const reminderOptions = [
  { value: 0, label: "No dia" },
  { value: 1, label: "1 dia antes" },
  { value: 2, label: "2 dias antes" },
  { value: 3, label: "3 dias antes" },
];

const Application = () => {
  const navigate = useNavigate();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<number[]>([1]);
  const [showReminderOptions, setShowReminderOptions] = useState(false);

  const toggleReminderDay = (value: number) => {
    setSelectedReminders(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value].sort()
    );
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 space-y-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        {/* Back button */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground active:opacity-70 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

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

        {/* Reminder card — toggle + config */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          <button
            onClick={() => {
              if (!reminderEnabled) {
                setReminderEnabled(true);
                setShowReminderOptions(true);
              } else {
                setShowReminderOptions(!showReminderOptions);
              }
            }}
            className="w-full p-4 flex items-center gap-3"
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              reminderEnabled ? "bg-success/10" : "bg-muted/30"
            )}>
              {reminderEnabled ? (
                <Bell className="w-5 h-5 text-success" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className={cn("font-semibold text-sm", !reminderEnabled && "text-muted-foreground/60")}>
                {reminderEnabled ? "Lembrete ativo" : "Lembrete desativado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {reminderEnabled
                  ? selectedReminders.length === 0
                    ? "Selecione quando lembrar"
                    : selectedReminders.map(v => reminderOptions.find(o => o.value === v)?.label).join(", ")
                  : "Toque para ativar lembretes"
                }
              </p>
            </div>
            {reminderEnabled && (
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", showReminderOptions && "rotate-180")} />
            )}
          </button>

          {/* Expandable options */}
          {reminderEnabled && showReminderOptions && (
            <div className="px-4 pb-4 pt-1 space-y-3 animate-fade-in-up">
              <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">Lembrar-me</p>
              <div className="flex gap-2">
                {reminderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => toggleReminderDay(opt.value)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200",
                      selectedReminders.includes(opt.value)
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted/20 text-muted-foreground/60 border border-transparent"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setReminderEnabled(false);
                  setShowReminderOptions(false);
                }}
                className="w-full py-2 text-xs text-muted-foreground/50 font-medium"
              >
                Desativar lembrete
              </button>
            </div>
          )}
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
