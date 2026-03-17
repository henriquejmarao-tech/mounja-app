import { useNavigate } from "react-router-dom";
import logoWelcome from "@/assets/logo-welcome.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col px-6" style={{ paddingTop: "env(safe-area-inset-top, 1.5rem)", paddingBottom: "env(safe-area-inset-bottom, 1.5rem)" }}>
      <div className="flex-[0.3]" />

      <div className="flex flex-col items-center justify-center flex-[2] gap-3">
        <div className="relative">
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(123,47,247,0.06) 0%, rgba(248,87,166,0.04) 50%, transparent 70%)",
              filter: "blur(30px)",
              transform: "scale(1.3)",
            }}
          />
          <img
            src={logoWelcome}
            alt="Mounjá Logo"
            className="w-[26rem] h-[26rem] object-contain relative z-10"
            style={{ animation: "logoPulse 3s ease-in-out infinite" }}
          />
        </div>

        <h1 className="text-xl font-extrabold text-foreground text-center leading-tight max-w-[300px] -mt-2">
          Seu plano de emagrecimento, feito para você
        </h1>
        <p className="text-center text-sm max-w-[280px]" style={{ color: "#999" }}>
          Baseado no seu perfil, rotina e objetivos reais
        </p>
      </div>

      <div className="flex-[0.6]" />

      <div className="w-full space-y-3 pb-8 mt-auto">
        <button
          onClick={() => navigate("/triagem")}
          className="w-full text-primary-foreground font-bold py-4 rounded-full shadow-elevated hover:opacity-90 transition-all duration-300 active:scale-[0.98] text-lg"
          style={{ background: "linear-gradient(135deg, #7B2FF7 0%, #F857A6 100%)" }}
        >
          Montar meu plano
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="w-full py-4 rounded-full font-semibold text-base transition-all duration-300 active:scale-[0.98]"
          style={{ background: "#fff", border: "1.5px solid #E5E5E5", color: "#555" }}
        >
          Entrar
        </button>
      </div>

      <style>{`
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 4px 20px rgba(123,47,247,0.08)); }
          50% { transform: scale(1.02); filter: drop-shadow(0 6px 28px rgba(123,47,247,0.12)); }
        }
      `}</style>
    </div>
  );
};

export default Welcome;
