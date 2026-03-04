import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageCircle, Heart, Star, TrendingUp, Award } from "lucide-react";

const communityTopics = [
  {
    icon: TrendingUp,
    title: "Primeiros passos",
    description: "Dicas de quem está começando o tratamento",
    members: 234,
    color: "hsl(var(--primary))",
  },
  {
    icon: Heart,
    title: "Efeitos colaterais",
    description: "Compartilhe e aprenda a lidar com os sintomas",
    members: 189,
    color: "hsl(25 80% 52%)",
  },
  {
    icon: Star,
    title: "Conquistas",
    description: "Celebre seus marcos e inspire outros",
    members: 312,
    color: "hsl(45 93% 47%)",
  },
  {
    icon: Award,
    title: "Receitas saudáveis",
    description: "Troque receitas que funcionam no tratamento",
    members: 156,
    color: "hsl(174 42% 48%)",
  },
];

const Community = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F6F8F7" }}>
      {/* Header */}
      <header className="sticky top-0 z-30">
        <div
          className="px-5 pb-6"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
            background:
              "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 30%, hsl(var(--primary) / 0.20) 60%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-center">
            <h1 className="text-base font-bold text-primary-foreground">Comunidade</h1>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-2 space-y-4">
        {/* Welcome card */}
        <div
          className="rounded-[20px] p-5 animate-fade-in-up"
          style={{ background: "#FFFFFF", boxShadow: "0 8px 24px rgba(17,24,39,0.08)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground/85">Bem-vindo à comunidade</h2>
              <p className="text-xs text-muted-foreground">Conecte-se com pessoas na mesma jornada</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            Em breve você poderá compartilhar experiências, trocar dicas e encontrar apoio de quem entende o que você está vivendo. 🌿
          </p>
        </div>

        {/* Topics */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>
              Tópicos populares
            </h3>
          </div>

          <div className="space-y-2.5">
            {communityTopics.map((topic, i) => (
              <div
                key={topic.title}
                className="rounded-[16px] p-4 animate-fade-in-up"
                style={{
                  animationDelay: `${i * 60}ms`,
                  background: "#FFFFFF",
                  boxShadow: "0 4px 12px rgba(17,24,39,0.06)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                    style={{ background: `${topic.color}10` }}
                  >
                    <topic.icon className="w-[18px] h-[18px]" style={{ color: topic.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground/85">{topic.title}</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{topic.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground/40">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{topic.members}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div
          className="rounded-[20px] p-5 text-center animate-fade-in-up"
          style={{
            animationDelay: "300ms",
            background: "hsl(var(--primary) / 0.06)",
            border: "1px dashed hsl(var(--primary) / 0.2)",
          }}
        >
          <MessageCircle className="w-8 h-8 text-primary/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground/70">Em breve</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Fórum de discussão, grupos e mensagens diretas
          </p>
        </div>
      </div>
    </div>
  );
};

export default Community;
