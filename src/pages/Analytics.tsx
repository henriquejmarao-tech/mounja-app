import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { Users, Activity, Crown, TrendingUp, Syringe, Camera, Utensils, Dumbbell, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ADMIN_EMAIL = "henriquejmarao@gmail.com";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
];

interface AnalyticsData {
  totalUsers: number;
  triageCompleted: number;
  premiumCount: number;
  freeCount: number;
  todayActiveUsers: number;
  featureUsage: Record<string, { total: number; today?: number }>;
  last7Days: { date: string; logs: number; injections: number; meals: number; workouts: number }[];
  users: {
    id: string; name: string; email: string; medication: string | null; dose: string | null;
    triageCompleted: boolean; createdAt: string; isPremium: boolean; premiumSource: string | null;
    logs: number; injections: number; meals: number; workouts: number; photos: number;
  }[];
}

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchData = async () => {
      try {
        const { data: res, error: err } = await supabase.functions.invoke("admin-analytics");
        if (err) throw err;
        setData(res);
      } catch (e: any) {
        setError(e.message || "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  if (authLoading) return <LoadingSpinner />;
  if (!user || user.email !== ADMIN_EMAIL) return <Navigate to="/" replace />;
  if (loading) return <LoadingSpinner />;
  if (error) return <div className="p-6 text-destructive text-center">{error}</div>;
  if (!data) return null;

  const pieData = [
    { name: "Premium", value: data.premiumCount },
    { name: "Gratuito", value: data.freeCount },
  ];

  const featureChartData = [
    { name: "Registros", total: data.featureUsage.daily_logs?.total || 0, hoje: data.featureUsage.daily_logs?.today || 0 },
    { name: "Aplicações", total: data.featureUsage.injections?.total || 0, hoje: data.featureUsage.injections?.today || 0 },
    { name: "Refeições", total: data.featureUsage.meals?.total || 0, hoje: data.featureUsage.meals?.today || 0 },
    { name: "Treinos", total: data.featureUsage.workouts?.total || 0, hoje: data.featureUsage.workouts?.today || 0 },
    { name: "Fotos", total: data.featureUsage.photos?.total || 0, hoje: data.featureUsage.photos?.today || 0 },
  ];

  const last7 = data.last7Days.map(d => ({
    ...d,
    date: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }),
    total: d.logs + d.injections + d.meals + d.workouts,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="bg-primary text-primary-foreground px-4 py-6">
        <h1 className="text-xl font-bold">📊 Painel Admin</h1>
        <p className="text-sm opacity-80">Visão geral do uso do Mounja</p>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard icon={<Users className="w-5 h-5" />} label="Total Usuários" value={data.totalUsers} />
          <KpiCard icon={<Activity className="w-5 h-5" />} label="Ativos Hoje" value={data.todayActiveUsers} />
          <KpiCard icon={<Crown className="w-5 h-5" />} label="Premium" value={data.premiumCount} />
          <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Triagem Completa" value={data.triageCompleted} />
        </div>

        {/* Pie chart - Premium vs Free */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assinantes vs Gratuitos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Feature usage bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Uso por Funcionalidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={featureChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--primary))" name="Total" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hoje" fill="hsl(var(--accent))" name="Hoje" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Last 7 days activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Atividade - Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="logs" stroke="hsl(var(--primary))" name="Registros" strokeWidth={2} />
                <Line type="monotone" dataKey="injections" stroke="hsl(142, 76%, 36%)" name="Aplicações" strokeWidth={2} />
                <Line type="monotone" dataKey="meals" stroke="hsl(38, 92%, 50%)" name="Refeições" strokeWidth={2} />
                <Line type="monotone" dataKey="workouts" stroke="hsl(0, 84%, 60%)" name="Treinos" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Users table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalhamento por Usuário</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Usuário</TableHead>
                    <TableHead className="text-xs">Plano</TableHead>
                    <TableHead className="text-xs text-center"><ClipboardList className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-xs text-center"><Syringe className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-xs text-center"><Utensils className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-xs text-center"><Dumbbell className="w-3.5 h-3.5 mx-auto" /></TableHead>
                    <TableHead className="text-xs text-center"><Camera className="w-3.5 h-3.5 mx-auto" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="py-2">
                        <div className="text-xs font-medium truncate max-w-[120px]">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{u.email}</div>
                      </TableCell>
                      <TableCell className="py-2">
                        {u.isPremium ? (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">Premium</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs py-2">{u.logs}</TableCell>
                      <TableCell className="text-center text-xs py-2">{u.injections}</TableCell>
                      <TableCell className="text-center text-xs py-2">{u.meals}</TableCell>
                      <TableCell className="text-center text-xs py-2">{u.workouts}</TableCell>
                      <TableCell className="text-center text-xs py-2">{u.photos}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const KpiCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

export default Analytics;
