import { useNavigate } from "react-router-dom";
import DailyLogForm from "@/components/register/DailyLogForm";

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="pt-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }} />

      <div data-tutorial="register-form" className="px-5">
        <DailyLogForm />
      </div>
    </div>
  );
};

export default Register;
