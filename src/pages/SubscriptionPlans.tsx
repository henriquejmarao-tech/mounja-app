import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { Check, Crown, Sparkles, Gift, CreditCard, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useEmblaCarousel from "embla-carousel-react";
import mascotPointingImg from "@/assets/mascot-pointing-down.png";
import mascotSittingImg from "@/assets/mascot-sitting.png";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

/* ─── plan data ─── */
interface Plan {
  id: string;
  title: string;
  price: string;
  badge?: string;
  discount?: string;
  benefits: string[];
  cta: string;
  highlighted: boolean;
  muted: boolean;
  subtitle?: string;
}

const plans: Plan[] = [
  {
    id: "trimestral",
    title: "Plano Trimestral",
    price: "R$ 49,99",
    badge: "Mais escolhido",
    discount: "Economize 33%",
    benefits: [
      "Registrar refeições com IA",
      "Acompanhar insights de aplicação",
      "Plano personalizado ativo",
    ],
    cta: "Escolher plano",
    highlighted: true,
    muted: false,
  },
  {
    id: "mensal",
    title: "Plano Mensal",
    price: "R$ 24,99",
    benefits: [
      "Registrar refeições",
      "Acompanhar progresso",
      "Insights básicos",
    ],
    cta: "Continuar com mensal",
    highlighted: false,
    muted: false,
  },
  {
    id: "gratuito",
    title: "Plano gratuito",
    subtitle: "Acesso limitado",
    price: "R$ 0",
    benefits: [
      "Visualizar plano",
      "Sem registro de refeições",
      "Sem insights completos",
    ],
    cta: "Continuar sem assinatura",
    highlighted: false,
    muted: true,
  },
];

/* ─── main page ─── */
const SubscriptionPlans = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const { isPremium, source, plan: currentPlan, refresh: refreshPlan, loading: planLoading } = usePlan();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Coupon drawer state
  const [couponDrawerOpen, setCouponDrawerOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error("Portal error:", err);
      toast.error("Erro ao abrir gerenciamento de assinatura");
    } finally {
      setPortalLoading(false);
    }
  };

  // Image preloading
  const [pointingLoaded, setPointingLoaded] = useState(false);
  const [sittingLoaded, setSittingLoaded] = useState(false);
  const [revealStage, setRevealStage] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    skipSnaps: false,
  });

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Assinatura ativada com sucesso! 🎉");
      refreshPlan();
      // Mark subscription_seen and navigate
      if (user) {
        supabase
          .from("profiles")
          .update({ subscription_seen: true } as any)
          .eq("id", user.id)
          .then(() => refreshProfile().then(() => navigate("/", { replace: true })));
      }
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout cancelado");
    }
  }, [searchParams]);

  // Preload images
  useEffect(() => {
    const img1 = new Image();
    img1.src = mascotPointingImg;
    img1.onload = () => setPointingLoaded(true);
    const img2 = new Image();
    img2.src = mascotSittingImg;
    img2.onload = () => setSittingLoaded(true);
  }, []);

  // Staggered reveal
  useEffect(() => {
    if (!pointingLoaded) return;
    const t1 = setTimeout(() => setRevealStage(1), 100);
    const t2 = setTimeout(() => setRevealStage(2), 500);
    const t3 = setTimeout(() => setRevealStage(3), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [pointingLoaded]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const handleSelectPlan = async (planId: string) => {
    if (!user || loading || checkoutLoading) return;

    if (planId === "gratuito") {
      // Free plan — just mark as seen
      setLoading(true);
      try {
        await supabase
          .from("profiles")
          .update({ subscription_seen: true, selected_plan: planId } as any)
          .eq("id", user.id);
        await refreshProfile();
        navigate("/", { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
      return;
    }

    // Paid plan — create Stripe checkout
    setCheckoutLoading(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId },
      });
      if (error) throw error;
      if (data?.url) {
        // Mark subscription_seen before redirecting
        await supabase
          .from("profiles")
          .update({ subscription_seen: true } as any)
          .eq("id", user.id);
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Erro ao iniciar checkout. Tente novamente.");
      setCheckoutLoading(null);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim() || couponLoading) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-promo-code", {
        body: { code: couponCode.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setCouponLoading(false);
        return;
      }

      toast.success("Premium ativado! 🎉");
      setCouponDrawerOpen(false);
      setCouponCode("");

      // Mark subscription_seen and refresh
      if (user) {
        await supabase
          .from("profiles")
          .update({ subscription_seen: true, selected_plan: "promo" } as any)
          .eq("id", user.id);
        await refreshProfile();
        await refreshPlan();
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      console.error("Coupon error:", err);
      toast.error("Erro ao resgatar código. Tente novamente.");
    } finally {
      setCouponLoading(false);
    }
  };

  const showPointingMascot = selectedIndex === 0;
  const showSittingMascot = selectedIndex === 1;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 text-center relative z-30">
        <h1 className="text-xl font-bold text-foreground">
          {isPremium ? "Você é Premium! 👑" : "Escolha seu plano"}
        </h1>
      </div>

      {/* Premium status banner */}
      {isPremium && !planLoading && (
        <div className="px-6 pb-4 z-30 animate-fade-in">
          <div className="rounded-2xl p-4 border border-border/30 bg-card shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, hsl(270,80%,60%) 0%, hsl(330,80%,65%) 100%)",
                }}
              >
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {source === "stripe"
                    ? currentPlan === "trimestral" ? "Plano Trimestral" : "Plano Mensal"
                    : "Acesso Promocional"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {source === "stripe" ? "Assinatura ativa via Stripe" : "Ativado por código promocional"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {source === "stripe" && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-border/50 bg-muted/30 text-foreground active:scale-[0.97] transition-all flex items-center justify-center gap-1.5"
                >
                  {portalLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      Gerenciar assinatura
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white active:scale-[0.97] transition-all"
                style={{
                  background: "linear-gradient(135deg, hsl(270,80%,60%) 0%, hsl(330,80%,65%) 100%)",
                }}
              >
                Voltar ao app
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mascot area */}
      <div className="relative flex justify-center items-end h-[140px] z-20 overflow-visible">
        <img
          src={mascotPointingImg}
          alt="Mounjá apontando"
          style={{ filter: "drop-shadow(0px 6px 12px rgba(0,0,0,0.12))", background: "transparent" }}
          className={cn(
            "absolute bottom-0 w-[200px] h-auto object-contain",
            "transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            revealStage >= 1 && showPointingMascot ? "opacity-100 translate-y-[68px]" : "opacity-0 translate-y-[40px] pointer-events-none"
          )}
        />
        <div className={cn(
          "absolute bottom-0 w-[90px] h-[10px] rounded-[50%] bg-black/[0.08] blur-[6px]",
          "transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          revealStage >= 1 && showPointingMascot ? "opacity-100 translate-y-[62px]" : "opacity-0 translate-y-[40px] pointer-events-none"
        )} />

        <img
          src={mascotSittingImg}
          alt="Mounjá sentado"
          style={{ filter: "drop-shadow(0px 6px 12px rgba(0,0,0,0.12))", background: "transparent" }}
          className={cn(
            "absolute bottom-0 w-[135px] h-auto object-contain",
            "transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            sittingLoaded && showSittingMascot ? "opacity-100 translate-y-[58px]" : "opacity-0 translate-y-[30px] pointer-events-none"
          )}
        />
        <div className={cn(
          "absolute bottom-0 w-[80px] h-[8px] rounded-[50%] bg-black/[0.07] blur-[5px]",
          "transition-all duration-[400ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          sittingLoaded && showSittingMascot ? "opacity-100 translate-y-[52px]" : "opacity-0 translate-y-[30px] pointer-events-none"
        )} />
      </div>

      {/* Carousel */}
      <div className={cn(
        "flex-1 flex flex-col px-0 pt-0 pb-6 transition-all duration-500 ease-out relative z-10",
        revealStage >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {plans.map((plan, idx) => (
              <div key={plan.id} className="flex-[0_0_82%] min-w-0 pl-4 first:pl-6 last:pr-6">
                <PlanCard
                  plan={plan}
                  active={idx === selectedIndex}
                  onSelect={() => handleSelectPlan(plan.id)}
                  loading={loading || checkoutLoading === plan.id}
                  showCta={revealStage >= 3}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {plans.map((_, idx) => (
            <div key={idx} className={cn(
              "h-2 rounded-full transition-all duration-300",
              idx === selectedIndex
                ? "w-6 bg-gradient-to-r from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)]"
                : "w-2 bg-muted-foreground/25"
            )} />
          ))}
        </div>

        {/* Coupon CTA */}
        <div className={cn(
          "px-6 mt-4 transition-all duration-500 ease-out",
          revealStage >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}>
          <button
            onClick={() => setCouponDrawerOpen(true)}
            className="w-full py-3 rounded-2xl border border-border/50 bg-card text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <Gift className="w-4 h-4" />
            Tenho um código
          </button>
        </div>
      </div>

      {/* Coupon Drawer */}
      <Drawer open={couponDrawerOpen} onOpenChange={setCouponDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-lg font-bold">Resgatar código</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 pb-8 space-y-5">
            <p className="text-sm text-muted-foreground">
              Insira seu código promocional para ativar o acesso premium.
            </p>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Ex: PROMO-2025"
              className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 tracking-widest font-mono font-bold text-center"
              maxLength={20}
              autoFocus
            />
            <button
              onClick={handleRedeemCoupon}
              disabled={!couponCode.trim() || couponLoading}
              className={cn(
                "w-full py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 touch-manipulation disabled:opacity-50",
                couponCode.trim()
                  ? "text-white shadow-lg"
                  : "bg-muted text-muted-foreground"
              )}
              style={couponCode.trim() ? {
                background: "linear-gradient(135deg, hsl(270,80%,60%) 0%, hsl(330,80%,65%) 100%)",
                boxShadow: "0 4px 20px -4px hsl(300 70% 60% / 0.35)",
              } : undefined}
            >
              {couponLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : (
                "Resgatar código"
              )}
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

/* ─── plan card ─── */
const PlanCard = ({
  plan,
  active,
  onSelect,
  loading,
  showCta,
}: {
  plan: Plan;
  active: boolean;
  onSelect: () => void;
  loading: boolean;
  showCta: boolean;
}) => {
  return (
    <div className={cn(
      "relative rounded-[22px] p-[1.5px] transition-all duration-300",
      plan.highlighted
        ? "bg-gradient-to-br from-[hsl(270,80%,60%)] via-[hsl(300,70%,60%)] to-[hsl(330,80%,65%)]"
        : "bg-border",
      active ? "scale-100" : "scale-[0.95] opacity-80"
    )}>
      {plan.highlighted && (
        <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-br from-[hsl(270,80%,60%)/0.2] via-[hsl(300,70%,60%)/0.1] to-[hsl(330,80%,65%)/0.2] blur-lg -z-10" />
      )}
      <div className={cn(
        "rounded-[21px] p-5 flex flex-col min-h-[340px]",
        plan.muted ? "bg-muted/80" : "bg-card"
      )}>
        {plan.badge && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)] text-white text-[11px] font-bold uppercase tracking-wide">
              <Crown className="w-3 h-3" />
              {plan.badge}
            </div>
          </div>
        )}
        <h3 className={cn("text-lg font-bold", plan.muted ? "text-muted-foreground" : "text-foreground")}>
          {plan.title}
        </h3>
        {plan.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>}
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className={cn(
            "text-2xl font-extrabold",
            plan.highlighted
              ? "bg-gradient-to-r from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)] bg-clip-text text-transparent"
              : plan.muted ? "text-muted-foreground" : "text-foreground"
          )}>
            {plan.price}
          </span>
          {plan.id !== "gratuito" && (
            <span className="text-xs text-muted-foreground">
              /{plan.id === "trimestral" ? "trimestre" : "mês"}
            </span>
          )}
        </div>
        {plan.discount && (
          <div className="mt-2 inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-md bg-[hsl(270,80%,60%)/0.08] text-[hsl(270,80%,55%)] text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            {plan.discount}
          </div>
        )}
        <div className="mt-4 space-y-2.5">
          {plan.benefits.map((benefit, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className={cn(
                "w-[18px] h-[18px] rounded-full flex items-center justify-center mt-0.5 shrink-0",
                plan.highlighted
                  ? "bg-gradient-to-br from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)]"
                  : plan.muted ? "bg-muted-foreground/20" : "bg-primary/15"
              )}>
                <Check className={cn(
                  "w-2.5 h-2.5",
                  plan.highlighted ? "text-white" : plan.muted ? "text-muted-foreground" : "text-primary"
                )} strokeWidth={3} />
              </div>
              <span className={cn(
                "text-sm leading-snug",
                plan.muted ? "text-muted-foreground" : "text-foreground/80"
              )}>
                {benefit}
              </span>
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={onSelect}
          disabled={loading}
          className={cn(
            "mt-4 w-full py-3 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2",
            plan.highlighted
              ? "text-white shadow-lg"
              : plan.muted
                ? "bg-muted text-muted-foreground border border-border"
                : "bg-foreground/5 text-foreground border border-border hover:bg-foreground/10",
            showCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
          style={plan.highlighted ? {
            background: "linear-gradient(135deg, hsl(270,80%,60%) 0%, hsl(330,80%,65%) 100%)",
            boxShadow: "0 4px 20px -4px hsl(300 70% 60% / 0.35)",
          } : undefined}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            plan.cta
          )}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
