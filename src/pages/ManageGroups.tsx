import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus, Search, Globe } from "lucide-react";

const myGroups = [
  { name: "Iniciantes Mounjaro", members: 48, emoji: "🌱", description: "Para quem está começando o tratamento" },
  { name: "Meta: -10kg", members: 72, emoji: "🎯", description: "Juntos rumo ao objetivo" },
  { name: "Treino + Mounjaro", members: 35, emoji: "💪", description: "Exercícios durante o tratamento" },
  { name: "Receitas Low Carb", members: 61, emoji: "🥗", description: "Receitas que funcionam" },
  { name: "Bem-estar mental", members: 29, emoji: "🧘", description: "Cuidando da mente também" },
];

const discoverGroups = [
  { name: "Mounjaro 15mg+", members: 18, emoji: "💉", description: "Doses avançadas e experiências" },
  { name: "Mães com GLP-1", members: 42, emoji: "👩‍👧", description: "Conciliar maternidade e tratamento" },
  { name: "Viagem & Mounjaro", members: 15, emoji: "✈️", description: "Dicas para viajar com o medicamento" },
  { name: "Antes & Depois", members: 93, emoji: "📸", description: "Compartilhe sua evolução" },
];

const ManageGroups = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [joined, setJoined] = useState<string[]>(myGroups.map(g => g.name));
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("🌟");

  const toggleJoin = (name: string) => {
    setJoined(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const allGroups = [...myGroups, ...discoverGroups];
  const filtered = search
    ? allGroups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const emojiOptions = ["🌟", "🔥", "💊", "🏃", "🧠", "❤️", "🎉", "🌈"];

  return (
    <div className="min-h-screen pb-nav bg-background">
      {/* Header */}
      <div
        className="px-5 pb-8"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)",
          background: "linear-gradient(180deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 40%, hsl(var(--primary) / 0.5) 70%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => navigate("/comunidade")} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <h1 className="text-[11px] font-bold text-primary-foreground/80 uppercase tracking-[0.15em]">Gerenciar grupos</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar grupos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl text-[13px] font-medium text-white placeholder:text-white/40 outline-none"
            style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>
      </div>

      <div className="px-5 -mt-1 space-y-6">
        {/* Search results */}
        {filtered ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-3 h-3" style={{ color: "#9ab5a5" }} />
              <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>
                Resultados ({filtered.length})
              </h3>
            </div>
            <div className="space-y-3">
              {filtered.map((group, i) => {
                const isJoined = joined.includes(group.name);
                return (
                  <div
                    key={group.name}
                    className="rounded-[18px] p-4 flex items-center gap-3.5 animate-fade-in-up"
                    style={{ animationDelay: `${i * 50}ms`, background: "#F7FAF8", boxShadow: "0 2px 12px rgba(46,125,90,0.06)" }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: "#E9F5EE" }}>{group.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>{group.name}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#7a9e8a" }}>{group.description}</p>
                      <div className="flex items-center gap-1 mt-1" style={{ color: "#9ab5a5" }}>
                        <Users className="w-3 h-3" />
                        <span className="text-[10px] font-medium">{group.members} membros</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleJoin(group.name)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                      style={isJoined
                        ? { background: "#E9F5EE", color: "#2E7D5A", border: "1.5px solid #A8D5BA" }
                        : { background: "#FF8F5A", color: "white" }
                      }
                    >
                      {isJoined ? "Sair" : "Entrar"}
                    </button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="rounded-[20px] p-6 text-center" style={{ background: "#F7FAF8", border: "1px dashed #CDE7DA" }}>
                  <p className="text-[13px] font-semibold" style={{ color: "#2E7D5A" }}>Nenhum grupo encontrado</p>
                  <p className="text-[11px] mt-1" style={{ color: "#7a9e8a" }}>Que tal criar um novo?</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Create group card */}
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full rounded-[20px] p-5 flex items-center gap-4 text-left transition-transform active:scale-[0.98] animate-fade-in-up"
                style={{ background: "linear-gradient(145deg, #2E7D5A 0%, #3A9B6E 100%)", boxShadow: "0 8px 32px rgba(46,125,90,0.2)" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Criar novo grupo</p>
                  <p className="text-[11px] mt-0.5 text-white/60">Reúna pessoas com interesses em comum</p>
                </div>
              </button>
            ) : (
              <div
                className="rounded-[20px] p-5 animate-fade-in-up"
                style={{ background: "#F7FAF8", border: "1.5px solid #CDE7DA" }}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: "rgba(17,24,39,0.5)" }}>Criar grupo</p>

                {/* Emoji picker */}
                <div className="flex items-center gap-2 mb-4">
                  {emojiOptions.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewGroupEmoji(e)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all"
                      style={{
                        background: newGroupEmoji === e ? "#CDE7DA" : "#E9F5EE",
                        border: newGroupEmoji === e ? "2px solid #2E7D5A" : "2px solid transparent",
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Nome do grupo"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13px] font-medium mb-3 outline-none"
                  style={{ background: "#E9F5EE", color: "#1a3a2a", border: "1px solid #CDE7DA" }}
                />
                <input
                  type="text"
                  placeholder="Descrição curta"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-[13px] font-medium mb-4 outline-none"
                  style={{ background: "#E9F5EE", color: "#1a3a2a", border: "1px solid #CDE7DA" }}
                />

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-95"
                    style={{ background: "#E9F5EE", color: "#7a9e8a" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setNewGroupName(""); setNewGroupDesc(""); }}
                    className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-95"
                    style={{ background: "#2E7D5A", color: "white", boxShadow: "0 4px 16px rgba(46,125,90,0.3)" }}
                  >
                    Criar grupo
                  </button>
                </div>
              </div>
            )}

            {/* My groups */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: "#2E7D5A" }} />
                <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>Meus grupos</h3>
              </div>
              <div className="space-y-3">
                {myGroups.map((group, i) => {
                  const isJoined = joined.includes(group.name);
                  return (
                    <div
                      key={group.name}
                      className="rounded-[18px] p-4 flex items-center gap-3.5 animate-fade-in-up"
                      style={{
                        animationDelay: `${i * 50}ms`,
                        background: isJoined ? "#F7FAF8" : "#FAFAFA",
                        boxShadow: "0 2px 12px rgba(46,125,90,0.06)",
                        opacity: isJoined ? 1 : 0.6,
                      }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: "#E9F5EE" }}>{group.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>{group.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7a9e8a" }}>{group.description}</p>
                        <div className="flex items-center gap-1 mt-1" style={{ color: "#9ab5a5" }}>
                          <Users className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{group.members}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleJoin(group.name)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                        style={isJoined
                          ? { background: "#E9F5EE", color: "#2E7D5A", border: "1.5px solid #A8D5BA" }
                          : { background: "#FF8F5A", color: "white" }
                        }
                      >
                        {isJoined ? "Sair" : "Entrar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discover groups */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-3 h-3" style={{ color: "#FF8F5A" }} />
                <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>Descobrir</h3>
              </div>
              <div className="space-y-3">
                {discoverGroups.map((group, i) => {
                  const isJoined = joined.includes(group.name);
                  return (
                    <div
                      key={group.name}
                      className="rounded-[18px] p-4 flex items-center gap-3.5 animate-fade-in-up"
                      style={{ animationDelay: `${i * 50}ms`, background: "#F7FAF8", boxShadow: "0 2px 12px rgba(46,125,90,0.06)" }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: "#E9F5EE" }}>{group.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>{group.name}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#7a9e8a" }}>{group.description}</p>
                        <div className="flex items-center gap-1 mt-1" style={{ color: "#9ab5a5" }}>
                          <Users className="w-3 h-3" />
                          <span className="text-[10px] font-medium">{group.members} membros</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleJoin(group.name)}
                        className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                        style={isJoined
                          ? { background: "#E9F5EE", color: "#2E7D5A", border: "1.5px solid #A8D5BA" }
                          : { background: "#FF8F5A", color: "white" }
                        }
                      >
                        {isJoined ? "Sair" : "Entrar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageGroups;
