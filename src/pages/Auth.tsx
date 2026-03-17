import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { getTriageData, clearTriageData, hasTriageData } from "@/hooks/useTriageStorage";
import { localDateStr } from "@/lib/utils";
import logoMounja from "@/assets/logo-mounja.png";
import mascotPointingImg from "@/assets/mascot-pointing.png";

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
      if (data.doseIntervalDays) return data.doseIntervalDays;
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
        weight_goal: data.goalKg + data.goalDecimal / 10,
        current_dose: currentDose,
        medication: data.medication || null,
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

        // Only save triage data if user has an active session (auto-confirm enabled)
        // Otherwise, keep data in localStorage — useAuth will save it after email confirmation
        if (data.session && data.user && hasTriage) {
          await savePendingTriageData(data.user.id);
          toast.success("Conta criada e plano salvo! 🎉");
        } else if (data.user && !data.session) {
          // Email confirmation required — keep triage data in localStorage
          toast.success("Conta criada! Verifique seu e-mail para confirmar. 📩");
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
    <div className="flex flex-col overflow-y-auto" style={{ minHeight: "100dvh", background: "#FAFAFA" }}>
      {/* Hero area — changes based on triage state */}
      {hasTriage && !isLogin ? (
        /* ── Triage-aware hero: mascot + plan framing ── */
        <div className="flex flex-col items-center pt-14 pb-4 px-8 shrink-0">
          <img
            src={mascotPointingImg}
            alt="Mascote"
            className="w-24 h-24 object-contain mb-3"
            style={{ filter: "drop-shadow(0 4px 16px rgba(123,47,247,0.10))" }}
          />
          <h1 className="text-xl font-extrabold text-center leading-tight mb-1" style={{ color: "#1A1A1A" }}>
            Salve seu{" "}
            <span style={{ background: "linear-gradient(135deg, #7B2FF7, #F857A6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              plano personalizado
            </span>
          </h1>
          <p className="text-xs text-center" style={{ color: "#999" }}>
            Seu plano já está pronto. Crie uma conta para não perder seus dados.
          </p>

          {/* Mini plan summary */}
          <p className="text-[11px] font-bold uppercase tracking-wider mt-5 mb-2 self-start" style={{ color: "#BBB" }}>
            Seu plano na prática
          </p>
          <div className="flex flex-col gap-2 w-full">
            {[
              { icon: TrendingDown, title: "Déficit diário ideal para você", value: "1700 kcal", subtitle: "Para perder gordura com consistência", accent: "#7B2FF7" },
              { icon: Dumbbell, title: "Quantidade ideal de proteína diária", value: "112g por dia", subtitle: "Para preservar sua massa muscular", accent: "#F857A6" },
              { icon: Utensils, title: "Dia da sua aplicação semanal", value: "Segunda-feira", subtitle: "Para manter o efeito do tratamento", accent: "#34B89A" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-2xl"
                style={{ background: "#fff", border: "1px solid #F0F0F0" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${item.accent}12` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.accent }} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#AAA" }}>{item.title}</span>
                  <span className="text-base font-extrabold leading-tight" style={{ color: "#1A1A1A" }}>{item.value}</span>
                  <span className="text-[11px] leading-snug mt-0.5" style={{ color: "#999" }}>{item.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Default hero: logo ── */
        <div className="flex flex-col items-center pt-20 pb-6 px-8 shrink-0">
          <img src={logoMounja} alt="Mounjá" className="h-24 w-auto mb-2 object-contain drop-shadow-lg" />
          <h1 className="text-xl font-extrabold text-center mb-1" style={{ color: "#1A1A1A" }}>
            {isLogin ? "Bem-vindo de volta" : "Crie sua conta"}
          </h1>
          <p className="text-sm text-center font-medium" style={{ color: "#999" }}>
            {isLogin ? "Acesse seu plano e acompanhe seu progresso" : "Aqui para caminhar com você."}
          </p>
        </div>
      )}

      {/* Form area */}
      <div className="flex-1 px-6 pb-10">

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl transition-all duration-300 mb-4"
          style={{ background: "#fff", border: "1px solid #E5E5E5", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm font-semibold" style={{ color: "#333" }}>
            {hasTriage && !isLogin ? "Salvar com Google" : "Continuar com Google"}
          </span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
          <span className="text-xs font-medium" style={{ color: "#CCC" }}>ou</span>
          <div className="flex-1 h-px" style={{ background: "#E5E5E5" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#BBB" }} />
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all"
                style={{ background: "#fff", border: "1px solid #E5E5E5" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "#7B2FF7"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(123,47,247,0.08)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#BBB" }} />
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm outline-none transition-all"
              style={{ background: "#fff", border: "1px solid #E5E5E5" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#7B2FF7"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(123,47,247,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.boxShadow = "none"; }}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#BBB" }} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pl-11 pr-12 py-3.5 rounded-2xl text-sm outline-none transition-all"
              style={{ background: "#fff", border: "1px solid #E5E5E5" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "#7B2FF7"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(123,47,247,0.08)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "#E5E5E5"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
              style={{ color: "#BBB" }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isLogin && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs font-semibold ml-1"
              style={{ color: "#7B2FF7" }}
            >
              Esqueci minha senha
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-bold py-4 rounded-[28px] flex items-center justify-center gap-2 text-white active:scale-[0.98] transition-all duration-300 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)",
              boxShadow: "0 4px 16px rgba(123,47,247,0.20)",
            }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? "Entrar" : hasTriage ? "Salvar e acessar meu plano" : "Criar conta"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Microcopy */}
          {!isLogin && hasTriage && (
            <p className="text-[11px] text-center" style={{ color: "#CCC" }}>
              Leva menos de 10 segundos
            </p>
          )}
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "#BBB" }}>
          {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold"
            style={{ color: "#7B2FF7" }}
          >
            {isLogin ? "Cadastre-se" : "Faça login"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
