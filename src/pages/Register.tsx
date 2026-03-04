import { useNavigate } from "react-router-dom";
import DailyLogForm from "@/components/register/DailyLogForm";

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-nav">
      <div className="pt-safe" />

      <div data-tutorial="register-form" className="px-5">
        <DailyLogForm />
      </div>
    </div>
  );
};

export default Register;
