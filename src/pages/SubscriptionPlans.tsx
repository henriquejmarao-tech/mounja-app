import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, Crown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import mascotPointingImg from "@/assets/mascot-pointing-down.png";
import mascotSittingImg from "@/assets/mascot-sitting.png";

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
  const { user, refreshProfile } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // image preloading
  const [pointingLoaded, setPointingLoaded] = useState(false);
  const [sittingLoaded, setSittingLoaded] = useState(false);
  const [revealStage, setRevealStage] = useState(0); // 0=hidden, 1=mascot, 2=card, 3=cta

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    skipSnaps: false,
  });

  // preload images
  useEffect(() => {
    const img1 = new Image();
    img1.src = mascotPointingImg;
    img1.onload = () => setPointingLoaded(true);

    const img2 = new Image();
    img2.src = mascotSittingImg;
    img2.onload = () => setSittingLoaded(true);
  }, []);

  // staggered reveal once pointing mascot is loaded
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
    if (!user || loading) return;
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
  };

  // determine which mascot to show based on selected index
  const showPointingMascot = selectedIndex === 0;
  const showSittingMascot = selectedIndex === 1;
  const showNoMascot = selectedIndex === 2;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="pt-14 pb-1 px-6 text-center relative z-10">
        <h1 className="text-xl font-bold text-foreground">
          Escolha seu plano
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-[260px] mx-auto leading-snug">
          Desbloqueie os recursos mais completos do seu tratamento
        </p>
      </div>

      {/* Mascot area — compact, mascots overlap card top edge */}
      <div className="relative flex justify-center items-end h-[120px] z-20 overflow-visible">
        {/* Pointing mascot — standing on card top edge */}
        <img
          src={mascotPointingImg}
          alt="Mounjá apontando"
          style={{ filter: "drop-shadow(0px 8px 20px rgba(0,0,0,0.12))", background: "transparent" }}
          className={cn(
            "absolute bottom-0 w-[180px] h-auto object-contain transition-all duration-500 ease-out",
            revealStage >= 1 && showPointingMascot
              ? "opacity-100 translate-y-[55px]"
              : "opacity-0 translate-y-[70px] pointer-events-none"
          )}
        />
        {/* Sitting mascot — seated on card top edge */}
        <img
          src={mascotSittingImg}
          alt="Mounjá sentado"
          style={{ filter: "drop-shadow(0px 8px 20px rgba(0,0,0,0.12))", background: "transparent" }}
          className={cn(
            "absolute bottom-0 w-[120px] h-auto object-contain transition-all duration-500 ease-out",
            sittingLoaded && showSittingMascot
              ? "opacity-100 translate-y-[45px]"
              : "opacity-0 translate-y-[60px] pointer-events-none"
          )}
        />
      </div>

      {/* Carousel */}
      <div
        className={cn(
          "flex-1 flex flex-col px-0 pt-0 pb-6 transition-all duration-500 ease-out relative z-10",
          revealStage >= 2
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        )}
      >
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {plans.map((plan, idx) => (
              <div
                key={plan.id}
                className="flex-[0_0_82%] min-w-0 pl-4 first:pl-6 last:pr-6"
              >
                <PlanCard
                  plan={plan}
                  active={idx === selectedIndex}
                  onSelect={() => handleSelectPlan(plan.id)}
                  loading={loading}
                  showCta={revealStage >= 3}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {plans.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                idx === selectedIndex
                  ? "w-6 bg-gradient-to-r from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)]"
                  : "w-2 bg-muted-foreground/25"
              )}
            />
          ))}
        </div>
      </div>
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
    <div
      className={cn(
        "relative rounded-[22px] p-[1.5px] transition-all duration-300",
        plan.highlighted
          ? "bg-gradient-to-br from-[hsl(270,80%,60%)] via-[hsl(300,70%,60%)] to-[hsl(330,80%,65%)]"
          : "bg-border",
        active ? "scale-100" : "scale-[0.95] opacity-80"
      )}
    >
      {plan.highlighted && (
        <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-br from-[hsl(270,80%,60%)/0.2] via-[hsl(300,70%,60%)/0.1] to-[hsl(330,80%,65%)/0.2] blur-lg -z-10" />
      )}

      <div
        className={cn(
          "rounded-[21px] p-5 flex flex-col",
          plan.muted ? "bg-muted/80" : "bg-card"
        )}
      >
        {plan.badge && (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)] text-white text-[11px] font-bold uppercase tracking-wide">
              <Crown className="w-3 h-3" />
              {plan.badge}
            </div>
          </div>
        )}

        <h3
          className={cn(
            "text-lg font-bold",
            plan.muted ? "text-muted-foreground" : "text-foreground"
          )}
        >
          {plan.title}
        </h3>

        {plan.subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{plan.subtitle}</p>
        )}

        <div className="flex items-baseline gap-1.5 mt-2">
          <span
            className={cn(
              "text-2xl font-extrabold",
              plan.highlighted
                ? "bg-gradient-to-r from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)] bg-clip-text text-transparent"
                : plan.muted
                ? "text-muted-foreground"
                : "text-foreground"
            )}
          >
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
              <div
                className={cn(
                  "w-[18px] h-[18px] rounded-full flex items-center justify-center mt-0.5 shrink-0",
                  plan.highlighted
                    ? "bg-gradient-to-br from-[hsl(270,80%,60%)] to-[hsl(330,80%,65%)]"
                    : plan.muted
                    ? "bg-muted-foreground/20"
                    : "bg-primary/15"
                )}
              >
                <Check
                  className={cn(
                    "w-2.5 h-2.5",
                    plan.highlighted
                      ? "text-white"
                      : plan.muted
                      ? "text-muted-foreground"
                      : "text-primary"
                  )}
                  strokeWidth={3}
                />
              </div>
              <span
                className={cn(
                  "text-sm leading-snug",
                  plan.muted ? "text-muted-foreground" : "text-foreground/80"
                )}
              >
                {benefit}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onSelect}
          disabled={loading}
          className={cn(
            "mt-5 w-full py-3 rounded-2xl font-bold text-sm transition-all duration-300 active:scale-[0.97]",
            plan.highlighted
              ? "text-white shadow-lg"
              : plan.muted
              ? "bg-muted text-muted-foreground border border-border"
              : "bg-foreground/5 text-foreground border border-border hover:bg-foreground/10",
            showCta ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
          style={
            plan.highlighted
              ? {
                  background:
                    "linear-gradient(135deg, hsl(270,80%,60%) 0%, hsl(330,80%,65%) 100%)",
                  boxShadow:
                    "0 4px 20px -4px hsl(300 70% 60% / 0.35)",
                }
              : undefined
          }
        >
          {plan.cta}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
