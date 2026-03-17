import { useState } from "react";
import {
  ChevronRight, LogOut, MessageSquare, Star, Send, Bug, Lightbulb, X,
  Pill, Ruler, Share2, Star as StarOutline, HelpCircle, CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

type FeedbackType = "rating" | "suggestion" | "bug";

const feedbackTypes = [
  { value: "rating" as FeedbackType, label: "Avaliar", emoji: "⭐", Icon: Star },
  { value: "suggestion" as FeedbackType, label: "Sugerir", emoji: "💡", Icon: Lightbulb },
  { value: "bug" as FeedbackType, label: "Reportar erro", emoji: "🐛", Icon: Bug },
];

const Settings = () => {
  const navigate = useNavigate();
  const { profile, signOut, user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("rating");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showHeight, setShowHeight] = useState(false);
  const [heightInt, setHeightInt] = useState(170);
  const [heightDec, setHeightDec] = useState(0);

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSendFeedback = async () => {
    if (!user) return;
    if (!message.trim()) { toast.error("Escreva sua mensagem."); return; }
    if (feedbackType === "rating" && rating === 0) { toast.error("Selecione uma avaliação."); return; }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id, type: feedbackType,
      rating: feedbackType === "rating" ? rating : null,
      message: message.trim(),
    } as any);
    if (error) toast.error("Erro ao enviar.");
    else { toast.success("Obrigado pelo feedback! 💚"); setShowFeedback(false); setMessage(""); setRating(0); }
    setSending(false);
  };

  const openHeight = () => {
    const h = profile?.height_cm ? Number(profile.height_cm) : 170;
    setHeightInt(Math.floor(h));
    setHeightDec(Math.round((h % 1) * 10));
    setShowHeight(true);
  };

  const saveHeight = async () => {
    if (!user) return;
    const value = heightInt + heightDec / 10;
    const { error } = await supabase.from("profiles").update({ height_cm: value }).eq("id", user.id);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Altura atualizada");
    setShowHeight(false);
  };

  const handleShare = async () => {
    const shareUrl = "https://mounja-app.lovable.app";
    if (navigator.share) {
      await navigator.share({ title: "Mounja", text: "Acompanhe sua jornada com Mounjaro®", url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-6 pt-safe pb-1">
        <h1 className="text-2xl font-extrabold text-foreground mt-4">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie sua experiência</p>
      </div>

      <div className="px-5 mt-6 space-y-6">
        {/* ── Section 1: Seu tratamento ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-2">
            Seu tratamento
          </p>
          <div className="bg-card rounded-[20px] border border-border/30 shadow-card divide-y divide-border/30 overflow-hidden">
            <MenuItem
              icon={Pill}
              iconColor="hsl(295, 45%, 55%)"
              label="Plano de tratamento"
              subtitle="Medicamento, dose e agenda"
              onClick={() => navigate("/plano-tratamento")}
            />
            <MenuItem
              icon={CreditCard}
              iconColor="hsl(295, 45%, 55%)"
              label="Alterar plano"
              subtitle="Gerencie sua assinatura"
              onClick={() => navigate("/planos")}
            />
            <MenuItem
              icon={Ruler}
              iconColor="hsl(295, 45%, 55%)"
              label="Atualizar altura"
              subtitle={profile?.height_cm ? `Atual: ${Number(profile.height_cm).toFixed(0)} cm` : "Defina sua altura"}
              onClick={openHeight}
            />
          </div>
        </div>

        {/* ── Section 2: Preferências e suporte ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-2">
            Preferências e suporte
          </p>
          <div className="bg-card rounded-[20px] border border-border/30 shadow-card divide-y divide-border/30 overflow-hidden">
            <MenuItem
              icon={HelpCircle}
              iconColor="hsl(210, 50%, 60%)"
              label="Como usar"
              subtitle="Aprenda a usar cada aba"
              onClick={() => navigate("/como-usar")}
            />
            <MenuItem
              icon={Lightbulb}
              iconColor="hsl(210, 50%, 60%)"
              label="Sugerir funcionalidade"
              subtitle="Nos ajude a melhorar"
              onClick={() => { setFeedbackType("suggestion"); setShowFeedback(true); }}
            />
          </div>
        </div>

        {/* ── Section 3: Crescimento ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-2">
            Crescimento
          </p>
          <div className="bg-card rounded-[20px] border border-border/30 shadow-card divide-y divide-border/30 overflow-hidden">
            <MenuItem
              icon={Share2}
              iconColor="hsl(340, 55%, 60%)"
              label="Compartilhar Mounja"
              subtitle="Indique para amigos"
              onClick={handleShare}
            />
            <MenuItem
              icon={StarOutline}
              iconColor="hsl(340, 55%, 60%)"
              label="Avaliar o app"
              subtitle="Sua opinião importa"
              onClick={() => { setFeedbackType("rating"); setShowFeedback(true); }}
            />
          </div>
        </div>

        {/* User ID */}
        <p className="text-[10px] text-muted-foreground/30 text-center select-all">
          {user?.id}
        </p>

        {/* ── Logout ── */}
        <div className="pt-2 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-2xl bg-destructive/5 text-destructive/80 active:scale-[0.98] transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>

      {/* Height Drawer */}
      <Drawer open={showHeight} onOpenChange={setShowHeight}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            <DrawerHeader className="px-0 pt-2 pb-4">
              <DrawerTitle className="text-lg font-bold text-center">Atualizar altura</DrawerTitle>
            </DrawerHeader>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => setHeightInt((v) => v + 1)} className="text-sm text-muted-foreground/50 h-5">{heightInt + 2}</button>
                <button onClick={() => setHeightInt((v) => v + 1)} className="text-base text-muted-foreground h-6">{heightInt + 1}</button>
                <div className="bg-muted rounded-xl px-8 py-3 my-1">
                  <span className="text-2xl font-bold text-foreground">{heightInt}</span>
                </div>
                <button onClick={() => setHeightInt((v) => Math.max(100, v - 1))} className="text-base text-muted-foreground h-6">{heightInt - 1}</button>
                <button onClick={() => setHeightInt((v) => Math.max(100, v - 1))} className="text-sm text-muted-foreground/50 h-5">{heightInt - 2}</button>
              </div>
              <span className="text-lg font-semibold text-muted-foreground ml-1">cm</span>
            </div>
            <button onClick={saveHeight} className="w-full py-4 rounded-full gradient-hero text-primary-foreground text-base font-bold active:scale-[0.98] transition-transform shadow-elevated">
              Salvar
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Feedback modal */}
      {showFeedback && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/30 backdrop-blur-sm" onClick={() => setShowFeedback(false)}>
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-5 pb-8 animate-fade-in shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Dar opinião</h2>
              <button onClick={() => setShowFeedback(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-2 mb-5">
              {feedbackTypes.map((ft) => (
                <button key={ft.value} onClick={() => setFeedbackType(ft.value)}
                  className={cn("flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-xs font-semibold",
                    feedbackType === ft.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"
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

/* ── Menu Item ── */
interface MenuItemProps {
  icon: any;
  iconColor: string;
  label: string;
  subtitle?: string;
  onClick: () => void;
}

const MenuItem = ({ icon: Icon, iconColor, label, subtitle, onClick }: MenuItemProps) => (
  <button onClick={onClick} className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/30 transition-colors">
    <div className="flex items-center gap-3.5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${iconColor}12` }}
      >
        <Icon className="w-[18px] h-[18px]" style={{ color: iconColor }} />
      </div>
      <div className="text-left">
        <span className="text-[15px] font-semibold text-foreground leading-tight block">{label}</span>
        {subtitle && <span className="text-[11px] text-muted-foreground/60 leading-tight">{subtitle}</span>}
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
  </button>
);

export default Settings;
