import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Share2, Gift, ChevronRight, Plus } from "lucide-react";

const groups = [
  { name: "Iniciantes Mounjaro", members: 48, emoji: "🌱", description: "Para quem está começando o tratamento" },
  { name: "Meta: -10kg", members: 72, emoji: "🎯", description: "Juntos rumo ao objetivo" },
  { name: "Treino + Mounjaro", members: 35, emoji: "💪", description: "Exercícios durante o tratamento" },
  { name: "Receitas Low Carb", members: 61, emoji: "🥗", description: "Receitas que funcionam" },
  { name: "Bem-estar mental", members: 29, emoji: "🧘", description: "Cuidando da mente também" },
];

const Community = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30">
        <div
          className="px-5 pb-10"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
            background:
              "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 40%, hsl(var(--primary) / 0.5) 70%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-[0.15em] text-center">Comunidade</h1>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-2 space-y-4">
        {/* Refer a friend - TOP */}
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: "Mounjá",
                text: "Estou usando o Mounjá para acompanhar meu tratamento com Mounjaro. Experimente também!",
                url: "https://mounja-app.lovable.app",
              });
            }
          }}
          className="w-full rounded-[20px] p-5 animate-fade-in-up flex items-center gap-4 text-left"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.04) 100%)",
            border: "1px solid hsl(var(--primary) / 0.15)",
          }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--primary) / 0.15)" }}>
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground/85">Convide um amigo</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Compartilhe o app e ganhe recompensas 🎁</p>
          </div>
          <Share2 className="w-4 h-4 text-primary/50 shrink-0" />
        </button>

        {/* Groups - WHOOP style */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.55)" }}>
                Seus grupos
              </h3>
            </div>
            <button className="flex items-center gap-1 text-primary text-[11px] font-semibold">
              <Plus className="w-3.5 h-3.5" />
              Criar
            </button>
          </div>

          <div className="space-y-2">
            {groups.map((group, i) => (
              <div
                key={group.name}
                className="rounded-[16px] p-4 animate-fade-in-up flex items-center gap-3"
                style={{
                  animationDelay: `${i * 50}ms`,
                  background: "hsl(var(--card))",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-xl" style={{ background: "hsl(var(--muted))" }}>
                  {group.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground/85">{group.name}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">{group.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 text-muted-foreground/40">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] font-medium">{group.members}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div
          className="rounded-[20px] p-5 text-center animate-fade-in-up"
          style={{
            animationDelay: "350ms",
            background: "hsl(var(--primary) / 0.06)",
            border: "1px dashed hsl(var(--primary) / 0.2)",
          }}
        >
          <MessageCircle className="w-8 h-8 text-primary/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground/70">Em breve</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Chat nos grupos, desafios e ranking entre amigos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Community;
