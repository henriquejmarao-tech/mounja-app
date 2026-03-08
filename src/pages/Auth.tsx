import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Leaf } from "lucide-react";
import { toast } from "sonner";
import { getTriageData, clearTriageData, hasTriageData } from "@/hooks/useTriageStorage";
import { localDateStr } from "@/lib/utils";
import logoMounja from "@/assets/logo-mounja.png";

const weekDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

const savePendingTriageData = async (userId: string) => {
  const data = getTriageData();
  if (!data) return;

  try {
    const currentWeight = data.weightKg + data.weightDecimal / 10;
    const currentDose = data.doseValue ? `${data.doseValue} mg` : null;
    const age = new Date().getFullYear() - data.birthYear;

    const deriveGoal = () => {
      if (data.motivations.includes("health_control")) return "weight_loss";
      if (data.motivations.includes("food_relationship")) return "glycemic_control";
      return "weight_loss";
    };

    const deriveIntervalDays = () => {
      if (data.frequency === "daily") return 1;
      if (data.frequency === "weekly") return 7;
      return data.customIntervalDays;
    };

    await supabase
      .from("profiles")
      .update({
        name: data.name,
        sex: data.sex || null,
        age,
        height_cm: data.heightCm,
        current_weight: currentWeight,
        goal: deriveGoal(),
        current_dose: currentDose,
        application_interval_days: deriveIntervalDays(),
        application_day: weekDays[data.applicationDay] || null,
        application_frequency: data.frequency,
        triage_completed: true,
      } as any)
      .eq("id", userId);

    if (currentDose && data.lastApplicationDate) {
      await supabase.from("injections").insert({
        user_id: userId,
        date: data.lastApplicationDate,
        dose: currentDose,
        site: data.injectionSite || null,
        notes: "Registrado via triagem inicial",
      });
    }

    await supabase.from("daily_logs").insert({
      user_id: userId,
      date: localDateStr(),
      weight: currentWeight,
    });

    clearTriageData();
  } catch (err) {
    console.error("Error saving triage data:", err);
  }
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode");
  const [isLogin, setIsLogin] = useState(initialMode !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const hasTriage = hasTriageData();

  // Pre-fill name from triage data
  useEffect(() => {
    const data = getTriageData();
    if (data?.name) setName(data.name);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Que bom ter você de volta! 🌿");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;

        // If user was auto-confirmed and we have triage data, save it
        if (data.user && hasTriage) {
          await savePendingTriageData(data.user.id);
          toast.success("Conta criada e plano salvo! 🎉");
        } else {
          toast.success("Conta criada! Verifique seu e-mail para confirmar.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Algo deu errado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) toast.error(String(result.error));
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Digite seu e-mail primeiro.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("E-mail de recuperação enviado!");
  };

  return (
    <div className="bg-background flex flex-col overflow-y-auto" style={{ minHeight: "100dvh" }}>
      {/* Hero brand area */}
      <div className="relative overflow-hidden flex flex-col items-center justify-center pt-12 pb-6 px-8 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-accent/25 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-secondary/10 blur-2xl" />

        <div className="absolute top-8 left-6 opacity-15">
          <Leaf className="w-8 h-8 text-primary rotate-[-30deg]" />
        </div>
        <div className="absolute top-16 right-8 opacity-10">
          <Leaf className="w-6 h-6 text-primary rotate-[45deg]" />
        </div>
        <div className="absolute bottom-6 left-10 opacity-10">
          <Leaf className="w-5 h-5 text-primary rotate-[15deg]" />
        </div>

        <div className="relative flex flex-col items-center">
          <img src={logoMounja} alt="Mounjá" className="h-28 w-auto mb-2 object-contain drop-shadow-lg" />
          <p className="text-base text-muted-foreground italic font-medium tracking-wide">
            Aqui para caminhar com você.
          </p>
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 px-6 pb-10">
        <p className="text-center text-sm text-muted-foreground mb-5 font-medium">
          {isLogin ? "Acesse sua conta" : hasTriage ? "Crie sua conta para salvar seu plano" : "Crie sua conta gratuita"}
        </p>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-border bg-card shadow-card hover:shadow-elevated transition-all duration-300 mb-4"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-semibold">Continuar com Google</span>
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-11 pr-12 py-3.5 rounded-2xl border border-border bg-card text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary font-semibold ml-1"
            >
              Esqueci minha senha
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Entrar" : "Criar conta"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-semibold"
          >
            {isLogin ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
