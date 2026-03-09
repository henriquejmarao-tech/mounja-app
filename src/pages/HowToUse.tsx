import { ArrowLeft, House, Apple, TrendingUp, Scale, Camera, ClipboardList, Droplets, Utensils, LineChart, Syringe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    tab: "Hoje",
    icon: House,
    color: "11 55% 66%",
    features: [
      { icon: Scale, text: "Registre seu peso diário com poucos toques" },
      { icon: ClipboardList, text: "Faça o check-in de sintomas e como você está se sentindo" },
      { icon: Camera, text: "Tire fotos de progresso para acompanhar sua transformação" },
      { icon: Syringe, text: "Veja quando é sua próxima aplicação e registre novas doses" },
    ],
  },
  {
    tab: "Refeições",
    icon: Apple,
    color: "38 85% 55%",
    features: [
      { icon: Utensils, text: "Registre suas refeições com foto ou descrição" },
      { icon: Droplets, text: "Acompanhe sua hidratação ao longo do dia" },
      { icon: LineChart, text: "Veja suas metas de calorias, proteína e fibra" },
    ],
  },
  {
    tab: "Progresso",
    icon: TrendingUp,
    color: "160 45% 45%",
    features: [
      { icon: LineChart, text: "Visualize a evolução do seu peso em um gráfico claro" },
      { icon: Camera, text: "Compare fotos de antes e depois lado a lado" },
      { icon: Syringe, text: "Veja o histórico completo de suas aplicações" },
    ],
  },
];

const HowToUse = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="px-6 pt-safe pb-2">
        <div className="flex items-center gap-3 mt-4 mb-6">
          <button onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-extrabold text-foreground">Como usar</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          O Mounja foi feito para simplificar o acompanhamento do seu tratamento. Aqui está o que cada aba faz por você:
        </p>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.tab} className="bg-card rounded-2xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `hsl(${section.color} / 0.12)` }}
                >
                  <section.icon className="w-5 h-5" style={{ color: `hsl(${section.color})` }} />
                </div>
                <h2 className="text-lg font-bold text-foreground">{section.tab}</h2>
              </div>

              <div className="space-y-3">
                {section.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <feature.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground leading-snug">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
