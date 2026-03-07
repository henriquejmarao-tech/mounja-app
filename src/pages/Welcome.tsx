import { useNavigate } from "react-router-dom";
import { ArrowRight, Leaf } from "lucide-react";
import logoImg from "@/assets/logo-mounja.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      {/* Hero brand area */}
      <div className="relative overflow-hidden flex flex-col items-center justify-center flex-1 px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-accent/25 to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-secondary/10 blur-2xl" />

        <div className="absolute top-12 left-6 opacity-15">
          <Leaf className="w-8 h-8 text-primary rotate-[-30deg]" />
        </div>
        <div className="absolute top-20 right-8 opacity-10">
          <Leaf className="w-6 h-6 text-primary rotate-[45deg]" />
        </div>

        <div className="relative flex flex-col items-center">
          <img src={logoImg} alt="Mounjá" className="h-36 w-auto mb-4 object-contain drop-shadow-lg" />
          <p className="text-base text-muted-foreground italic font-medium tracking-wide">
            Aqui para caminhar com você.
          </p>
        </div>
      </div>

      {/* Action buttons — always visible */}
      <div className="px-6 pb-10 pt-4 space-y-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 2.5rem)" }}>
        <button
          onClick={() => navigate("/triagem")}
          className="w-full gradient-hero text-primary-foreground font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated hover:shadow-glow active:scale-[0.98] transition-all duration-300 text-base"
        >
          Primeiro uso
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate("/auth")}
          className="w-full py-4 rounded-2xl border-2 border-primary/20 bg-card text-foreground font-semibold text-base hover:bg-accent transition-all duration-300 active:scale-[0.98]"
        >
          Já tenho conta
        </button>
      </div>
    </div>
  );
};

export default Welcome;
