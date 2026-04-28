import { useState } from "react";
import {
  ChevronRight, LogOut, MessageSquare, Star, Send, Bug, Lightbulb, X,
  Pill, Ruler, Share2, Star as StarOutline, HelpCircle, CreditCard,
  Sparkles, Heart, Check, Bell, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePushPermission } from "@/hooks/usePushPermission";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import mascotThinking from "@/assets/mascot-thinking-v2.png";

const Settings = () => {
  const navigate = useNavigate();
  const { profile, signOut, user, refreshProfile } = useAuth();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showHeight, setShowHeight] = useState(false);
  const [heightInt, setHeightInt] = useState(170);
  const [heightDec, setHeightDec] = useState(0);
  const [testingPush, setTestingPush] = useState(false);
  const [pushTestResult, setPushTestResult] = useState<string | null>(null);
  const {
    loading: pushLoading,
    statusLoading: pushStatusLoading,
    pushStatus,
    enablePush,
    disablePush,
    sendTestPush,
  } = usePushPermission();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const resetFeedbackState = () => {
    setMessage("");
    setRating(0);
    setSent(false);
  };

  const handleSendSuggestion = async () => {
    if (!user || !message.trim()) { toast.error("Escreva sua sugestão."); return; }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id, type: "suggestion", rating: null, message: message.trim(),
    } as any);
    setSending(false);
    if (error) { toast.error("Erro ao enviar."); return; }
    setSent(true);
  };

  const handleSendRating = async () => {
    if (!user) return;
    if (rating === 0) { toast.error("Selecione uma avaliação."); return; }
    setSending(true);
    const { error } = await supabase.from("feedback").insert({
      user_id: user.id, type: "rating", rating, message: message.trim() || `Avaliação: ${rating} estrelas`,
    } as any);
    setSending(false);
    if (error) { toast.error("Erro ao enviar."); return; }
    setSent(true);
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
    await refreshProfile();
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

  const handlePushToggle = async (enabled: boolean) => {
    setPushTestResult(null);
    try {
      if (enabled) {
        const ok = await enablePush();
        ok ? toast.success("Notificações ativadas") : toast.error("Não foi possível ativar as notificações");
      } else {
        await disablePush();
        toast.success("Notificações desativadas");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar notificações");
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    setPushTestResult(null);
    try {
      await sendTestPush();
      setPushTestResult("Enviado");
      toast.success("Push de teste enviado");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPushTestResult(`Falhou: ${message}`);
      toast.error(`Falhou: ${message}`);
    } finally {
      setTestingPush(false);
    }
  };

  const ratingEmojis = [
    { score: 1, emoji: "😞", label: "Ruim" },
    { score: 2, emoji: "😕", label: "Regular" },
    { score: 3, emoji: "😐", label: "OK" },
    { score: 4, emoji: "😊", label: "Bom" },
    { score: 5, emoji: "🤩", label: "Incrível" },
  ];

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
            <MenuItem icon={Pill} iconColor="hsl(295, 45%, 55%)" label="Plano de tratamento" subtitle="Medicamento, dose e agenda" onClick={() => navigate("/plano-tratamento")} />
            <MenuItem icon={CreditCard} iconColor="hsl(295, 45%, 55%)" label="Alterar plano" subtitle="Gerencie sua assinatura" onClick={() => navigate("/planos")} />
            <MenuItem icon={Ruler} iconColor="hsl(295, 45%, 55%)" label="Atualizar altura" subtitle={profile?.height_cm ? `Atual: ${Number(profile.height_cm).toFixed(0)} cm` : "Defina sua altura"} onClick={openHeight} />
          </div>
        </div>

        {/* ── Section 2: Notificações ── */}
        <NotificationSettingsCard
          status={pushStatus}
          loading={pushLoading || pushStatusLoading}
          testing={testingPush}
          testResult={pushTestResult}
          onToggle={handlePushToggle}
          onTest={handleSendTestPush}
        />

        {/* ── Section 3: Preferências e suporte ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-2">
            Preferências e suporte
          </p>
          <div className="bg-card rounded-[20px] border border-border/30 shadow-card divide-y divide-border/30 overflow-hidden">
            <MenuItem icon={HelpCircle} iconColor="hsl(210, 50%, 60%)" label="Como usar" subtitle="Aprenda a usar cada aba" onClick={() => navigate("/como-usar")} />
            <MenuItem icon={Lightbulb} iconColor="hsl(210, 50%, 60%)" label="Sugerir funcionalidade" subtitle="Nos ajude a melhorar" onClick={() => { resetFeedbackState(); setShowSuggestion(true); }} />
          </div>
        </div>

        {/* ── Section 4: Crescimento ── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-2">
            Crescimento
          </p>
          <div className="bg-card rounded-[20px] border border-border/30 shadow-card divide-y divide-border/30 overflow-hidden">
            <MenuItem icon={Share2} iconColor="hsl(340, 55%, 60%)" label="Compartilhar Mounja" subtitle="Indique para amigos" onClick={handleShare} />
            <MenuItem icon={StarOutline} iconColor="hsl(340, 55%, 60%)" label="Avaliar o app" subtitle="Sua opinião importa" onClick={() => { resetFeedbackState(); setShowRating(true); }} />
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/30 text-center select-all">{user?.id}</p>

        <div className="pt-2 pb-4">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-2xl bg-destructive/5 text-destructive/80 active:scale-[0.98] transition-all">
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

      {/* ══════════ SUGGEST FEATURE DRAWER ══════════ */}
      <Drawer open={showSuggestion} onOpenChange={(open) => { setShowSuggestion(open); if (!open) resetFeedbackState(); }}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            {sent ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center py-8 animate-fade-in-up">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(135deg, hsl(150,40%,92%), hsl(160,35%,94%))" }}>
                  <Check className="w-8 h-8" style={{ color: "hsl(155,45%,45%)" }} strokeWidth={2.5} />
                </div>
                <p className="text-xl font-extrabold text-foreground">Sugestão enviada!</p>
                <p className="text-sm text-muted-foreground mt-1.5 text-center">Obrigado por nos ajudar a melhorar 💚</p>
                <button
                  onClick={() => setShowSuggestion(false)}
                  className="mt-6 px-8 py-3 rounded-2xl text-sm font-bold text-white active:scale-[0.97] transition-transform"
                  style={{ background: "linear-gradient(to right, #7B2FF7, #F857A6)", boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)" }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                {/* Hero */}
                <div className="flex flex-col items-center pt-4 pb-2">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{ background: "linear-gradient(135deg, hsl(45,70%,92%), hsl(30,60%,94%))" }}>
                    <Lightbulb className="w-7 h-7" style={{ color: "hsl(40,65%,50%)" }} />
                  </div>
                  <h2 className="text-xl font-extrabold text-foreground text-center">Sua ideia importa</h2>
                  <p className="text-sm text-muted-foreground text-center mt-1 leading-relaxed">
                    Conte pra gente o que faria o app ainda melhor
                  </p>
                </div>

                {/* Input card */}
                <div className="mt-5">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Descreva sua ideia…"
                    rows={5}
                    maxLength={1000}
                    className="w-full px-5 py-4 rounded-2xl border border-border/40 bg-muted/30 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/15 resize-none placeholder:text-muted-foreground/40 leading-relaxed"
                  />
                  <p className="text-[10px] text-muted-foreground/40 text-right mt-1 pr-1">{message.length}/1000</p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleSendSuggestion}
                  disabled={sending || !message.trim()}
                  className="w-full mt-4 py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(to right, #7B2FF7, #F857A6)", boxShadow: "0 6px 20px hsl(300 60% 50% / 0.2)" }}
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar sugestão
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ══════════ RATE APP DRAWER ══════════ */}
      <Drawer open={showRating} onOpenChange={(open) => { setShowRating(open); if (!open) resetFeedbackState(); }}>
        <DrawerContent className="pb-safe">
          <div className="mx-auto w-full max-w-md px-6 pb-6">
            {sent ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center py-8 animate-fade-in-up">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "linear-gradient(135deg, hsl(330,50%,93%), hsl(270,40%,94%))" }}>
                  <Heart className="w-8 h-8 fill-current" style={{ color: "hsl(340,60%,55%)" }} />
                </div>
                <p className="text-xl font-extrabold text-foreground">Obrigado pelo seu feedback!</p>
                <p className="text-sm text-muted-foreground mt-1.5 text-center">Sua opinião ajuda a melhorar a experiência ✨</p>
                <button
                  onClick={() => setShowRating(false)}
                  className="mt-6 px-8 py-3 rounded-2xl text-sm font-bold text-white active:scale-[0.97] transition-transform"
                  style={{ background: "linear-gradient(to right, #7B2FF7, #F857A6)", boxShadow: "0 4px 16px hsl(300 60% 50% / 0.2)" }}
                >
                  Fechar
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <>
                {/* Hero */}
                <div className="flex flex-col items-center pt-4 pb-2">
                  <img
                    src={mascotThinking}
                    alt=""
                    className="w-20 h-20 object-contain mb-2"
                    style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))" }}
                  />
                  <h2 className="text-xl font-extrabold text-foreground text-center">O que você está achando?</h2>
                  <p className="text-sm text-muted-foreground text-center mt-1 leading-relaxed">
                    Sua opinião ajuda a melhorar sua experiência
                  </p>
                </div>

                {/* Emoji Rating */}
                <div className="mt-5 flex items-center justify-between px-2">
                  {ratingEmojis.map((item) => (
                    <button
                      key={item.score}
                      onClick={() => setRating(item.score)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all active:scale-90",
                        rating === item.score
                          ? "scale-110"
                          : rating > 0 ? "opacity-40 scale-95" : "opacity-70"
                      )}
                    >
                      <span className={cn(
                        "text-3xl transition-all",
                        rating === item.score && "drop-shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                      )}>
                        {item.emoji}
                      </span>
                      <span className={cn(
                        "text-[10px] font-semibold transition-all",
                        rating === item.score ? "text-foreground" : "text-muted-foreground/50"
                      )}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Optional text */}
                {rating > 0 && (
                  <div className="mt-5 animate-fade-in-up">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Quer nos contar mais?"
                      rows={3}
                      maxLength={1000}
                      className="w-full px-5 py-4 rounded-2xl border border-border/40 bg-muted/30 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/15 resize-none placeholder:text-muted-foreground/40 leading-relaxed"
                    />
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handleSendRating}
                  disabled={sending || rating === 0}
                  className="w-full mt-5 py-4 rounded-2xl text-[15px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(to right, #7B2FF7, #F857A6)", boxShadow: "0 6px 20px hsl(300 60% 50% / 0.2)" }}
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Enviar avaliação
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

type NotificationStatus = "enabled" | "disabled" | "needs_reactivation";

interface NotificationSettingsCardProps {
  status: NotificationStatus;
  loading: boolean;
  testing: boolean;
  testResult: string | null;
  onToggle: (enabled: boolean) => void;
  onTest: () => void;
}

const NotificationSettingsCard = ({ status, loading, testing, testResult, onToggle, onTest }: NotificationSettingsCardProps) => {
  const enabled = status === "enabled";
  const statusCopy = status === "enabled"
    ? { label: "Ativadas ✓", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" }
    : status === "needs_reactivation"
      ? { label: "Precisa reativar ⚠", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" }
      : { label: "Desativadas", className: "bg-muted text-muted-foreground border-border/40" };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 px-1 mb-2">
        Notificações
      </p>
      <div className="bg-card rounded-[20px] border border-border/30 shadow-card overflow-hidden">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10">
                <Bell className="w-[18px] h-[18px] text-primary" />
              </div>
              <div className="min-w-0">
                <span className="text-[15px] font-semibold text-foreground leading-tight block">Lembretes push</span>
                <span className={cn("inline-flex mt-1 items-center rounded-full border px-2 py-0.5 text-[11px] font-bold", statusCopy.className)}>
                  {loading ? "Verificando…" : statusCopy.label}
                </span>
              </div>
            </div>
            <Switch checked={enabled} disabled={loading} onCheckedChange={onToggle} />
          </div>

          {enabled && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <button
                onClick={onTest}
                disabled={testing}
                className="w-full h-11 rounded-2xl bg-secondary text-secondary-foreground text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar push de teste
              </button>
              {testResult && (
                <p className={cn("mt-2 text-xs font-semibold", testResult === "Enviado" ? "text-emerald-700" : "text-destructive")}>
                  {testResult}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
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
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}12` }}>
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
