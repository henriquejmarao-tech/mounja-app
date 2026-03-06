import { useState } from "react";
import { User, Bell, Shield, HelpCircle, ChevronRight, LogOut, MessageSquare, Star, Send, Bug, Lightbulb, X, BookOpen, Syringe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useApplicationData } from "@/hooks/useApplicationData";
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
  const { profile, signOut, user, refreshProfile } = useAuth();
  const { refresh, dose } = useApplicationData();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("rating");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [intervalDays, setIntervalDays] = useState<string>(String(dose.applicationIntervalDays || (profile as any)?.application_interval_days || 7));
  const [savingInterval, setSavingInterval] = useState(false);

  const handleSaveInterval = async () => {
    if (!user) return;
    const val = parseInt(intervalDays);
    if (!val || val < 1) { toast.error("Intervalo deve ser positivo."); return; }
    setSavingInterval(true);
    const { error } = await supabase.from("profiles").update({ application_interval_days: val } as any).eq("id", user.id);
    if (error) { toast.error("Erro ao salvar."); }
    else { await refreshProfile(); await refresh(); toast.success("Intervalo atualizado ✓"); }
    setSavingInterval(false);
  };

  const handleLogout = async () => { await signOut(); navigate("/auth"); };

  const handleSendFeedback = async () => {
    if (!user) return;
    if (!message.trim()) { toast.error("Escreva sua mensagem."); return; }
    if (feedbackType === "rating" && rating === 0) { toast.error("Selecione uma avaliação."); return; }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({ user_id: user.id, type: feedbackType, rating: feedbackType === "rating" ? rating : null, message: message.trim() } as any);
    if (error) { toast.error("Erro ao enviar."); }
    else { toast.success("Obrigado pelo feedback! 💚"); setShowFeedback(false); setMessage(""); setRating(0); }
    setSending(false);
  };

  const menuItems = [
    { icon: User, label: "Meus dados", route: "/minha-triagem", desc: "Peso, objetivo e dados pessoais" },
    { icon: Syringe, label: "Aplicações", route: "/aplicacao", desc: "Histórico e rodízio" },
    { icon: BookOpen, label: "Tutorial", route: "/tutorial", desc: "Reveja como usar o app" },
    { icon: Bell, label: "Notificações", desc: "Lembretes e alertas" },
    { icon: Shield, label: "Privacidade", desc: "Dados e segurança" },
    { icon: HelpCircle, label: "Ajuda", desc: "Dúvidas frequentes" },
  ];

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-6 pt-safe pb-2">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* Profile header */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {profile?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground truncate">{profile?.name || "Usuário"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {profile?.current_dose && <p className="text-xs text-primary font-medium mt-0.5">Dose {profile.current_dose}</p>}
          </div>
        </div>

        {/* Interval config */}
        <div className="bg-card rounded-2xl p-5 shadow-card border border-border/50 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Intervalo entre aplicações</p>
          <div className="flex gap-2">
            <input type="number" min="1" value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-secondary/30 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button onClick={handleSaveInterval} disabled={savingInterval}
              className="px-5 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50">
              {savingInterval ? "..." : "Salvar"}
            </button>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          {menuItems.map((item, i) => (
            <button key={i} onClick={() => item.route && navigate(item.route)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/40 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium block">{item.label}</span>
                {item.desc && <span className="text-[11px] text-muted-foreground">{item.desc}</span>}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </button>
          ))}
        </div>

        {/* Feedback */}
        <button onClick={() => setShowFeedback(true)}
          className="w-full flex items-center gap-3 bg-card rounded-2xl p-4 shadow-card border border-primary/10 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold">Dar opinião</span>
            <span className="text-[11px] text-muted-foreground block">Avalie, sugira ou reporte</span>
          </div>
        </button>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 text-destructive text-sm font-semibold rounded-2xl hover:bg-destructive/5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>

      {/* Feedback modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/30 backdrop-blur-sm" onClick={() => setShowFeedback(false)}>
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-5 pb-8 animate-fade-in-up shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Dar opinião</h2>
              <button onClick={() => setShowFeedback(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              {feedbackTypes.map((ft) => (
                <button key={ft.value} onClick={() => setFeedbackType(ft.value)}
                  className={cn("flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs font-semibold",
                    feedbackType === ft.value ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground"
                  )}
                >
                  <span className="text-lg">{ft.emoji}</span>{ft.label}
                </button>
              ))}
            </div>
            {feedbackType === "rating" && (
              <div className="mb-4 flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className="p-1 active:scale-90 transition-transform">
                    <Star className={cn("w-8 h-8", s <= rating ? "fill-warning text-warning" : "text-muted-foreground/30")} />
                  </button>
                ))}
              </div>
            )}
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva sua mensagem..." rows={3} maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
            />
            <button onClick={handleSendFeedback} disabled={sending || !message.trim()}
              className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated disabled:opacity-50"
            >
              {sending ? <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : <><Send className="w-4 h-4" />Enviar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
