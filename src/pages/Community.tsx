import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Share2, Gift, ChevronRight, Plus } from "lucide-react";

const groups = [
  { name: "Iniciantes Mounjaro", members: 48, emoji: "🌱", description: "Para quem está começando o tratamento", activity: "5 novos posts" },
  { name: "Meta: -10kg", members: 72, emoji: "🎯", description: "Juntos rumo ao objetivo", activity: "ativo agora" },
  { name: "Treino + Mounjaro", members: 35, emoji: "💪", description: "Exercícios durante o tratamento", activity: "3 novos posts" },
  { name: "Receitas Low Carb", members: 61, emoji: "🥗", description: "Receitas que funcionam", activity: "ativo agora" },
  { name: "Bem-estar mental", members: 29, emoji: "🧘", description: "Cuidando da mente também", activity: "2 novos posts" },
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
            background: "linear-gradient(180deg, #2E7D5A 0%, #2E7D5A 40%, #A8D5BA 80%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-[0.15em] text-center">Comunidade</h1>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-2 space-y-5">
        {/* Invite friend card */}
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
          className="w-full rounded-[20px] p-5 animate-fade-in-up flex items-center gap-4 text-left transition-transform active:scale-[0.98]"
          style={{
            background: "#E9F5EE",
            border: "1.5px solid #CDE7DA",
          }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "#2E7D5A" }}
          >
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "#1a3a2a" }}>Convide um amigo</p>
            <p className="text-xs mt-0.5" style={{ color: "#5a8a6e" }}>
              Compartilhe o app e ganhe recompensas 🎁
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#FF8F5A" }}
          >
            <Share2 className="w-3.5 h-3.5 text-white" />
          </div>
        </button>

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#2E7D5A" }} />
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>
                Seus grupos
              </h3>
            </div>
            <button
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={{ color: "#FF8F5A", background: "rgba(255,143,90,0.1)" }}
            >
              <Plus className="w-3 h-3" />
              Criar
            </button>
          </div>

          <div className="space-y-3">
            {groups.map((group, i) => (
              <div
                key={group.name}
                className="rounded-[18px] p-4 animate-fade-in-up flex items-center gap-3.5 transition-transform active:scale-[0.98]"
                style={{
                  animationDelay: `${i * 50}ms`,
                  background: "#F7FAF8",
                  boxShadow: "0 2px 12px rgba(46,125,90,0.06)",
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl"
                  style={{ background: "#E9F5EE" }}
                >
                  {group.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>{group.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#7a9e8a" }}>{group.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1" style={{ color: "#9ab5a5" }}>
                      <Users className="w-3 h-3" />
                      <span className="text-[10px] font-medium">{group.members}</span>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: "#FF8F5A", background: "rgba(255,143,90,0.1)" }}>
                      {group.activity}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#c5d8cc" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div
          className="rounded-[20px] p-5 text-center animate-fade-in-up"
          style={{
            animationDelay: "350ms",
            background: "#F7FAF8",
            border: "1px dashed #CDE7DA",
          }}
        >
          <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#A8D5BA" }} />
          <p className="text-sm font-semibold" style={{ color: "#2E7D5A" }}>Em breve</p>
          <p className="text-xs mt-1" style={{ color: "#7a9e8a" }}>
            Chat nos grupos, desafios e ranking entre amigos
          </p>
        </div>
      </div>
    </div>
  );
};

export default Community;
