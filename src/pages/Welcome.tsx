import { useNavigate } from "react-router-dom";
import logoWelcome from "@/assets/logo-welcome.png";
const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col px-6" style={{ paddingTop: "env(safe-area-inset-top, 1.5rem)", paddingBottom: "env(safe-area-inset-bottom, 1.5rem)" }}>
      {/* Top spacer for balance */}
      <div className="flex-[0.5]" />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-[2] space-y-5">
        <img 
          src={logoWelcome} 
          alt="Mounjá Logo" 
          className="w-72 h-72 object-contain drop-shadow-xl" 
        />
        
        <p className="text-center text-muted-foreground text-[17px] px-2 font-medium leading-relaxed max-w-[320px]">
          Apoio a sua jornada de emagrecimento de um jeito único, assim como você.
        </p>
      </div>

      {/* Bottom spacer */}
      <div className="flex-[1]" />

      {/* Action buttons */}
      <div className="w-full space-y-3 pb-8 mt-auto">
        <button
          onClick={() => navigate("/triagem")}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-full shadow-md hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] text-lg"
        >
          Primeiro uso
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="w-full py-4 bg-transparent text-primary font-semibold text-lg hover:bg-primary/5 transition-all duration-300 active:scale-[0.98] rounded-full"
        >
          Já tenho conta
        </button>
      </div>
    </div>
  );
};

export default Welcome;
