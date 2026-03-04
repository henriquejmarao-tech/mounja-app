import { useNavigate } from "react-router-dom";
import DailyLogForm from "@/components/register/DailyLogForm";

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="px-5 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <h1 className="text-xl font-bold">Registrar</h1>
        <p className="text-sm text-muted-foreground mt-1">Leva menos de 20 segundos. Cada registro conta.</p>
      </header>

      <div data-tutorial="register-form" className="px-5">
        <DailyLogForm />
      </div>
    </div>
  );
};

export default Register;
