import { ArrowLeft, Crown, Settings, Bell, Shield, HelpCircle, ChevronRight, LogOut, Sparkles, HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: HeartPulse, label: "Histórico de Saúde", route: "/historico-saude" },
  { icon: Bell, label: "Notificações", badge: "3" },
  { icon: Settings, label: "Configurações" },
  { icon: Shield, label: "Privacidade" },
  { icon: HelpCircle, label: "Ajuda e Suporte" },
];

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header with gradient */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative px-5 pt-6 pb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-primary-foreground/80 mb-6">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center text-primary-foreground text-xl font-bold border border-primary-foreground/10">
              C
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Carla Silva</h1>
              <p className="text-sm text-primary-foreground/80">Semana 2 · Mounjaro 2.5mg</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 -mt-3 space-y-4">
        {/* Premium upsell */}
        <button className="w-full relative overflow-hidden bg-foreground rounded-2xl p-4 text-left text-background flex items-center gap-3 active:scale-[0.98] transition-all duration-300 shadow-elevated">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl" />
          <div className="relative flex items-center gap-3 w-full">
            <div className="w-11 h-11 rounded-xl bg-warning/15 flex items-center justify-center">
              <Crown className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm">Desbloqueie o Premium</p>
                <Sparkles className="w-3.5 h-3.5 text-warning" />
              </div>
              <p className="text-xs opacity-60 mt-0.5">IA personalizada, planos exclusivos e mais</p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-40" />
          </div>
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { value: "14", label: "Dias ativos", color: "text-primary" },
            { value: "3", label: "Aplicações", color: "text-secondary" },
            { value: "8", label: "Treinos", color: "text-foreground" },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-2xl p-3.5 shadow-card border border-border/50 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => item.route && navigate(item.route)}
              className="w-full flex items-center gap-3 px-4 py-4 hover:bg-muted/40 transition-colors border-b border-border/50 last:border-0"
            >
              <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
                <item.icon className="w-4.5 h-4.5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold bg-secondary text-secondary-foreground w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 py-3.5 text-destructive text-sm font-semibold rounded-2xl hover:bg-destructive/5 transition-colors">
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
};

export default Profile;
