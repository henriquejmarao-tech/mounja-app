import { useState } from "react";
import { ArrowLeft, User, Bell, Shield, HelpCircle, ChevronRight, LogOut, Crown, Sparkles, MessageSquare, Star, Send, Bug, Lightbulb, X, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTutorial } from "@/hooks/useTutorial";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FeedbackType = "rating" | "suggestion" | "bug";

const feedbackTypes = [
  { value: "rating" as FeedbackType, label: "Avaliar", emoji: "⭐", Icon: Star },
  { value: "suggestion" as FeedbackType, label: "Sugerir", emoji: "💡", Icon: Lightbulb },
  { value: "bug" as FeedbackType, label: "Reportar erro", emoji: "🐛", Icon: Bug },
];

const Settings = () => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const { setShowStartDialog } = useTutorial();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("rating");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const menuItems = [
    { icon: User, label: "Minha Triagem", route: "/minha-triagem", description: "Editar peso, objetivo e dados pessoais" },
    { icon: Bell, label: "Notificações", description: "Lembretes e alertas" },
    { icon: Shield, label: "Privacidade", description: "Dados e segurança" },
    { icon: HelpCircle, label: "Ajuda e Suporte", description: "Dúvidas frequentes" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSendFeedback = async () => {
    if (!user) return;
    if (!message.trim()) {
      toast.error("Escreva sua mensagem.");
      return;
    }
    if (message.trim().length > 1000) {
      toast.error("Mensagem muito longa (máximo 1000 caracteres).");
      return;
    }
    if (feedbackType === "rating" && rating === 0) {
      toast.error("Selecione uma avaliação.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      type: feedbackType,
      rating: feedbackType === "rating" ? rating : null,
      message: message.trim(),
    } as any);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
    } else {
      toast.success("Obrigado pelo seu feedback! 💚");
      setShowFeedback(false);
      setMessage("");
      setRating(0);
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground text-xl font-bold border border-primary-foreground/10">
              {profile?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">{profile?.name || "Usuário"}</h1>
              <p className="text-sm text-primary-foreground/80">{user?.email}</p>
              {profile?.current_dose && (
                <p className="text-xs text-primary-foreground/60 mt-0.5">Dose {profile.current_dose}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-3 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: profile?.weekly_workouts || 0, label: "Treinos/sem", color: "text-primary" },
            { value: profile?.current_dose || "—", label: "Dose atual", color: "text-secondary" },
            { value: profile?.activity_level === "sedentary" ? "Sedentário" : profile?.activity_level === "light" ? "Leve" : profile?.activity_level === "moderate" ? "Moderado" : "Alto", label: "Atividade", color: "text-foreground" },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-2xl p-3.5 shadow-card border border-border/50 text-center">
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => item.route && navigate(item.route)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium block">{item.label}</span>
                {item.description && <span className="text-[10px] text-muted-foreground">{item.description}</span>}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </button>
          ))}
        </div>

        {/* Review tutorial button */}
        <button
          onClick={() => setShowStartDialog(true)}
          className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 shadow-card border border-border/50 hover:border-primary/10 transition-all active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-medium block">Rever tutorial</span>
            <span className="text-[10px] text-muted-foreground">Veja novamente como usar o app</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </button>

        {/* Feedback button */}
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 shadow-card border border-primary/10 hover:border-primary/20 transition-all active:scale-[0.98]"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold block">Dar opinião</span>
            <span className="text-[10px] text-muted-foreground">Avalie, sugira ou reporte um problema</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-destructive text-sm font-semibold rounded-2xl hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>

      {/* Feedback modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowFeedback(false)}>
          <div
            className="bg-card w-full max-w-lg rounded-t-3xl p-5 pb-8 animate-fade-in-up shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Dar opinião</h2>
              <button onClick={() => setShowFeedback(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 mb-5">
              {feedbackTypes.map((ft) => (
                <button
                  key={ft.value}
                  onClick={() => setFeedbackType(ft.value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs font-semibold",
                    feedbackType === ft.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 border-border text-muted-foreground"
                  )}
                >
                  <span className="text-lg">{ft.emoji}</span>
                  {ft.label}
                </button>
              ))}
            </div>

            {/* Rating stars */}
            {feedbackType === "rating" && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Como está sua experiência?</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1 transition-transform active:scale-90"
                    >
                      <Star className={cn("w-8 h-8 transition-colors", s <= rating ? "fill-warning text-warning" : "text-muted-foreground/30")} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <div className="mb-5">
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                {feedbackType === "rating" ? "Quer contar mais?" : feedbackType === "suggestion" ? "O que podemos melhorar?" : "O que aconteceu?"}
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={feedbackType === "bug" ? "Descreva o erro que encontrou..." : "Escreva sua mensagem..."}
                rows={3}
                maxLength={1000}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
              <p className="text-[10px] text-muted-foreground text-right mt-1">{message.length}/1000</p>
            </div>

            {/* Send */}
            <button
              onClick={handleSendFeedback}
              disabled={sending || !message.trim()}
              className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
