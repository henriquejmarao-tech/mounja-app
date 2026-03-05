import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, MessageCircle, Share2, Gift, ChevronRight, Plus, X, Sparkles, ChevronDown } from "lucide-react";

const groups = [
  { name: "Iniciantes Mounjaro", members: 48, emoji: "🌱", description: "Para quem está começando o tratamento", activity: "5 novos posts" },
  { name: "Meta: -10kg", members: 72, emoji: "🎯", description: "Juntos rumo ao objetivo", activity: "ativo agora" },
  { name: "Treino + Mounjaro", members: 35, emoji: "💪", description: "Exercícios durante o tratamento", activity: "3 novos posts" },
  { name: "Receitas Low Carb", members: 61, emoji: "🥗", description: "Receitas que funcionam", activity: "ativo agora" },
  { name: "Bem-estar mental", members: 29, emoji: "🧘", description: "Cuidando da mente também", activity: "2 novos posts" },
];

const sampleQuestions = [
  { id: 1, question: "Vocês também sentem mais enjoo na primeira semana após aumentar a dose?", author: "Ana M.", votes: 34, time: "2h atrás" },
  { id: 2, question: "Alguém mais percebeu queda de cabelo depois do 3º mês?", author: "Carlos R.", votes: 21, time: "5h atrás" },
  { id: 3, question: "É normal sentir muita sede nos primeiros dias?", author: "Julia S.", votes: 47, time: "1h atrás" },
];

const Community = () => {
  const navigate = useNavigate();
  const [showTinder, setShowTinder] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [answered, setAnswered] = useState(false);

  const openTinder = () => {
    setShowTinder(true);
    document.body.setAttribute("data-hide-nav", "true");
  };

  const closeTinder = () => {
    setShowTinder(false);
    setCurrentQ(0);
    setAnswered(false);
    setShowSolution(false);
    document.body.removeAttribute("data-hide-nav");
  };

  const q = sampleQuestions[currentQ];

  const handleAnswer = () => setAnswered(true);

  const handleNext = () => {
    setAnswered(false);
    setShowSolution(false);
    setCurrentQ((prev) => (prev + 1) % sampleQuestions.length);
  };

  // ---- Tinder fullscreen ----
  if (showTinder) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col"
        style={{ background: "linear-gradient(180deg, #1a3a2a 0%, #223d30 50%, #1a3a2a 100%)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)", paddingBottom: "0.75rem" }}
        >
          <button onClick={closeTinder}>
            <X className="w-5 h-5 text-white/60" />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">Dúvidas GLP-1</p>
          <div className="w-5" />
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 px-5 mb-4">
          {sampleQuestions.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all duration-300"
              style={{ width: i === currentQ ? 24 : 8, background: i === currentQ ? "#FF8F5A" : "rgba(255,255,255,0.15)" }}
            />
          ))}
        </div>

        {/* Card */}
        <div className="flex-1 px-5 flex flex-col min-h-0">
          <div
            className="flex-1 rounded-[24px] p-6 flex flex-col relative overflow-hidden"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.04]" style={{ background: "#FF8F5A" }} />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 rounded-full opacity-[0.04]" style={{ background: "#A8D5BA" }} />

            <div className="relative z-10 flex-1 flex flex-col">
              {/* Author */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: "rgba(168,213,186,0.2)", color: "#A8D5BA" }}>
                  {q.author.charAt(0)}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/80">{q.author}</p>
                  <p className="text-[10px] text-white/30">{q.time}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(168,213,186,0.15)" }}>
                    <span className="text-[10px] font-bold" style={{ color: "#A8D5BA" }}>😔 {Math.round(q.votes * 0.6)}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(255,143,90,0.15)" }}>
                    <span className="text-[10px] font-bold" style={{ color: "#FF8F5A" }}>🙂 {Math.round(q.votes * 0.4)}</span>
                  </div>
                </div>
              </div>

              {/* Question */}
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[20px] font-bold text-white leading-relaxed text-center px-2">"{q.question}"</p>
              </div>

              {/* Solution panel */}
              {showSolution && (
                <div
                  className="rounded-[20px] p-5 mb-4 animate-fade-in-up"
                  style={{ background: "rgba(168,213,186,0.12)", border: "1px solid rgba(168,213,186,0.15)" }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "rgba(168,213,186,0.2)" }}>
                      <Sparkles className="w-4 h-4" style={{ color: "#A8D5BA" }} />
                    </div>
                    <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: "#A8D5BA" }}>Resposta IA</p>
                  </div>
                  <p className="text-[15px] text-white/80 leading-[1.7]">
                    É comum sentir enjoo ao aumentar a dose de GLP-1. Isso ocorre porque o corpo precisa se adaptar ao novo nível do medicamento. Geralmente melhora em 3-5 dias. Comer porções menores e evitar alimentos gordurosos pode ajudar.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              {!answered ? (
                <div className="flex flex-col gap-2.5 mt-auto">
                  <div className="flex items-center gap-2.5">
                    <button onClick={handleAnswer} className="flex-1 py-5 rounded-2xl text-[15px] font-bold transition-transform active:scale-95" style={{ background: "rgba(168,213,186,0.2)", color: "#A8D5BA", border: "1px solid rgba(168,213,186,0.15)" }}>
                      😔 Também sinto
                    </button>
                    <button onClick={handleAnswer} className="flex-1 py-5 rounded-2xl text-[15px] font-bold transition-transform active:scale-95" style={{ background: "rgba(255,143,90,0.2)", color: "#FF8F5A", border: "1px solid rgba(255,143,90,0.15)" }}>
                      🙂 Não sinto
                    </button>
                  </div>
                  <button onClick={handleNext} className="w-full py-2.5 rounded-xl text-[12px] font-medium transition-transform active:scale-95" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)" }}>
                    Próximo post →
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-auto animate-fade-in-up">
                  {!showSolution && (
                    <button onClick={() => setShowSolution(true)} className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold transition-transform active:scale-95 flex items-center justify-center gap-2" style={{ background: "rgba(168,213,186,0.12)", color: "#A8D5BA", border: "1px solid rgba(168,213,186,0.2)" }}>
                      <Sparkles className="w-4 h-4" />
                      Ver solução IA
                    </button>
                  )}
                  <button onClick={handleNext} className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold transition-transform active:scale-95" style={{ background: "#FF8F5A", color: "white", boxShadow: "0 4px 16px rgba(255,143,90,0.35)" }}>
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0" style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }} />
      </div>
    );
  }

  // ---- Main community page ----
  return (
    <div className="min-h-screen pb-nav bg-background">
      <header className="sticky top-0 z-30">
        <div
          className="px-5 pb-10"
          style={{
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)",
            background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 40%, hsl(var(--primary) / 0.5) 70%, transparent 100%)",
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-[0.15em] text-center">Comunidade</h1>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-2 space-y-5">
        {/* Trends / Tinder card */}
        <div
          className="rounded-[22px] p-5 animate-fade-in-up overflow-hidden relative"
          style={{ background: "linear-gradient(145deg, #2E7D5A 0%, #3A9B6E 50%, #2E7D5A 100%)", boxShadow: "0 8px 32px rgba(46,125,90,0.25)" }}
        >
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10" style={{ background: "#A8D5BA" }} />
          <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-10" style={{ background: "#FF8F5A" }} />

          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-1">Descubra</p>
            <h2 className="text-lg font-bold text-white leading-tight mb-1">Acompanhe as tendências</h2>
            <p className="text-[12px] text-white/60 mb-5">Veja o que a comunidade GLP-1 está sentindo e compartilhe sua experiência</p>

            <div className="rounded-[16px] p-4 mb-4" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <p className="text-[11px] text-white/50 mb-1.5">Dúvida da comunidade</p>
              <p className="text-[14px] font-semibold text-white leading-snug">"Vocês também sentem mais enjoo na primeira semana após aumentar a dose?"</p>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-2" style={{ background: "rgba(255,255,255,0.15)", color: "white" }}>
                <Plus className="w-4 h-4" />
                Fazer pergunta
              </button>
              <button
                onClick={openTinder}
                className="flex-[1.4] py-3.5 rounded-2xl text-[13px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
                style={{ background: "#FF8F5A", color: "white", boxShadow: "0 4px 16px rgba(255,143,90,0.35)" }}
              >
                🔥 Explorar dúvidas
              </button>
            </div>
          </div>
        </div>

        {/* Invite friend card */}
        <button
          onClick={() => { if (navigator.share) navigator.share({ title: "Mounjá", text: "Estou usando o Mounjá para acompanhar meu tratamento com Mounjaro. Experimente também!", url: "https://mounja-app.lovable.app" }); }}
          className="w-full rounded-[20px] p-5 animate-fade-in-up flex items-center gap-4 text-left transition-transform active:scale-[0.98]"
          style={{ background: "#E9F5EE", border: "1.5px solid #CDE7DA" }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "#2E7D5A" }}>
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: "#1a3a2a" }}>Convide um amigo</p>
            <p className="text-xs mt-0.5" style={{ color: "#5a8a6e" }}>Compartilhe o app e ganhe recompensas 🎁</p>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FF8F5A" }}>
            <Share2 className="w-3.5 h-3.5 text-white" />
          </div>
        </button>

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#2E7D5A" }} />
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>Seus grupos</h3>
            </div>
            <button className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "#FF8F5A", background: "rgba(255,143,90,0.1)" }}>
              <Plus className="w-3 h-3" />
              Criar
            </button>
          </div>

          <div className="space-y-3">
            {groups.map((group, i) => (
              <div key={group.name} className="rounded-[18px] p-4 animate-fade-in-up flex items-center gap-3.5 transition-transform active:scale-[0.98]" style={{ animationDelay: `${i * 50}ms`, background: "#F7FAF8", boxShadow: "0 2px 12px rgba(46,125,90,0.06)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: "#E9F5EE" }}>{group.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>{group.name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "#7a9e8a" }}>{group.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1" style={{ color: "#9ab5a5" }}>
                      <Users className="w-3 h-3" />
                      <span className="text-[10px] font-medium">{group.members}</span>
                    </div>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: "#FF8F5A", background: "rgba(255,143,90,0.1)" }}>{group.activity}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#c5d8cc" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div className="rounded-[20px] p-5 text-center animate-fade-in-up" style={{ animationDelay: "350ms", background: "#F7FAF8", border: "1px dashed #CDE7DA" }}>
          <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "#A8D5BA" }} />
          <p className="text-sm font-semibold" style={{ color: "#2E7D5A" }}>Em breve</p>
          <p className="text-xs mt-1" style={{ color: "#7a9e8a" }}>Chat nos grupos, desafios e ranking entre amigos</p>
        </div>
      </div>
    </div>
  );
};

export default Community;