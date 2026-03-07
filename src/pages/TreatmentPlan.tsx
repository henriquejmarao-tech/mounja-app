import { ChevronLeft, ChevronRight, Pill, Pen, Syringe, Bell, Scale, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TreatmentPlan = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="px-6 pt-safe">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mt-4 mb-4 active:scale-90 transition-transform"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Plano de Tratamento</h1>

        <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
          {[
            { icon: Pill, label: "Medicamento", action: () => navigate("/registrar-aplicacao") },
            { icon: Pen, label: "Dosagem", action: () => navigate("/registrar-aplicacao") },
            { icon: Syringe, label: "Local de aplicação", action: () => navigate("/registrar-aplicacao") },
            { icon: Bell, label: "Agenda", action: () => navigate("/aplicacao") },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-base font-medium text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50 mt-4">
          {[
            { icon: Scale, label: "Alterar peso inicial" },
            { icon: Flag, label: "Alterar peso meta" },
          ].map((item, i) => (
            <button
              key={i}
              className="w-full flex items-center justify-between px-5 py-4 active:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-base font-medium text-foreground">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlan;
