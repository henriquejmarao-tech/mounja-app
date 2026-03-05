import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Share2, Gift, Plus, X, Sparkles, EyeOff, Info, Loader2 } from "lucide-react";
import { useCommunityGroups, useCommunityQuestions, useCommunityAI } from "@/hooks/useCommunity";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const Community = () => {
  const navigate = useNavigate();
  const [showTinder, setShowTinder] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedGroupForQuestion, setSelectedGroupForQuestion] = useState<string>("");

  const { groups, myGroupIds, hiddenGroupIds, loading: groupsLoading, toggleGroupHidden } = useCommunityGroups();

  // Visible group IDs = joined and not hidden
  const visibleGroupIds = useMemo(() =>
    myGroupIds.filter(id => !hiddenGroupIds.includes(id)),
    [myGroupIds, hiddenGroupIds]
  );

  const { questions, loading: questionsLoading, vote, createQuestion } = useCommunityQuestions(visibleGroupIds);
  const { aiAnswer, aiLoading, getAIAnswer, resetAI } = useCommunityAI();

  const openTinder = () => {
    if (questions.length === 0) return;
    setCurrentQ(0);
    setShowSolution(false);
    resetAI();
    setShowTinder(true);
    document.body.setAttribute("data-hide-nav", "true");
  };

  const closeTinder = () => {
    setShowTinder(false);
    setCurrentQ(0);
    setShowSolution(false);
    resetAI();
    document.body.removeAttribute("data-hide-nav");
  };

  const q = questions[currentQ] || null;

  const handleVote = async (type: "also_feel" | "dont_feel") => {
    if (!q) return;
    await vote(q.id, type);
  };

  const handleNext = () => {
    setShowSolution(false);
    resetAI();
    setCurrentQ((prev) => (prev + 1) % questions.length);
  };

  const handleShowSolution = () => {
    if (!q) return;
    setShowSolution(true);
    getAIAnswer(q.question);
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.trim() || !selectedGroupForQuestion) return;
    await createQuestion(newQuestion.trim(), selectedGroupForQuestion);
    setNewQuestion("");
    setSelectedGroupForQuestion("");
    setShowAskForm(false);
  };

  const timeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return "";
    }
  };

  // Get the latest question for preview card
  const previewQuestion = questions[0];

  // My groups (joined ones)
  const myGroups = groups.filter(g => myGroupIds.includes(g.id));

  // ---- Tinder fullscreen ----
  if (showTinder && q) {
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
          {questions.slice(0, 10).map((_, i) => (
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
                  {(q.author_name || "A").charAt(0)}
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-white/80">{q.author_name || "Anônimo"}</p>
                  <p className="text-[10px] text-white/30">{timeAgo(q.created_at)}</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(168,213,186,0.15)" }}>
                    <span className="text-[10px] font-bold" style={{ color: "#A8D5BA" }}>😔 {q.also_feel_count}</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(255,143,90,0.15)" }}>
                    <span className="text-[10px] font-bold" style={{ color: "#FF8F5A" }}>🙂 {q.dont_feel_count}</span>
                  </div>
                </div>
              </div>

              {/* Group badge + Question */}
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: "rgba(168,213,186,0.15)", color: "#A8D5BA" }}>
                  {q.group_emoji} {q.group_name}
                </span>
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
                  {aiLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#A8D5BA" }} />
                      <p className="text-[13px] text-white/50">Gerando resposta...</p>
                    </div>
                  ) : (
                    <p className="text-[15px] text-white/80 leading-[1.7]">
                      {aiAnswer || "Erro ao gerar resposta."}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              {!q.user_vote ? (
                <div className="flex flex-col gap-2.5 mt-auto">
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => handleVote("also_feel")} className="flex-1 py-5 rounded-2xl text-[15px] font-bold transition-transform active:scale-95" style={{ background: "rgba(168,213,186,0.2)", color: "#A8D5BA", border: "1px solid rgba(168,213,186,0.15)" }}>
                      😔 Também sinto
                    </button>
                    <button onClick={() => handleVote("dont_feel")} className="flex-1 py-5 rounded-2xl text-[15px] font-bold transition-transform active:scale-95" style={{ background: "rgba(255,143,90,0.2)", color: "#FF8F5A", border: "1px solid rgba(255,143,90,0.15)" }}>
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
                    <button onClick={handleShowSolution} className="flex-1 py-3.5 rounded-2xl text-[13px] font-bold transition-transform active:scale-95 flex items-center justify-center gap-2" style={{ background: "rgba(168,213,186,0.12)", color: "#A8D5BA", border: "1px solid rgba(168,213,186,0.2)" }}>
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
            <h2 className="text-lg font-bold text-white leading-tight mb-5">Acompanhe as tendências</h2>

            <div className="rounded-[16px] p-4 mb-4" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <p className="text-[11px] text-white/50 mb-1.5">Dúvida da comunidade</p>
              {questionsLoading ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="w-3 h-3 animate-spin text-white/40" />
                  <p className="text-[13px] text-white/40">Carregando...</p>
                </div>
              ) : previewQuestion ? (
                <p className="text-[14px] font-semibold text-white leading-snug">"{previewQuestion.question}"</p>
              ) : (
                <p className="text-[13px] text-white/40">Nenhuma dúvida ainda. Seja o primeiro a perguntar!</p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAskForm(true)}
                className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
                style={{ background: "rgba(255,255,255,0.15)", color: "white" }}
              >
                <Plus className="w-4 h-4" />
                Fazer pergunta
              </button>
              <button
                onClick={openTinder}
                disabled={questions.length === 0}
                className="flex-[1.4] py-3.5 rounded-2xl text-[13px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#FF8F5A", color: "white", boxShadow: "0 4px 16px rgba(255,143,90,0.35)" }}
              >
                🔥 Explorar dúvidas
              </button>
            </div>
          </div>
        </div>

        {/* Ask question form */}
        {showAskForm && (
          <div
            className="rounded-[20px] p-5 animate-fade-in-up"
            style={{ background: "#F7FAF8", border: "1.5px solid #CDE7DA" }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(17,24,39,0.5)" }}>Nova pergunta</p>

            <textarea
              placeholder="Escreva sua dúvida..."
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-[13px] font-medium mb-3 outline-none resize-none"
              style={{ background: "#E9F5EE", color: "#1a3a2a", border: "1px solid #CDE7DA" }}
            />

            <p className="text-[10px] font-semibold mb-2" style={{ color: "#7a9e8a" }}>Grupo:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {myGroups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroupForQuestion(g.id)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: selectedGroupForQuestion === g.id ? "#2E7D5A" : "#E9F5EE",
                    color: selectedGroupForQuestion === g.id ? "white" : "#2E7D5A",
                    border: selectedGroupForQuestion === g.id ? "1.5px solid #2E7D5A" : "1.5px solid #CDE7DA",
                  }}
                >
                  {g.emoji} {g.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowAskForm(false); setNewQuestion(""); setSelectedGroupForQuestion(""); }}
                className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-95"
                style={{ background: "#E9F5EE", color: "#7a9e8a" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateQuestion}
                disabled={!newQuestion.trim() || !selectedGroupForQuestion}
                className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-95 disabled:opacity-40"
                style={{ background: "#2E7D5A", color: "white", boxShadow: "0 4px 16px rgba(46,125,90,0.3)" }}
              >
                Publicar
              </button>
            </div>
          </div>
        )}

        {/* Groups */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: "#2E7D5A" }} />
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>Filtrar tendências</h3>
              <button onClick={() => setShowInfo(!showInfo)} className="ml-0.5 opacity-30 hover:opacity-50 transition-opacity">
                <Info className="w-3.5 h-3.5" style={{ color: "#1a3a2a" }} />
              </button>
            </div>
            <button onClick={() => navigate("/comunidade/grupos")} className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "#FF8F5A", background: "rgba(255,143,90,0.1)" }}>
              <Plus className="w-3 h-3" />
              Adicionar
            </button>
          </div>

          {showInfo && (
            <p className="text-[11px] mb-3 px-1 animate-fade-in" style={{ color: "#7a9e8a" }}>
              Selecione os grupos cujas dúvidas você quer ver em "Acompanhe as tendências".
            </p>
          )}

          {groupsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#2E7D5A" }} />
            </div>
          ) : (
            <div className="space-y-3">
              {myGroups.map((group, i) => {
                const isVisible = !hiddenGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroupHidden(group.id)}
                    className="w-full rounded-[18px] p-4 animate-fade-in-up flex items-center gap-3.5 transition-all active:scale-[0.98] text-left"
                    style={{
                      animationDelay: `${i * 50}ms`,
                      background: isVisible ? "#E9F5EE" : "#F7FAF8",
                      boxShadow: isVisible ? "0 2px 12px rgba(46,125,90,0.12)" : "0 2px 12px rgba(46,125,90,0.06)",
                      border: isVisible ? "1.5px solid #A8D5BA" : "1.5px solid transparent",
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: isVisible ? "#CDE7DA" : "#E9F5EE" }}>{group.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>{group.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#7a9e8a" }}>{group.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex items-center gap-1" style={{ color: "#9ab5a5" }}>
                          <Users className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{group.member_count || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isVisible ? (
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "#2E7D5A" }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "rgba(200,200,200,0.2)" }}>
                          <EyeOff className="w-3 h-3" style={{ color: "#b0b0b0" }} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {myGroups.length === 0 && !groupsLoading && (
                <div className="rounded-[20px] p-6 text-center" style={{ background: "#F7FAF8", border: "1px dashed #CDE7DA" }}>
                  <p className="text-[13px] font-semibold" style={{ color: "#2E7D5A" }}>Você ainda não participa de nenhum grupo</p>
                  <p className="text-[11px] mt-1" style={{ color: "#7a9e8a" }}>Toque em "Adicionar" para explorar grupos</p>
                </div>
              )}
            </div>
          )}
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
      </div>
    </div>
  );
};

export default Community;
