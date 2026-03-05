import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface CommunityGroup {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  is_private: boolean;
  invite_code: string | null;
  member_count?: number;
}

export interface CommunityQuestion {
  id: string;
  user_id: string;
  group_id: string;
  question: string;
  created_at: string;
  group_name?: string;
  group_emoji?: string;
  author_name?: string;
  also_feel_count: number;
  dont_feel_count: number;
  user_vote?: string | null;
}

export function useCommunityGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<string[]>([]);
  const [hiddenGroupIds, setHiddenGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Fetch all groups
    const { data: groupsData } = await supabase
      .from("community_groups")
      .select("*")
      .order("created_at", { ascending: true });

    // Fetch user memberships
    const { data: memberships } = await supabase
      .from("community_group_members")
      .select("group_id, hidden")
      .eq("user_id", user.id);

    // Fetch member counts for each group
    const { data: allMemberships } = await supabase
      .from("community_group_members")
      .select("group_id");

    const memberCounts: Record<string, number> = {};
    allMemberships?.forEach((m: any) => {
      memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
    });

    if (groupsData) {
      setGroups(groupsData.map((g: any) => ({ ...g, member_count: memberCounts[g.id] || 0 })));
    }

    if (memberships) {
      setMyGroupIds(memberships.map((m: any) => m.group_id));
      setHiddenGroupIds(memberships.filter((m: any) => m.hidden).map((m: any) => m.group_id));
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const joinGroup = async (groupId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("community_group_members")
      .insert({ user_id: user.id, group_id: groupId });
    if (error) {
      if (error.code === "23505") {
        // Already a member, ignore
      } else {
        toast.error("Erro ao entrar no grupo");
        return;
      }
    }
    setMyGroupIds(prev => [...prev, groupId]);
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;
    await supabase
      .from("community_group_members")
      .delete()
      .eq("user_id", user.id)
      .eq("group_id", groupId);
    setMyGroupIds(prev => prev.filter(id => id !== groupId));
    setHiddenGroupIds(prev => prev.filter(id => id !== groupId));
  };

  const toggleGroupHidden = async (groupId: string) => {
    if (!user) return;
    const isHidden = hiddenGroupIds.includes(groupId);
    const isMember = myGroupIds.includes(groupId);

    if (!isMember) {
      // Join first, then set hidden
      await supabase
        .from("community_group_members")
        .insert({ user_id: user.id, group_id: groupId, hidden: true });
      setMyGroupIds(prev => [...prev, groupId]);
      setHiddenGroupIds(prev => [...prev, groupId]);
    } else {
      await supabase
        .from("community_group_members")
        .update({ hidden: !isHidden })
        .eq("user_id", user.id)
        .eq("group_id", groupId);
      setHiddenGroupIds(prev =>
        isHidden ? prev.filter(id => id !== groupId) : [...prev, groupId]
      );
    }
  };

  const createGroup = async (name: string, emoji: string, description: string) => {
    if (!user) return null;

    // Generate invite code via RPC
    const { data: codeData } = await supabase.rpc("generate_invite_code");
    const inviteCode = codeData as string;

    const { data, error } = await supabase
      .from("community_groups")
      .insert({ name, emoji, description, created_by: user.id, is_private: true, invite_code: inviteCode })
      .select()
      .single();
    if (error) {
      toast.error("Erro ao criar grupo");
      return null;
    }
    // Auto-join the created group
    await supabase
      .from("community_group_members")
      .insert({ user_id: user.id, group_id: data.id });
    await fetchGroups();
    return data;
  };

  const joinByCode = async (code: string) => {
    if (!user) return false;
    const { data: groupId } = await supabase.rpc("find_group_by_code", { _code: code });
    if (!groupId) {
      toast.error("Código inválido");
      return false;
    }
    const { error } = await supabase
      .from("community_group_members")
      .insert({ user_id: user.id, group_id: groupId });
    if (error) {
      if (error.code === "23505") {
        toast("Você já participa deste grupo");
      } else {
        toast.error("Erro ao entrar no grupo");
        return false;
      }
    } else {
      toast.success("Você entrou no grupo!");
    }
    await fetchGroups();
    return true;
  };

  return {
    groups,
    myGroupIds,
    hiddenGroupIds,
    loading,
    joinGroup,
    leaveGroup,
    toggleGroupHidden,
    createGroup,
    joinByCode,
    refreshGroups: fetchGroups,
  };
}

export function useCommunityQuestions(visibleGroupIds: string[]) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    if (!user || visibleGroupIds.length === 0) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Fetch questions from visible groups
    const { data: questionsData } = await supabase
      .from("community_questions")
      .select("*")
      .in("group_id", visibleGroupIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!questionsData || questionsData.length === 0) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    const questionIds = questionsData.map((q: any) => q.id);

    // Fetch votes for these questions
    const { data: votesData } = await supabase
      .from("community_votes")
      .select("question_id, vote_type, user_id")
      .in("question_id", questionIds);

    // Fetch groups for names/emojis
    const { data: groupsData } = await supabase
      .from("community_groups")
      .select("id, name, emoji")
      .in("id", visibleGroupIds);

    const groupMap: Record<string, { name: string; emoji: string }> = {};
    groupsData?.forEach((g: any) => { groupMap[g.id] = { name: g.name, emoji: g.emoji }; });

    // Fetch author profiles
    const authorIds = [...new Set(questionsData.map((q: any) => q.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username")
      .in("id", authorIds);

    const profileMap: Record<string, string> = {};
    profiles?.forEach((p: any) => {
      profileMap[p.id] = p.name || p.username || "Anônimo";
    });

    const enriched: CommunityQuestion[] = questionsData.map((q: any) => {
      const qVotes = votesData?.filter((v: any) => v.question_id === q.id) || [];
      const alsoFeel = qVotes.filter((v: any) => v.vote_type === "also_feel").length;
      const dontFeel = qVotes.filter((v: any) => v.vote_type === "dont_feel").length;
      const userVote = qVotes.find((v: any) => v.user_id === user.id)?.vote_type || null;

      return {
        ...q,
        group_name: groupMap[q.group_id]?.name || "",
        group_emoji: groupMap[q.group_id]?.emoji || "🌱",
        author_name: profileMap[q.user_id] || "Anônimo",
        also_feel_count: alsoFeel,
        dont_feel_count: dontFeel,
        user_vote: userVote,
      };
    });

    setQuestions(enriched);
    setLoading(false);
  }, [user, visibleGroupIds.join(",")]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const vote = async (questionId: string, voteType: "also_feel" | "dont_feel") => {
    if (!user) return;

    // Upsert vote
    const { error } = await supabase
      .from("community_votes")
      .upsert(
        { user_id: user.id, question_id: questionId, vote_type: voteType },
        { onConflict: "user_id,question_id" }
      );

    if (error) {
      toast.error("Erro ao votar");
      return;
    }

    // Optimistic update
    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== questionId) return q;
        const wasAlso = q.user_vote === "also_feel";
        const wasDont = q.user_vote === "dont_feel";
        return {
          ...q,
          user_vote: voteType,
          also_feel_count: q.also_feel_count + (voteType === "also_feel" ? 1 : 0) - (wasAlso ? 1 : 0),
          dont_feel_count: q.dont_feel_count + (voteType === "dont_feel" ? 1 : 0) - (wasDont ? 1 : 0),
        };
      })
    );
  };

  const createQuestion = async (question: string, groupId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("community_questions")
      .insert({ user_id: user.id, group_id: groupId, question });
    if (error) {
      toast.error("Erro ao criar pergunta");
      return;
    }
    toast.success("Pergunta publicada!");
    await fetchQuestions();
  };

  return { questions, loading, vote, createQuestion, refreshQuestions: fetchQuestions };
}

export function useCommunityAI() {
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const getAIAnswer = async (question: string) => {
    setAiLoading(true);
    setAiAnswer(null);
    try {
      const { data, error } = await supabase.functions.invoke("community-ai-answer", {
        body: { question },
      });
      if (error) throw error;
      setAiAnswer(data.answer);
    } catch (e) {
      toast.error("Erro ao gerar resposta IA");
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const resetAI = () => {
    setAiAnswer(null);
    setAiLoading(false);
  };

  return { aiAnswer, aiLoading, getAIAnswer, resetAI };
}
