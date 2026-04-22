import { Component, ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import {
  Users, Activity, Crown, TrendingUp, Syringe, Camera, Utensils,
  Dumbbell, ClipboardList, Bot, Shield, Globe, Mail, Sparkles, AlertTriangle,
  RotateCcw, CalendarCheck, CreditCard, Lock, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InboxTab } from "@/components/analytics/InboxTab";

const ADMIN_EMAIL = "henriquejmarao@gmail.com";

interface RetentionData {
  pct: number;
  eligible: number;
  retained: number;
}

interface CreditsData {
  totalCreditsToday: number;
  limitHitToday: number;
  creditsLast7: { date: string; credits: number }[];
  limitLast7: { date: string; users: number }[];
  limitUsers: { id: string; name: string; email: string; timesHitLimit: number; daysSinceSignup: number }[];
}

interface AnalyticsData {
  totalUsers: number;
  triageCompleted: number;
  premiumCount: number;
  freeCount: number;
  todayActiveUsers: number;
  yesterdayActiveUsers: number;
  premiumBySource: Record<string, number>;
  premiumByPromo: Record<string, number>;
  signupsByProvider: Record<string, number>;
  signupsByMonth: Record<string, number>;
  botSuspectsCount: number;
  retention: { d1: RetentionData | null; d7: RetentionData | null };
  featureUsage: Record<string, { total: number; today?: number; uniqueUsers?: number }>;
  credits: CreditsData | null;
  last7Days: { date: string; logs: number; injections: number; meals: number; workouts: number }[];
  users: {
    id: string; name: string; email: string; medication: string | null; dose: string | null;
    triageCompleted: boolean; createdAt: string; isPremium: boolean; premiumSource: string | null;
    premiumPromo: string | null; provider: string;
    logs: number; injections: number; meals: number; workouts: number; photos: number;
    totalActivity: number; isSuspectBot: boolean; isActiveToday?: boolean;
  }[];
}

const CHART_COLORS = {
  primary: "#6366f1",
  secondary: "#22d3ee",
  green: "#34d399",
  amber: "#fbbf24",
  rose: "#fb7185",
  purple: "#a78bfa",
  slate: "#94a3b8",
  orange: "#f97316",
};

type AnalyticsAuthUser = {
  id?: string;
  email?: string | null;
};

const readStoredAuthUser = (): AnalyticsAuthUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) return null;

    const raw = window.localStorage.getItem(`sb-${projectId}-auth-token`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const candidates = [
      parsed?.user,
      parsed?.currentSession?.user,
      parsed?.session?.user,
      Array.isArray(parsed) ? parsed[0]?.user : null,
      Array.isArray(parsed) ? parsed[0]?.currentSession?.user : null,
      Array.isArray(parsed) ? parsed[0]?.session?.user : null,
    ];

    const storedUser = candidates.find((candidate) => candidate?.id || candidate?.email);
    return storedUser ? { id: storedUser.id, email: storedUser.email ?? null } : null;
  } catch (error) {
    console.warn("[Analytics] failed to read stored auth user", error);
    return null;
  }
};

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const [storedUser, setStoredUser] = useState<AnalyticsAuthUser | null>(() => readStoredAuthUser());
  const [authTimedOut, setAuthTimedOut] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPerUser, setShowPerUser] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const effectiveUser = user ?? storedUser;
  const adminChecked = !!effectiveUser || !authLoading || authTimedOut;
  const isAdmin = effectiveUser?.email === ADMIN_EMAIL;

  console.log("[Analytics] render", { loading: authLoading, user: effectiveUser?.email, adminChecked });

  useEffect(() => {
    if (!user) return;
    setStoredUser({ id: user.id, email: user.email ?? null });
  }, [user]);

  useEffect(() => {
    if (!authLoading || effectiveUser) {
      setAuthTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStoredUser((current) => current ?? readStoredAuthUser());
      setAuthTimedOut(true);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [authLoading, effectiveUser]);

  useEffect(() => {
    if (!adminChecked || !isAdmin) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: res, error: err } = await supabase.functions.invoke("admin-analytics");
        if (err) throw err;
        if (!cancelled) setData(res);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Erro ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [adminChecked, isAdmin]);

  const showAccessPlaceholder = !adminChecked;
  const showAccessDenied = adminChecked && !isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 pb-24 text-white">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Analytics
          </h1>
        </div>
        <p className="text-sm text-slate-400">Mounja · operação, retenção e saúde da base</p>
      </div>

      <div className="px-4 space-y-5">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-sm text-rose-200 text-center">
            {error}
          </div>
        )}
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {data ? (
            <>
              <GlowKpi icon={<Users className="w-5 h-5" />} label="Total Usuários" value={data.totalUsers} color="indigo" />
              <GlowKpi icon={<Activity className="w-5 h-5" />} label="Ativos Hoje" value={data.todayActiveUsers} color="cyan" />
              <GlowKpi icon={<Crown className="w-5 h-5" />} label="Premium" value={data.premiumCount} color="amber" />
              <GlowKpi icon={<TrendingUp className="w-5 h-5" />} label="Triagem Completa" value={data.triageCompleted} color="green" />
              <GlowKpi icon={<CalendarCheck className="w-5 h-5" />} label="Voltaram Ontem" value={data.yesterdayActiveUsers} color="indigo" />
              <GlowKpiText
                icon={<RotateCcw className="w-5 h-5" />}
                label="Retenção"
                value={data.retention.d1 ? `D1: ${data.retention.d1.pct}%` : "D1: —"}
                subValue={data.retention.d7 ? `D7: ${data.retention.d7.pct}%` : "D7: —"}
                tooltip={
                  !data.retention.d1 && !data.retention.d7
                    ? "Dados insuficientes"
                    : `D1: ${data.retention.d1?.retained ?? 0}/${data.retention.d1?.eligible ?? 0} · D7: ${data.retention.d7?.retained ?? 0}/${data.retention.d7?.eligible ?? 0}`
                }
                color="rose"
              />
            </>
          ) : (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-slate-800/40 border border-slate-700/40 animate-pulse" />
            ))
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-slate-800/60 border border-slate-700/50">
            <TabsTrigger value="overview" className="text-xs flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="inbox" className="text-xs flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Inbox</TabsTrigger>
            <TabsTrigger value="retention" className="text-xs flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Retenção</TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Engajamento</TabsTrigger>
            <TabsTrigger value="conversion" className="text-xs flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Conversão</TabsTrigger>
            <TabsTrigger value="quality" className="text-xs flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Qualidade</TabsTrigger>
            <TabsTrigger value="health" className="text-xs flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Saúde</TabsTrigger>
          </TabsList>

          {showAccessPlaceholder && (
            <div className="mt-4 rounded-xl border border-slate-700/50 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
              Verificando acesso ao painel…
            </div>
          )}

          {showAccessDenied && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-6 text-center">
              <p className="text-sm text-amber-200">Acesso restrito ao painel administrativo.</p>
            </div>
          )}

          {loading && isAdmin && activeTab !== "inbox" && (
            <div className="mt-4 flex items-center justify-center py-12">
              <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            </div>
          )}

          <TabsContent value="inbox" className="mt-4">
            <InboxErrorBoundary>
              <InboxTab />
            </InboxErrorBoundary>
          </TabsContent>

          {isAdmin && data && (<>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Feature usage */}
            <GlassCard title="Uso por Funcionalidade">
              <div className="flex items-center justify-end gap-2 mb-2">
                <button
                  onClick={() => setShowPerUser(!showPerUser)}
                  className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg px-2.5 py-1.5"
                >
                  {showPerUser ? <ToggleRight className="w-3.5 h-3.5 text-indigo-400" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                  {showPerUser ? "Média/Usuário" : "Volume Total"}
                </button>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={buildFeatureData(data, showPerUser)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: "#94a3b8" }} />
                  <YAxis fontSize={11} tick={{ fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
                    formatter={(value: number) => showPerUser ? value.toFixed(1) : value}
                  />
                  <Bar dataKey="total" fill={CHART_COLORS.primary} name={showPerUser ? "Média/Usuário" : "Total"} radius={[6, 6, 0, 0]} />
                  {!showPerUser && <Bar dataKey="hoje" fill={CHART_COLORS.secondary} name="Hoje" radius={[6, 6, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
              {showPerUser && (
                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                  {buildFeatureData(data, false).map((f) => (
                    <div key={f.name} className="bg-slate-800/40 rounded-lg px-2.5 py-1.5 text-slate-400">
                      {f.name}: <span className="text-white font-medium">{f.total}</span> total / <span className="text-indigo-300">{f.uniqueUsers}</span> usuários
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* 7-day trend */}
            <GlassCard title="Tendência — Últimos 7 Dias">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={buildLast7(data)}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" fontSize={10} tick={{ fill: "#94a3b8" }} />
                  <YAxis fontSize={11} tick={{ fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }} />
                  <Area type="monotone" dataKey="total" stroke={CHART_COLORS.primary} fill="url(#gradTotal)" name="Total Ações" strokeWidth={2} />
                  <Line type="monotone" dataKey="logs" stroke={CHART_COLORS.green} name="Registros" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="injections" stroke={CHART_COLORS.amber} name="Aplicações" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Users Table */}
            <GlassCard title="Detalhamento por Usuário">
              <UsersTable users={data.users} />
            </GlassCard>
          </TabsContent>

          {/* RETENTION TAB */}
          <TabsContent value="retention" className="space-y-4 mt-4">
            {data.credits ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <GlowKpi icon={<Utensils className="w-5 h-5" />} label="Créditos Hoje" value={data.credits.totalCreditsToday} color="indigo" />
                  <GlowKpi icon={<Lock className="w-5 h-5" />} label="No Limite Hoje" value={data.credits.limitHitToday} color="rose" />
                </div>

                <GlassCard title="Créditos Consumidos — 7 Dias">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={formatCredits7(data.credits.creditsLast7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" fontSize={10} tick={{ fill: "#94a3b8" }} />
                      <YAxis fontSize={11} tick={{ fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }} />
                      <Bar dataKey="credits" fill={CHART_COLORS.purple} name="Créditos" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard title="Usuários no Limite — 7 Dias (Intenção de Compra)">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={formatCredits7(data.credits.limitLast7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" fontSize={10} tick={{ fill: "#94a3b8" }} />
                      <YAxis fontSize={11} tick={{ fill: "#94a3b8" }} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }} />
                      <Line type="monotone" dataKey="users" stroke={CHART_COLORS.orange} name="Usuários" strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.orange }} />
                    </LineChart>
                  </ResponsiveContainer>
                </GlassCard>

                <GlassCard title="Usuários que Bateram no Limite (3 dias)">
                  {data.credits.limitUsers.length > 0 ? (
                    <div className="overflow-auto max-h-[400px] -mx-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700/50 hover:bg-transparent">
                            <TableHead className="text-[10px] text-slate-400 font-medium">Usuário</TableHead>
                            <TableHead className="text-[10px] text-slate-400 font-medium text-center">Vezes</TableHead>
                            <TableHead className="text-[10px] text-slate-400 font-medium text-center">Dias no App</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.credits.limitUsers.map((u) => (
                            <TableRow key={u.id} className="border-slate-700/30 hover:bg-slate-800/40">
                              <TableCell className="py-2">
                                <div className="text-[11px] font-medium text-white truncate max-w-[120px]">{u.name}</div>
                                <div className="text-[9px] text-slate-500 truncate max-w-[120px]">{u.email}</div>
                              </TableCell>
                              <TableCell className="text-center text-xs py-2">
                                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px]">{u.timesHitLimit}x</Badge>
                              </TableCell>
                              <TableCell className="text-center text-xs py-2 text-slate-300">{u.daysSinceSignup}d</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">Nenhum usuário atingiu o limite nos últimos 3 dias</p>
                  )}
                </GlassCard>
              </>
            ) : (
              <GlassCard title="Créditos de Refeição">
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <CreditCard className="w-8 h-8 mb-3 opacity-40" />
                  <p className="text-sm">Aguardando implementação dos créditos diários</p>
                </div>
              </GlassCard>
            )}
          </TabsContent>

          {/* ENGAGEMENT TAB */}
          <TabsContent value="engagement" className="space-y-4 mt-4">
            {/* Signup Provider */}
            <GlassCard title="Origem dos Cadastros">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={buildProviderData(data)}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: "#64748b" }}
                  >
                    {buildProviderData(data).map((_, i) => (
                      <Cell key={i} fill={Object.values(CHART_COLORS)[i % 8]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {Object.entries(data.signupsByProvider).map(([provider, count]) => (
                  <div key={provider} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                    {provider === "google" ? <Globe className="w-4 h-4 text-cyan-400" /> : <Mail className="w-4 h-4 text-indigo-400" />}
                    <span className="text-xs capitalize text-slate-300">{provider}</span>
                    <span className="ml-auto text-sm font-bold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Signups by Month */}
            <GlassCard title="Cadastros por Mês">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={buildMonthlyData(data)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" fontSize={10} tick={{ fill: "#94a3b8" }} />
                  <YAxis fontSize={11} tick={{ fill: "#94a3b8" }} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }} />
                  <Bar dataKey="count" fill={CHART_COLORS.purple} name="Cadastros" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Conversion Funnel */}
            <GlassCard title="Funil de Conversão">
              <div className="space-y-3">
                <FunnelBar label="Cadastros" value={data.totalUsers} max={data.totalUsers} color="bg-indigo-500" />
                <FunnelBar label="Triagem completa" value={data.triageCompleted} max={data.totalUsers} color="bg-cyan-500" />
                <FunnelBar label="Ativos (alguma ação)" value={data.users.filter(u => u.totalActivity > 0).length} max={data.totalUsers} color="bg-green-500" />
                <FunnelBar label="Premium" value={data.premiumCount} max={data.totalUsers} color="bg-amber-500" />
              </div>
            </GlassCard>
          </TabsContent>

          {/* CONVERSION TAB */}
          <TabsContent value="conversion" className="space-y-4 mt-4">
            <GlassCard title="Assinantes vs Gratuitos">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Premium", value: data.premiumCount },
                      { name: "Gratuito", value: data.freeCount },
                    ]}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ stroke: "#64748b" }}
                  >
                    <Cell fill={CHART_COLORS.amber} />
                    <Cell fill={CHART_COLORS.slate} />
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard title="Origem do Premium">
              <div className="space-y-2">
                {Object.entries(data.premiumBySource).map(([source, count]) => (
                  <div key={source} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3">
                    <div className={`w-2 h-2 rounded-full ${source === "stripe" ? "bg-indigo-400" : "bg-amber-400"}`} />
                    <span className="text-sm capitalize text-slate-300">{source === "stripe" ? "Stripe (Pago)" : source === "promo" ? "Código Promocional" : source}</span>
                    <span className="ml-auto text-lg font-bold text-white">{count}</span>
                  </div>
                ))}
                {Object.keys(data.premiumBySource).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhum premium ativo</p>
                )}
              </div>
            </GlassCard>

            {Object.keys(data.premiumByPromo).length > 0 && (
              <GlassCard title="Códigos Promocionais Usados">
                <div className="space-y-2">
                  {Object.entries(data.premiumByPromo).map(([code, count]) => (
                    <div key={code} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3">
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">{code}</Badge>
                      <span className="ml-auto text-lg font-bold text-white">{count} uso{count > 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            <GlassCard title="Usuários Premium">
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {data.users.filter(u => u.isPremium).map(u => (
                  <div key={u.id} className="flex items-center gap-3 bg-slate-800/40 rounded-lg px-3 py-2.5">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${u.premiumSource === "stripe" ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                      {u.premiumSource === "stripe" ? "Stripe" : u.premiumPromo || "Promo"}
                    </Badge>
                  </div>
                ))}
                {data.users.filter(u => u.isPremium).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhum premium ativo</p>
                )}
              </div>
            </GlassCard>
          </TabsContent>

          {/* QUALITY TAB */}
          <TabsContent value="quality" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <GlowKpi icon={<Bot className="w-5 h-5" />} label="Suspeitos Bot" value={data.botSuspectsCount} color="rose" />
              <GlowKpi icon={<Shield className="w-5 h-5" />} label="Legítimos" value={data.totalUsers - data.botSuspectsCount} color="green" />
            </div>

            <GlassCard title="Critérios de Detecção de Bot">
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex items-start gap-2 bg-slate-800/40 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Conta criada há mais de 2 dias, sem nome, sem triagem e sem nenhuma atividade registrada</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Contas Suspeitas">
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {data.users.filter(u => u.isSuspectBot).map(u => (
                  <div key={u.id} className="flex items-center gap-3 bg-rose-950/30 border border-rose-500/20 rounded-lg px-3 py-2.5">
                    <Bot className="w-4 h-4 text-rose-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white truncate">{u.email}</p>
                      <p className="text-[10px] text-slate-400">
                        {u.provider} · {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
                {data.users.filter(u => u.isSuspectBot).length === 0 && (
                  <div className="flex items-center gap-2 justify-center py-6 text-green-400">
                    <Shield className="w-5 h-5" />
                    <span className="text-sm">Nenhuma conta suspeita detectada</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </TabsContent>
          </>)}
        </Tabs>
      </div>
    </div>
  );
};

// ── Helpers ──

function buildFeatureData(data: AnalyticsData, perUser: boolean) {
  const items = [
    { name: "Registros", total: data.featureUsage.daily_logs?.total || 0, hoje: data.featureUsage.daily_logs?.today || 0, uniqueUsers: data.featureUsage.daily_logs?.uniqueUsers || 0 },
    { name: "Aplicações", total: data.featureUsage.injections?.total || 0, hoje: data.featureUsage.injections?.today || 0, uniqueUsers: data.featureUsage.injections?.uniqueUsers || 0 },
    { name: "Refeições", total: data.featureUsage.meals?.total || 0, hoje: data.featureUsage.meals?.today || 0, uniqueUsers: data.featureUsage.meals?.uniqueUsers || 0 },
    { name: "Treinos", total: data.featureUsage.workouts?.total || 0, hoje: data.featureUsage.workouts?.today || 0, uniqueUsers: data.featureUsage.workouts?.uniqueUsers || 0 },
    { name: "Fotos", total: data.featureUsage.photos?.total || 0, hoje: data.featureUsage.photos?.today || 0, uniqueUsers: data.featureUsage.photos?.uniqueUsers || 0 },
  ];
  if (perUser) {
    return items.map(i => ({
      ...i,
      total: i.uniqueUsers > 0 ? parseFloat((i.total / i.uniqueUsers).toFixed(1)) : 0,
    }));
  }
  return items;
}

function buildLast7(data: AnalyticsData) {
  return data.last7Days.map(d => ({
    ...d,
    date: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
    total: d.logs + d.injections + d.meals + d.workouts,
  }));
}

function buildProviderData(data: AnalyticsData) {
  return Object.entries(data.signupsByProvider).map(([name, value]) => ({
    name: name === "google" ? "Google" : name === "email" ? "E-mail" : name,
    value,
  }));
}

function buildMonthlyData(data: AnalyticsData) {
  return Object.entries(data.signupsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const [y, m] = month.split("-");
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return { month: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`, count };
    });
}

function formatCredits7(items: { date: string; [key: string]: any }[]) {
  return items.map(d => ({
    ...d,
    date: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
  }));
}

// ── Sub-components ──

const colorMap: Record<string, string> = {
  indigo: "from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400",
  cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400",
  amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
  green: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400",
  rose: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400",
};

const GlowKpi = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) => (
  <div className={`rounded-xl border bg-gradient-to-br ${colorMap[color]} p-4 flex items-center gap-3`}>
    <div className={colorMap[color].split(" ").pop()}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[11px] text-slate-400">{label}</p>
    </div>
  </div>
);

const GlowKpiText = ({ icon, label, value, subValue, tooltip, color }: { icon: React.ReactNode; label: string; value: string; subValue: string; tooltip: string; color: string }) => (
  <div className={`rounded-xl border bg-gradient-to-br ${colorMap[color]} p-4 flex items-center gap-3`} title={tooltip}>
    <div className={colorMap[color].split(" ").pop()}>{icon}</div>
    <div>
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-xs font-medium text-white/70">{subValue}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  </div>
);

const GlassCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm">
    <div className="px-4 py-3 border-b border-slate-700/40">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const FunnelBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-white font-medium">{value} ({pct}%)</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const UsersTable = ({ users }: { users: AnalyticsData["users"] }) => (
  <div className="overflow-auto max-h-[500px] -mx-4">
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700/50 hover:bg-transparent">
          <TableHead className="text-[10px] text-slate-400 font-medium">Usuário</TableHead>
          <TableHead className="text-[10px] text-slate-400 font-medium">Plano</TableHead>
          <TableHead className="text-[10px] text-slate-400 font-medium text-center"><ClipboardList className="w-3 h-3 mx-auto" /></TableHead>
          <TableHead className="text-[10px] text-slate-400 font-medium text-center"><Syringe className="w-3 h-3 mx-auto" /></TableHead>
          <TableHead className="text-[10px] text-slate-400 font-medium text-center"><Utensils className="w-3 h-3 mx-auto" /></TableHead>
          <TableHead className="text-[10px] text-slate-400 font-medium text-center"><Dumbbell className="w-3 h-3 mx-auto" /></TableHead>
          <TableHead className="text-[10px] text-slate-400 font-medium text-center"><Camera className="w-3 h-3 mx-auto" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((u) => (
          <TableRow key={u.id} className={`border-slate-700/30 ${u.isSuspectBot ? "bg-rose-950/20" : u.isActiveToday ? "bg-emerald-950/25" : "hover:bg-slate-800/40"}`}>
            <TableCell className="py-2">
              <div className="flex items-center gap-1.5">
                {u.isActiveToday && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
                {u.isSuspectBot && <Bot className="w-3 h-3 text-rose-400 shrink-0" />}
                <div>
                  <div className="text-[11px] font-medium text-white truncate max-w-[100px]">{u.name}</div>
                  <div className="text-[9px] text-slate-500 truncate max-w-[100px]">{u.email}</div>
                </div>
              </div>
            </TableCell>
            <TableCell className="py-2">
              {u.isPremium ? (
                <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/20 text-amber-300 border-amber-500/30">Premium</Badge>
              ) : (
                <Badge className="text-[9px] px-1.5 py-0 bg-slate-700/50 text-slate-400 border-slate-600/30">Free</Badge>
              )}
            </TableCell>
            <TableCell className="text-center text-xs py-2 text-slate-300">{u.logs}</TableCell>
            <TableCell className="text-center text-xs py-2 text-slate-300">{u.injections}</TableCell>
            <TableCell className="text-center text-xs py-2 text-slate-300">{u.meals}</TableCell>
            <TableCell className="text-center text-xs py-2 text-slate-300">{u.workouts}</TableCell>
            <TableCell className="text-center text-xs py-2 text-slate-300">{u.photos}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="w-6 h-6 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
  </div>
);

// Local error boundary so a failure in Inbox never breaks the rest of /analytics
class InboxErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) { console.error("[InboxTab] error:", err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-6 text-center">
          <p className="text-sm text-rose-200">Falha ao carregar inbox — tente recarregar.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-xs text-rose-300 underline"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default Analytics;
