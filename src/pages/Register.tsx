import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Syringe, ClipboardList, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import DailyLogForm from "@/components/register/DailyLogForm";
import InjectionForm from "@/components/register/InjectionForm";
import WorkoutForm from "@/components/register/WorkoutForm";

type LogType = "daily" | "workout" | "injection";

const tabs: { value: LogType; label: string; Icon: any }[] = [
  { value: "daily", label: "Dia", Icon: ClipboardList },
  { value: "workout", label: "Treino", Icon: Dumbbell },
  { value: "injection", label: "Aplicação", Icon: Syringe },
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as LogType) || "daily";
  const [logType, setLogType] = useState<LogType>(initialTab);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Voltar</span>
        </button>
        <h1 className="text-xl font-bold">Registrar</h1>
        <p className="text-sm text-muted-foreground mt-1">Rápido e fácil. Leva menos de 20 segundos.</p>
      </header>

      {/* 3-tab selector */}
      <div className="px-5 mb-5">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-1.5 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setLogType(t.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl transition-all duration-300",
                logType === t.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <t.Icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5">
        {logType === "daily" && <DailyLogForm />}
        {logType === "workout" && <WorkoutForm />}
        {logType === "injection" && <InjectionForm />}
      </div>
    </div>
  );
};

export default Register;
