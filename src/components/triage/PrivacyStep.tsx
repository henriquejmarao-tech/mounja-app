import { ShieldCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrivacyStepProps {
  accepted: boolean;
  onToggle: () => void;
}

const PrivacyStep = ({ accepted, onToggle }: PrivacyStepProps) => {
  return (
    <div className="flex-1 flex flex-col px-7 pt-2">
      {/* Icon with subtle glow */}
      <div className="flex flex-col items-center mb-6 relative">
        <div
          className="absolute pointer-events-none"
          style={{
            width: 180,
            height: 180,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, hsl(15 75% 75% / 0.08) 0%, hsl(340 65% 62% / 0.05) 50%, transparent 80%)",
            filter: "blur(30px)",
          }}
        />
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center relative"
          style={{
            background: "linear-gradient(135deg, hsl(15 75% 75%), hsl(340 65% 62%), hsl(295 55% 42%))",
          }}
        >
          <ShieldCheck className="w-10 h-10 text-primary-foreground" strokeWidth={1.8} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-[1.6rem] font-extrabold text-foreground text-center tracking-tight leading-tight mb-5 font-display">
        Saúde com privacidade
      </h1>

      {/* Body text */}
      <div className="space-y-4 mb-6 max-w-[340px] mx-auto">
        <p className="text-muted-foreground text-[0.9rem] leading-[1.7]">
          O Mounjá existe para te ajudar a acompanhar e entender seu progresso, não para fornecer aconselhamento médico.
        </p>
        <p className="text-muted-foreground text-[0.9rem] leading-[1.7]">
          Seus dados são tratados com total segurança, seguindo todas as normas da{" "}
          <span className="font-bold text-foreground">LGPD (Lei Geral de Proteção de Dados)</span>.
          {" "}Não vendemos seus dados e você pode solicitar a exclusão a qualquer momento.
        </p>
        <p className="text-muted-foreground text-[0.9rem] leading-[1.7]">
          Ao usar o Mounjá, você consente com a coleta e uso das suas informações de saúde exclusivamente para melhorar sua experiência no aplicativo.
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Consent checkbox */}
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center gap-3 w-full rounded-2xl px-4 py-4 mb-4 transition-all duration-200 cursor-pointer select-none border",
          accepted
            ? "border-primary/30 bg-primary/5"
            : "border-border bg-card"
        )}
      >
        <div
          className={cn(
            "w-6 h-6 min-w-6 rounded-lg flex items-center justify-center transition-all duration-200",
            accepted ? "shadow-sm" : "border-2 border-muted-foreground/30"
          )}
          style={
            accepted
              ? { background: "linear-gradient(135deg, hsl(15 75% 75%), hsl(340 65% 62%), hsl(295 55% 42%))" }
              : undefined
          }
        >
          {accepted && <Check className="w-4 h-4 text-primary-foreground" strokeWidth={3} />}
        </div>
        <span className="text-xs text-muted-foreground leading-relaxed text-left">
          Concordo com a coleta das minhas informações de saúde conforme as normas da LGPD.
        </span>
      </button>
    </div>
  );
};

export default PrivacyStep;
