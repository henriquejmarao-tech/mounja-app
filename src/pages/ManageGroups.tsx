import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus, Search, Globe, Loader2, Lock, Copy, KeyRound } from "lucide-react";
import { useCommunityGroups } from "@/hooks/useCommunity";
import { toast } from "sonner";

const ManageGroups = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("🌟");
  const [creating, setCreating] = useState(false);
  const [showJoinByCode, setShowJoinByCode] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joiningByCode, setJoiningByCode] = useState(false);

  const { groups, myGroupIds, loading, joinGroup, leaveGroup, createGroup, joinByCode } = useCommunityGroups();

  const myGroups = groups.filter(g => myGroupIds.includes(g.id));
  const discoverGroups = groups.filter(g => !myGroupIds.includes(g.id));

  const allGroups = groups;
  const filtered = search
    ? allGroups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  const emojiOptions = ["🌟", "🔥", "💊", "🏃", "🧠", "❤️", "🎉", "🌈"];

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    const result = await createGroup(newGroupName.trim(), newGroupEmoji, newGroupDesc.trim());
    setShowCreate(false);
    setNewGroupName("");
    setNewGroupDesc("");
    setCreating(false);
    if (result?.invite_code) {
      toast.success(`Grupo criado! Código: ${result.invite_code}`);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCodeInput.trim()) return;
    setJoiningByCode(true);
    const ok = await joinByCode(inviteCodeInput.trim());
    setJoiningByCode(false);
    if (ok) {
      setInviteCodeInput("");
      setShowJoinByCode(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const GroupCard = ({ group, isJoined }: { group: typeof groups[0]; isJoined: boolean }) => (
    <div
      className="rounded-[18px] p-4 flex items-center gap-3.5 animate-fade-in-up"
      style={{
        background: isJoined ? "#F7FAF8" : "#FAFAFA",
        boxShadow: "0 2px 12px rgba(46,125,90,0.06)",
        opacity: isJoined ? 1 : 0.9,
      }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-2xl" style={{ background: "#E9F5EE" }}>{group.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>{group.name}</p>
          {group.is_private && <Lock className="w-3 h-3 shrink-0" style={{ color: "#9ab5a5" }} />}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7a9e8a" }}>{group.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-1" style={{ color: "#9ab5a5" }}>
            <Users className="w-3 h-3" />
            <span className="text-[10px] font-medium">{group.member_count || 0} membros</span>
          </div>
          {/* Show invite code for private groups the user is in */}
          {group.is_private && isJoined && group.invite_code && (
            <button
              onClick={(e) => { e.stopPropagation(); copyCode(group.invite_code!); }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-all active:scale-95"
              style={{ background: "rgba(46,125,90,0.1)" }}
            >
              <span className="text-[9px] font-mono font-bold" style={{ color: "#2E7D5A" }}>{group.invite_code}</span>
              <Copy className="w-2.5 h-2.5" style={{ color: "#2E7D5A" }} />
            </button>
          )}
        </div>
      </div>
      {!group.is_private || isJoined ? (
        <button
          onClick={() => isJoined ? leaveGroup(group.id) : joinGroup(group.id)}
          className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95"
          style={isJoined
            ? { background: "#E9F5EE", color: "#2E7D5A", border: "1.5px solid #A8D5BA" }
            : { background: "#FF8F5A", color: "white" }
          }
        >
          {isJoined ? "Sair" : "Entrar"}
        </button>
      ) : null}
    </div>
  );

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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#2E7D5A" }} />
        </div>
      ) : (
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
                {filtered.map(group => (
                  <GroupCard key={group.id} group={group} isJoined={myGroupIds.includes(group.id)} />
                ))}
                {filtered.length === 0 && (
                  <div className="rounded-[20px] p-6 text-center" style={{ background: "#F7FAF8", border: "1px dashed #CDE7DA" }}>
                    <p className="text-[13px] font-semibold" style={{ color: "#2E7D5A" }}>Nenhum grupo encontrado</p>
                    <p className="text-[11px] mt-1" style={{ color: "#7a9e8a" }}>Que tal criar um ou entrar com código?</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Join by code card */}
              {!showJoinByCode ? (
                <button
                  onClick={() => setShowJoinByCode(true)}
                  className="w-full rounded-[20px] p-4 flex items-center gap-3.5 text-left transition-transform active:scale-[0.98] animate-fade-in-up"
                  style={{ background: "#F7FAF8", border: "1.5px solid #CDE7DA" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#E9F5EE" }}>
                    <KeyRound className="w-4 h-4" style={{ color: "#2E7D5A" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold" style={{ color: "#1a3a2a" }}>Entrar com código</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#7a9e8a" }}>Use o código de convite de um grupo privado</p>
                  </div>
                </button>
              ) : (
                <div
                  className="rounded-[20px] p-5 animate-fade-in-up"
                  style={{ background: "#F7FAF8", border: "1.5px solid #CDE7DA" }}
                >
                  <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "rgba(17,24,39,0.5)" }}>Código de convite</p>
                  <input
                    type="text"
                    placeholder="Ex: A3F2B1"
                    value={inviteCodeInput}
                    onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-xl text-[15px] font-mono font-bold text-center mb-3 outline-none uppercase tracking-[0.3em]"
                    style={{ background: "#E9F5EE", color: "#1a3a2a", border: "1px solid #CDE7DA" }}
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setShowJoinByCode(false); setInviteCodeInput(""); }}
                      className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-95"
                      style={{ background: "#E9F5EE", color: "#7a9e8a" }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleJoinByCode}
                      disabled={inviteCodeInput.length < 4 || joiningByCode}
                      className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: "#2E7D5A", color: "white", boxShadow: "0 4px 16px rgba(46,125,90,0.3)" }}
                    >
                      {joiningByCode && <Loader2 className="w-3 h-3 animate-spin" />}
                      Entrar
                    </button>
                  </div>
                </div>
              )}

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
                    <p className="text-[11px] mt-0.5 text-white/60">Privado — compartilhe o código de convite</p>
                  </div>
                  <Lock className="w-4 h-4 text-white/40 shrink-0" />
                </button>
              ) : (
                <div
                  className="rounded-[20px] p-5 animate-fade-in-up"
                  style={{ background: "#F7FAF8", border: "1.5px solid #CDE7DA" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>Criar grupo</p>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "rgba(46,125,90,0.1)", color: "#2E7D5A" }}>
                      <Lock className="w-2.5 h-2.5" /> Privado
                    </span>
                  </div>

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
                      onClick={handleCreate}
                      disabled={!newGroupName.trim() || creating}
                      className="flex-1 py-3 rounded-2xl text-[12px] font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ background: "#2E7D5A", color: "white", boxShadow: "0 4px 16px rgba(46,125,90,0.3)" }}
                    >
                      {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                      Criar grupo
                    </button>
                  </div>
                </div>
              )}

              {/* My groups */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#2E7D5A" }} />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>Meus grupos ({myGroups.length})</h3>
                </div>
                <div className="space-y-3">
                  {myGroups.map(group => (
                    <GroupCard key={group.id} group={group} isJoined={true} />
                  ))}
                  {myGroups.length === 0 && (
                    <p className="text-[12px] text-center py-4" style={{ color: "#7a9e8a" }}>Você ainda não participa de nenhum grupo</p>
                  )}
                </div>
              </div>

              {/* Discover groups (only public ones) */}
              {discoverGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-3 h-3" style={{ color: "#FF8F5A" }} />
                    <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "rgba(17,24,39,0.5)" }}>Descobrir</h3>
                  </div>
                  <div className="space-y-3">
                    {discoverGroups.map(group => (
                      <GroupCard key={group.id} group={group} isJoined={false} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageGroups;
