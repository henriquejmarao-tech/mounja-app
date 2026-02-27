import { ArrowLeft, Crown, Settings, Bell, Shield, HelpCircle, ChevronRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { icon: Bell, label: "Notificações", badge: "3" },
  { icon: Settings, label: "Configurações" },
  { icon: Shield, label: "Privacidade" },
  { icon: HelpCircle, label: "Ajuda e Suporte" },
];

const Profile = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
      </header>

      <div className="px-5 space-y-5">
        {/* Profile info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full gradient-hero flex items-center justify-center text-primary-foreground text-xl font-bold">
            C
          </div>
          <div>
            <h1 className="text-xl font-bold">Carla Silva</h1>
            <p className="text-sm text-muted-foreground">Semana 2 · Mounjaro 2.5mg</p>
          </div>
        </div>

        {/* Premium upsell */}
        <button className="w-full bg-foreground rounded-xl p-4 text-left text-background flex items-center gap-3 active:scale-[0.98] transition-transform">
          <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Desbloqueie o Premium</p>
            <p className="text-xs opacity-70">IA personalizada, planos exclusivos e mais</p>
          </div>
          <ChevronRight className="w-4 h-4 opacity-50" />
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-xl p-3 shadow-card text-center">
            <p className="text-xl font-bold text-primary">14</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Dias ativos</p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-card text-center">
            <p className="text-xl font-bold text-secondary">3</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Aplicações</p>
          </div>
          <div className="bg-card rounded-xl p-3 shadow-card text-center">
            <p className="text-xl font-bold text-foreground">8</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Treinos</p>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-card rounded-xl shadow-card overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-bold bg-secondary text-secondary-foreground w-5 h-5 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button className="w-full flex items-center justify-center gap-2 py-3 text-destructive text-sm font-medium">
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
};

export default Profile;
