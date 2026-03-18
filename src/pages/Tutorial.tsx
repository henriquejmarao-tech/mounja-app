import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Scale, ClipboardList, Camera, Utensils, Flame,
  Beef, Leaf, Syringe, TrendingUp, Lock, Crown,
  ChevronRight, X, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useEmblaCarousel from "embla-carousel-react";
import mascotPointing from "@/assets/mascot-pointing.png";

/* ─── slide data ─── */
interface Slide {
  title: string;
  subtitle: string;
  color: string;
  items?: { icon: React.ElementType; text: string }[];
  premiumHint?: string;
  isFinal?: boolean;
}

const slides: Slide[] = [
  {
    title: "Seu acompanhamento,\nsimplificado",
    subtitle: "Acompanhe seu tratamento, alimentação e evolução em um só lugar",
    color: "11 55% 66%",
  },
  {
    title: "Crie consistência\ndiária",
    subtitle: "Registre o essencial todos os dias",
    color: "160 45% 45%",
    items: [
      { icon: ClipboardList, text: "Registre sintomas" },
      { icon: Scale, text: "Atualize seu peso" },
      { icon: TrendingUp, text: "Acompanhe seu progresso" },
    ],
  },
  {
    title: "Entenda sua\nalimentação",
    subtitle: "Nutrição inteligente na palma da mão",
    color: "38 85% 55%",
    items: [
      { icon: Camera, text: "Registre refeições com foto" },
      { icon: Flame, text: "Acompanhe calorias" },
      { icon: Beef, text: "Controle proteína e fibra" },
    ],
    premiumHint: "Disponível no plano premium",
  },
  {
    title: "Tenha clareza do\nseu tratamento",
    subtitle: "Insights inteligentes sobre sua evolução",
    color: "270 60% 55%",
    items: [
      { icon: Syringe, text: "Veja quando aplicar" },
      { icon: TrendingUp, text: "Receba insights da IA" },
      { icon: Sparkles, text: "Análise personalizada" },
    ],
    premiumHint: "Recurso premium",
  },
  {
    title: "Pronto para\ncomeçar",
    subtitle: "Sua jornada começa agora",
    color: "11 55% 66%",
    isFinal: true,
  },
];

/* ─── mini visual elements ─── */
const DailyCards = ({ color }: { color: string }) => (
  <div className="flex gap-2 justify-center mt-1">
    {[Scale, ClipboardList, Camera].map((Icon, i) => (
      <div
        key={i}
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: `hsl(${color} / 0.08)` }}
      >
        <Icon className="w-6 h-6" style={{ color: `hsl(${color})` }} />
      </div>
    ))}
  </div>
);

const NutritionRings = ({ color }: { color: string }) => (
  <div className="flex gap-3 justify-center mt-1">
    {[
      { pct: 72, icon: Flame, ringColor: "11 55% 66%" },
      { pct: 55, icon: Beef, ringColor: "270 60% 55%" },
      { pct: 40, icon: Leaf, ringColor: "160 45% 45%" },
    ].map(({ pct, icon: Icon, ringColor }, i) => (
      <div key={i} className="relative w-12 h-12">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke={`hsl(${ringColor} / 0.12)`} strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={`hsl(${ringColor})`} strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 88} 88`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${ringColor})` }} />
        </div>
      </div>
    ))}
  </div>
);

const InsightPreview = ({ color }: { color: string }) => (
  <div className="flex flex-col gap-2 items-center mt-1">
    <div
      className="w-full max-w-[200px] rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{ background: `hsl(${color} / 0.06)` }}
    >
      <Syringe className="w-5 h-5 shrink-0" style={{ color: `hsl(${color})` }} />
      <div>
        <p className="text-[11px] font-bold text-foreground/70">Próxima aplicação</p>
        <p className="text-[10px] text-muted-foreground">Em 3 dias</p>
      </div>
    </div>
  </div>
);

/* ─── main component ─── */
const Tutorial = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entered, setEntered] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    skipSnaps: false,
    watchDrag: true,
  });

  // Entry animation
  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 100);
    return () => clearTimeout(t);
  }, []);

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

  const completeTutorial = async () => {
    if (user) {
      await supabase.from("profiles").update({
        tutorial_version_completed: "v2",
      } as any).eq("id", user.id);
      await refreshProfile();
    }
    navigate("/", { replace: true });
  };

  const goNext = () => {
    if (!emblaApi) return;
    if (selectedIndex === slides.length - 1) {
      completeTutorial();
    } else {
      emblaApi.scrollNext();
    }
  };

  const slide = slides[selectedIndex];
  const isLast = selectedIndex === slides.length - 1;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden relative">
      {/* Skip button */}
      {!isLast && (
        <button
          onClick={completeTutorial}
          className={cn(
            "absolute top-12 right-5 z-50 text-xs font-semibold text-muted-foreground px-3 py-1.5 rounded-full bg-muted/50 active:scale-95 transition-all",
            entered ? "opacity-100" : "opacity-0"
          )}
        >
          Pular
        </button>
      )}

      {/* Mascot area */}
      <div className={cn(
        "pt-16 pb-2 flex justify-center transition-all duration-700 ease-out",
        entered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
      )}>
        <img
          src={mascotPointing}
          alt="Mounjá"
          className="w-[120px] h-auto object-contain"
          style={{ filter: "drop-shadow(0px 6px 12px rgba(0,0,0,0.10))" }}
        />
      </div>

      {/* Carousel */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-500 ease-out",
        entered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}>
        <div ref={emblaRef} className="overflow-hidden flex-1">
          <div className="flex h-full">
            {slides.map((s, idx) => (
              <div key={idx} className="flex-[0_0_100%] min-w-0 px-7">
                <SlideContent
                  slide={s}
                  index={idx}
                  active={idx === selectedIndex}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 py-4">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                idx === selectedIndex
                  ? "w-6"
                  : "w-2 bg-muted-foreground/20"
              )}
              style={idx === selectedIndex ? {
                background: `hsl(${slide.color})`,
              } : undefined}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="px-7 pb-10 space-y-3">
          <button
            onClick={goNext}
            className="w-full py-4 rounded-2xl font-bold text-[15px] text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-lg"
            style={{
              background: `linear-gradient(135deg, hsl(${slide.color}) 0%, hsl(${slide.color} / 0.8) 100%)`,
              boxShadow: `0 6px 24px -4px hsl(${slide.color} / 0.3)`,
            }}
          >
            {isLast ? "Entrar no app" : selectedIndex === 0 ? "Começar" : "Próximo"}
            <ChevronRight className="w-4 h-4" />
          </button>

          {isLast && (
            <button
              onClick={() => navigate("/planos")}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-muted-foreground border border-border/50 bg-card active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Ver planos
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── individual slide content ─── */
const SlideContent = ({
  slide,
  index,
  active,
}: {
  slide: Slide;
  index: number;
  active: boolean;
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center text-center pt-4 transition-all duration-300",
      active ? "opacity-100 scale-100" : "opacity-40 scale-95"
    )}>
      {/* Title */}
      <h1
        className="text-[26px] font-extrabold leading-tight tracking-tight whitespace-pre-line mb-2"
        style={{ color: "hsl(var(--foreground))" }}
      >
        {slide.title}
      </h1>
      <p className="text-sm text-muted-foreground font-medium max-w-[280px] mb-6">
        {slide.subtitle}
      </p>

      {/* Visual area */}
      {index === 0 && (
        <div className="w-full max-w-[260px] rounded-3xl p-5 bg-card border border-border/40 shadow-card">
          <div className="flex gap-3 justify-center mb-3">
            {[
              { icon: Scale, label: "Peso", color: "11 55% 66%" },
              { icon: Utensils, label: "Refeições", color: "38 85% 55%" },
              { icon: TrendingUp, label: "Evolução", color: "160 45% 45%" },
            ].map(({ icon: Icon, label, color }, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: `hsl(${color} / 0.1)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${color})` }} />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {index === 1 && (
        <div className="w-full max-w-[280px]">
          <div className="rounded-3xl p-5 bg-card border border-border/40 shadow-card space-y-3">
            {slide.items?.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${slide.color} / 0.1)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${slide.color})` }} />
                </div>
                <span className="text-[14px] font-semibold text-foreground/80 text-left">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <DailyCards color={slide.color} />
          </div>
        </div>
      )}

      {index === 2 && (
        <div className="w-full max-w-[280px]">
          <div className="rounded-3xl p-5 bg-card border border-border/40 shadow-card space-y-3">
            {slide.items?.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${slide.color} / 0.1)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${slide.color})` }} />
                </div>
                <span className="text-[14px] font-semibold text-foreground/80 text-left">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <NutritionRings color={slide.color} />
          </div>
          {slide.premiumHint && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold"
              style={{ color: `hsl(270 60% 55%)` }}
            >
              <Crown className="w-3 h-3" />
              {slide.premiumHint}
            </div>
          )}
        </div>
      )}

      {index === 3 && (
        <div className="w-full max-w-[280px]">
          <div className="rounded-3xl p-5 bg-card border border-border/40 shadow-card space-y-3">
            {slide.items?.map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${slide.color} / 0.1)` }}
                >
                  <Icon className="w-5 h-5" style={{ color: `hsl(${slide.color})` }} />
                </div>
                <span className="text-[14px] font-semibold text-foreground/80 text-left">{text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <InsightPreview color={slide.color} />
          </div>
          {slide.premiumHint && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold"
              style={{ color: `hsl(270 60% 55%)` }}
            >
              <Lock className="w-3 h-3" />
              {slide.premiumHint}
            </div>
          )}
        </div>
      )}

      {index === 4 && (
        <div className="w-full max-w-[260px] rounded-3xl p-6 bg-card border border-border/40 shadow-card">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: `linear-gradient(135deg, hsl(${slide.color} / 0.15) 0%, hsl(160 45% 45% / 0.15) 100%)`,
            }}
          >
            <Sparkles className="w-7 h-7" style={{ color: `hsl(${slide.color})` }} />
          </div>
          <p className="text-sm text-foreground/70 font-medium leading-relaxed">
            Tudo pronto! Explore o app no seu ritmo e descubra como acompanhar seu tratamento de forma simples.
          </p>
        </div>
      )}
    </div>
  );
};

export default Tutorial;
