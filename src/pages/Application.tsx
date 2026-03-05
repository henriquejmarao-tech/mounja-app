import { ArrowLeft, Calendar, MapPin, AlertCircle, ChevronRight, Check, Clock, Sparkles, Bell, BellOff, ChevronDown, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useApplicationData } from "@/hooks/useApplicationData";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn, localDateStr } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import DoseTimeline from "@/components/history/DoseTimeline";

const educationalCards = [
  {
    title: "Como aplicar corretamente",
    description: "Guia passo a passo com imagens",
    icon: "💉",
    content: [
      { heading: "1. Prepare o material", text: "Retire a caneta da geladeira 30 minutos antes. Lave as mãos com água e sabão. Verifique a validade e a aparência do medicamento — deve estar límpido e incolor." },
      { heading: "2. Escolha o local", text: "Os melhores locais são: abdômen (evitando 5 cm ao redor do umbigo), parte frontal da coxa ou parte de trás do braço. Alterne sempre o local." },
      { heading: "3. Limpe a pele", text: "Use álcool 70% no local escolhido e espere secar completamente antes de aplicar." },
      { heading: "4. Aplique a injeção", text: "Remova a tampa da caneta. Posicione firmemente contra a pele em ângulo de 90°. Pressione o botão e mantenha por 10 segundos. Você ouvirá dois cliques." },
      { heading: "5. Após a aplicação", text: "Não massageie o local. Descarte a agulha em recipiente apropriado. Anote a data, local e dose no app." },
    ],
  },
  {
    title: "Rodízio de locais",
    description: "Por que alternar o local de aplicação",
    icon: "🔄",
    content: [
      { heading: "Por que alternar?", text: "Aplicar sempre no mesmo local pode causar lipodistrofia — alterações no tecido gorduroso sob a pele que dificultam a absorção do medicamento." },
      { heading: "Esquema sugerido", text: "Semana 1: Abdômen direito → Semana 2: Coxa esquerda → Semana 3: Abdômen esquerdo → Semana 4: Coxa direita. Depois, reinicie o ciclo." },
      { heading: "Distância mínima", text: "Mantenha pelo menos 2 cm de distância do local da última aplicação na mesma região." },
      { heading: "Dica", text: "Use o registro do app para acompanhar automaticamente a sugestão do próximo local de aplicação." },
    ],
  },
  {
    title: "Armazenamento",
    description: "Temperatura e cuidados com a caneta",
    icon: "❄️",
    content: [
      { heading: "Antes do primeiro uso", text: "Mantenha na geladeira entre 2°C e 8°C. Não congele. Se congelar acidentalmente, descarte a caneta." },
      { heading: "Após o primeiro uso", text: "Pode ser armazenada na geladeira ou em temperatura ambiente (até 30°C) por no máximo 21 dias." },
      { heading: "Proteção", text: "Mantenha a tampa na caneta quando não estiver em uso para proteger da luz. Não guarde com a agulha acoplada." },
      { heading: "Em viagens", text: "Use uma bolsa térmica com gel refrigerante. Nunca deixe no carro sob sol direto ou no porta-malas." },
    ],
  },
  {
    title: "Efeitos colaterais comuns",
    description: "O que esperar nas primeiras semanas",
    icon: "📋",
    content: [
      { heading: "Náusea (muito comum)", text: "Afeta até 20% dos usuários. Geralmente leve e melhora em 2-3 semanas. Dica: coma porções menores, evite alimentos gordurosos e mantenha-se hidratada." },
      { heading: "Diarreia ou constipação", text: "Alterações intestinais são comuns no início. Aumente fibras gradualmente e beba pelo menos 2L de água por dia." },
      { heading: "Dor no local da aplicação", text: "Vermelhidão ou leve inchaço pode ocorrer. Geralmente desaparece em 24-48h. Não massageie a área." },
      { heading: "Cansaço", text: "Fadiga leve pode ocorrer nos primeiros dias após a aplicação. É temporário e tende a diminuir com o tempo." },
      { heading: "Quando procurar ajuda", text: "Dor abdominal intensa, vômitos persistentes, sinais de reação alérgica (inchaço no rosto, dificuldade para respirar). Procure atendimento médico imediatamente." },
    ],
  },
];

const reminderOptions = [
  { value: 0, label: "No dia" },
  { value: 1, label: "1 dia antes" },
  { value: 2, label: "2 dias antes" },
  { value: 3, label: "3 dias antes" },
];

const doseOptions = ["2.5 mg", "5 mg", "7.5 mg", "10 mg", "12.5 mg", "15 mg"];
const intervalOptions = [5, 6, 7, 8, 9, 10, 14];

const injectionSites = ["Coxa esquerda", "Coxa direita", "Abdômen esquerdo", "Abdômen direito", "Braço esquerdo", "Braço direito"];

const Application = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { dose, recentSymptoms, weeklyWorkoutCount, getApplicationTimeline, refresh } = useApplicationData();

  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState<number[]>([1]);
  const [showReminderOptions, setShowReminderOptions] = useState(false);
  const [openCard, setOpenCard] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings form state — next dose
  const [editDose, setEditDose] = useState(dose.currentDose || "2.5 mg");
  const [editInterval, setEditInterval] = useState(dose.applicationIntervalDays || 7);
  const [editNextDate, setEditNextDate] = useState(dose.nextApplicationAt ? localDateStr(new Date(dose.nextApplicationAt)) : "");
  const [saving, setSaving] = useState(false);

  const injections = getApplicationTimeline();

  // Derive next application info from SSOT
  const nextDateLabel = useMemo(() => {
    if (!dose.nextApplicationAt) return null;
    const d = new Date(dose.nextApplicationAt);
    return d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }, [dose.nextApplicationAt]);

  const daysUntilNext = useMemo(() => {
    if (!dose.nextApplicationAt) return null;
    return Math.max(0, Math.ceil((new Date(dose.nextApplicationAt).getTime() - Date.now()) / 86400000));
  }, [dose.nextApplicationAt]);

  const weekNumber = useMemo(() => {
    if (!profile?.mounjaro_start_date) return null;
    const start = new Date(profile.mounjaro_start_date + "T12:00:00");
    return Math.max(1, Math.ceil((Date.now() - start.getTime()) / (7 * 86400000)));
  }, [profile?.mounjaro_start_date]);

  // Suggested site rotation
  const suggestedSite = useMemo(() => {
    if (injections.length === 0) return injectionSites[0];
    const lastSite = injections[0]?.site;
    const idx = injectionSites.indexOf(lastSite || "");
    return injectionSites[(idx + 1) % injectionSites.length];
  }, [injections]);

  // Daily insight cached
  const patternInsight = useMemo(() => {
    const today = localDateStr();
    const cacheKey = "app_pattern_insight";
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) return parsed.text as string;
      } catch {}
    }
    const insights: string[] = [];
    if (recentSymptoms.nausea > 3) insights.push("Nos últimos dias, sua náusea está acima da média. Considere refeições menores e mais frequentes.");
    if (recentSymptoms.fatigue > 3) insights.push("Seu nível de cansaço está elevado esta semana. Priorize descanso e hidratação.");
    if (recentSymptoms.constipation > 3) insights.push("Constipação tem sido frequente. Aumente a ingestão de fibras e água.");
    if (recentSymptoms.headache > 3) insights.push("Dores de cabeça recorrentes detectadas. Verifique sua hidratação e sono.");
    if (weeklyWorkoutCount >= 3) insights.push("Ótimo ritmo de treinos esta semana! A atividade física potencializa os resultados do tratamento. 💪");
    if (recentSymptoms.nausea <= 2 && recentSymptoms.fatigue <= 2 && recentSymptoms.headache <= 2) {
      insights.push("Seus sintomas estão bem controlados. Continue mantendo seus hábitos atuais! ✨");
    }
    const text = insights.length > 0
      ? insights[Math.floor(Math.random() * insights.length)]
      : "Continue registrando seus sintomas diariamente para que possamos identificar padrões no seu tratamento.";
    localStorage.setItem(cacheKey, JSON.stringify({ date: today, text }));
    return text;
  }, [recentSymptoms, weeklyWorkoutCount]);

  const toggleReminderDay = (value: number) => {
    setSelectedReminders(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value].sort()
    );
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Save dose and interval to profile
      const updates: any = {
        current_dose: editDose,
        application_interval_days: editInterval,
      };
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) throw error;

      // If date was changed manually, update the last injection's date to back-calculate
      // Or create a virtual anchor by updating the latest injection date
      if (editNextDate && injections.length > 0) {
        const nextDate = new Date(editNextDate + "T12:00:00");
        const newLastDate = new Date(nextDate.getTime() - editInterval * 86400000);
        const newLastDateStr = localDateStr(newLastDate);
        const today = localDateStr();
        
        // Only adjust if the back-calculated date is not in the future
        if (newLastDateStr <= today) {
          await supabase.from("injections").update({ date: newLastDateStr }).eq("id", injections[0].id).eq("user_id", user.id);
        }
      }

      await refreshProfile();
      await refresh();
      toast.success("Próxima dose atualizada!");
      setShowSettings(false);
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-5 space-y-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        {/* Back button */}
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-muted-foreground active:opacity-70 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        {/* Next application card — real data */}
        <div className="relative overflow-hidden bg-card rounded-2xl p-5 shadow-elevated border border-primary/15">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-hero" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg gradient-hero flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Próxima Aplicação
                </span>
              </div>
              <button
                onClick={() => {
                  setEditDose(dose.currentDose || "2.5 mg");
                  setEditInterval(dose.applicationIntervalDays || 7);
                  setEditNextDate(dose.nextApplicationAt ? localDateStr(new Date(dose.nextApplicationAt)) : "");
                  setShowSettings(true);
                }}
                className="w-8 h-8 rounded-xl bg-muted/40 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Settings2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {nextDateLabel ? (
              <>
                <p className="text-2xl font-bold text-foreground capitalize">{nextDateLabel}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Dose: {dose.currentDose || "—"}
                  {weekNumber && ` · Semana ${weekNumber}`}
                  {daysUntilNext !== null && (
                    <span className="ml-2 text-xs font-semibold" style={{ color: daysUntilNext <= 1 ? "hsl(var(--primary))" : undefined }}>
                      {daysUntilNext === 0 ? "· Hoje!" : daysUntilNext === 1 ? "· Amanhã" : `· Em ${daysUntilNext} dias`}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-bold text-muted-foreground/60">Nenhuma aplicação registrada</p>
                <p className="text-sm text-muted-foreground mt-1">Registre sua primeira aplicação para ver a próxima data.</p>
              </>
            )}

            <div className="flex items-center gap-2 mt-4 bg-primary/8 rounded-xl px-3 py-2.5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Sugestão: {suggestedSite}</span>
            </div>
          </div>
        </div>

        {/* Reminder card */}
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
                onClick={() => { setReminderEnabled(false); setShowReminderOptions(false); }}
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
            <p className="text-sm leading-relaxed">{patternInsight}</p>
          </div>
        </div>

        {/* Dose Timeline — moved from Caminho */}
        <DoseTimeline injections={injections} onChanged={refresh} />

        {/* Educational content */}
        <div>
          <h3 className="font-bold text-sm mb-3 tracking-tight">Aprenda</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {educationalCards.map((card, i) => (
              <button
                key={i}
                onClick={() => setOpenCard(i)}
                className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-left hover:shadow-elevated hover:border-primary/10 transition-all duration-300 active:scale-[0.98] group"
              >
                <span className="text-3xl">{card.icon}</span>
                <p className="font-bold text-sm mt-2.5">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
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

      {/* Educational Sheet */}
      <Sheet open={openCard !== null} onOpenChange={(open) => !open && setOpenCard(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto pb-10">
          {openCard !== null && (
            <>
              <SheetHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{educationalCards[openCard].icon}</span>
                  <SheetTitle className="text-lg font-bold text-left">{educationalCards[openCard].title}</SheetTitle>
                </div>
              </SheetHeader>
              <div className="space-y-5 mt-4">
                {educationalCards[openCard].content.map((section, j) => (
                  <div key={j}>
                    <h4 className="text-base font-bold text-foreground/85 mb-1.5">{section.heading}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{section.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-start gap-3 bg-warning/8 rounded-xl p-3 border border-warning/15">
                <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Informações educacionais. Consulte sempre seu médico.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Settings Sheet — next dose */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto pb-10">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg font-bold text-left">Próxima dose</SheetTitle>
            <p className="text-xs text-muted-foreground text-left">Ajuste os dados da sua próxima aplicação</p>
          </SheetHeader>
          <div className="space-y-5 mt-4">
            {/* Date */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Data da próxima aplicação</label>
              <input
                type="date"
                value={editNextDate}
                min={localDateStr()}
                onChange={(e) => setEditNextDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              {editNextDate && (
                <p className="text-[11px] text-muted-foreground/60 mt-1.5">
                  {new Date(editNextDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
              )}
            </div>

            {/* Dose */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Dose</label>
              <div className="grid grid-cols-3 gap-2">
                {doseOptions.map((d) => (
                  <button
                    key={d}
                    onClick={() => setEditDose(d)}
                    className={cn(
                      "py-2.5 rounded-xl text-xs font-semibold border transition-all",
                      editDose === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-2">Intervalo entre aplicações</label>
              <div className="flex flex-wrap gap-2">
                {intervalOptions.map((days) => (
                  <button
                    key={days}
                    onClick={() => setEditInterval(days)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all",
                      editInterval === days
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    {days} dias
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground/50 mt-1.5">Será usado para calcular as próximas datas automaticamente</p>
            </div>

            {/* Save */}
            <button
              onClick={handleSaveSettings}
              disabled={saving || !editNextDate}
              className="w-full gradient-hero text-primary-foreground font-bold py-3.5 rounded-2xl text-sm disabled:opacity-50 shadow-elevated"
            >
              {saving ? "Salvando..." : "Salvar próxima dose"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Application;
