import { ArrowLeft, House, UtensilsCrossed, TrendingUp, Scale, Camera, ClipboardList, Syringe, Salad, Target, LineChart, ImageIcon, History, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    tab: "Hoje",
    icon: House,
    color: "11 55% 66%",
    bg: "hsl(11, 40%, 97%)",
    bullets: [
      { icon: Scale, text: "Registrar peso" },
      { icon: ClipboardList, text: "Check-in de sintomas" },
      { icon: Camera, text: "Fotos de progresso" },
      { icon: Syringe, text: "Registrar aplicações" },
    ],
    hint: "chart" as const,
  },
  {
    tab: "Refeições",
    icon: UtensilsCrossed,
    color: "38 85% 55%",
    bg: "hsl(42, 50%, 97%)",
    bullets: [
      { icon: Camera, text: "Análise por foto com IA" },
      { icon: Salad, text: "Registro rápido de refeições" },
      { icon: Target, text: "Metas de calorias e proteína" },
    ],
    hint: "rings" as const,
  },
  {
    tab: "Progresso",
    icon: TrendingUp,
    color: "160 45% 45%",
    bg: "hsl(155, 30%, 97%)",
    bullets: [
      { icon: LineChart, text: "Gráfico de evolução de peso" },
      { icon: ImageIcon, text: "Comparação de fotos" },
      { icon: History, text: "Histórico de aplicações" },
    ],
    hint: "trend" as const,
  },
];

/* Tiny decorative hints — purely visual */
const MiniChart = () => (
  <svg viewBox="0 0 80 32" className="w-16 h-6 opacity-30">
    <polyline
      points="0,28 15,20 30,24 50,10 65,14 80,4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MiniRings = () => (
  <div className="flex gap-1 opacity-30">
    {[75, 50, 30].map((p, i) => (
      <svg key={i} viewBox="0 0 24 24" className="w-5 h-5">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
        <circle
          cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray={`${(p / 100) * 56.5} 56.5`}
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
        />
      </svg>
    ))}
  </div>
);

const MiniTrend = () => (
  <svg viewBox="0 0 80 32" className="w-16 h-6 opacity-30">
    <polyline
      points="0,24 20,22 40,18 55,12 70,8 80,4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="80" cy="4" r="3" fill="currentColor" />
  </svg>
);

const hintMap = { chart: MiniChart, rings: MiniRings, trend: MiniTrend };

const HowToUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-5 pt-safe">
        {/* Header */}
        <div className="flex items-center gap-3 mt-4 mb-1">
          <button onClick={() => navigate(-1)} className="text-muted-foreground active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="px-1 mb-8">
          <h1 className="text-[26px] font-extrabold text-foreground tracking-tight leading-tight">
            Como funciona{"\n"}o Mounja
          </h1>
          <p className="text-sm text-muted-foreground mt-2 font-medium">
            Tudo que você precisa em poucos passos
          </p>
        </div>

        {/* Section Cards */}
        <div className="space-y-4 mb-8">
          {sections.map((section) => {
            const HintComponent = hintMap[section.hint];
            return (
              <div
                key={section.tab}
                className="rounded-3xl p-5 transition-all"
                style={{ background: section.bg }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center"
                      style={{ background: `hsl(${section.color} / 0.15)` }}
                    >
                      <section.icon className="w-[22px] h-[22px]" style={{ color: `hsl(${section.color})` }} />
                    </div>
                    <h2 className="text-[17px] font-bold text-foreground">{section.tab}</h2>
                  </div>
                  <div style={{ color: `hsl(${section.color})` }}>
                    <HintComponent />
                  </div>
                </div>

                {/* Bullet points */}
                <div className="space-y-2.5 pl-1">
                  {section.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `hsl(${section.color} / 0.1)` }}
                      >
                        <bullet.icon className="w-3.5 h-3.5" style={{ color: `hsl(${section.color})` }} />
                      </div>
                      <span className="text-[14px] font-semibold text-foreground/80">{bullet.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-1 mb-8">
          <button
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-2xl text-[15px] font-bold text-white active:scale-[0.97] transition-all flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(to right, #7B2FF7, #F857A6)",
              boxShadow: "0 6px 20px rgba(123, 47, 247, 0.2)",
            }}
          >
            Ir para hoje
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
