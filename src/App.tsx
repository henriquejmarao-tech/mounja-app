import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ApplicationDataProvider } from "@/hooks/useApplicationData";
import { TutorialProvider } from "@/hooks/useTutorial";
import BottomNav from "./components/BottomNav";
import PwaUpdater from "./components/pwa/PwaUpdater";

// Pages
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Triage from "./pages/Triage";
import Dashboard from "./pages/Dashboard";
import LogPage from "./pages/LogPage";
import MealsPage from "./pages/MealsPage";
import Nutrition from "./pages/Nutrition";
import ProgressPage from "./pages/ProgressPage";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import ManageGroups from "./pages/ManageGroups";
import Application from "./pages/Application";
import RegisterInjection from "./pages/RegisterInjection";
import MyTriage from "./pages/MyTriage";
import Profile from "./pages/Profile";
import DoseHistory from "./pages/DoseHistory";
import HealthInfo from "./pages/HealthInfo";
import RoutinePreferences from "./pages/RoutinePreferences";
import NotFound from "./pages/NotFound";
import Tutorial from "./pages/Tutorial";
import TreatmentPlan from "./pages/TreatmentPlan";
import ProgressDetail from "./pages/ProgressDetail";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const TriageGuard = ({ children }: { children: React.ReactNode }) => {
  const { profile, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (profile && !profile.triage_completed) return <Navigate to="/triagem" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/triagem" element={<ProtectedRoute><Triage /></ProtectedRoute>} />

        <Route path="/" element={<ProtectedRoute><TriageGuard><Dashboard /></TriageGuard></ProtectedRoute>} />
        <Route path="/log" element={<ProtectedRoute><TriageGuard><LogPage /></TriageGuard></ProtectedRoute>} />
        <Route path="/meals" element={<ProtectedRoute><TriageGuard><MealsPage /></TriageGuard></ProtectedRoute>} />
        <Route path="/nutrition" element={<ProtectedRoute><TriageGuard><Nutrition /></TriageGuard></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute><TriageGuard><ProgressPage /></TriageGuard></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><TriageGuard><Settings /></TriageGuard></ProtectedRoute>} />

        {/* Legacy routes redirect to new structure */}
        <Route path="/registrar" element={<Navigate to="/log" replace />} />
        <Route path="/historico" element={<Navigate to="/progress" replace />} />
        <Route path="/configuracoes" element={<Navigate to="/settings" replace />} />
        <Route path="/comunidade" element={<ProtectedRoute><TriageGuard><Community /></TriageGuard></ProtectedRoute>} />
        <Route path="/comunidade/grupos" element={<ProtectedRoute><TriageGuard><ManageGroups /></TriageGuard></ProtectedRoute>} />

        <Route path="/aplicacao" element={<ProtectedRoute><TriageGuard><Application /></TriageGuard></ProtectedRoute>} />
        <Route path="/registrar-aplicacao" element={<ProtectedRoute><TriageGuard><RegisterInjection /></TriageGuard></ProtectedRoute>} />
        <Route path="/minha-triagem" element={<ProtectedRoute><TriageGuard><MyTriage /></TriageGuard></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><TriageGuard><Profile /></TriageGuard></ProtectedRoute>} />
        <Route path="/historico-dose" element={<ProtectedRoute><TriageGuard><DoseHistory /></TriageGuard></ProtectedRoute>} />
        <Route path="/saude" element={<ProtectedRoute><TriageGuard><HealthInfo /></TriageGuard></ProtectedRoute>} />
        <Route path="/rotina" element={<ProtectedRoute><TriageGuard><RoutinePreferences /></TriageGuard></ProtectedRoute>} />
        <Route path="/tutorial" element={<ProtectedRoute><Tutorial /></ProtectedRoute>} />
        <Route path="/plano-tratamento" element={<ProtectedRoute><TriageGuard><TreatmentPlan /></TriageGuard></ProtectedRoute>} />
        <Route path="/progress-detail" element={<ProtectedRoute><TriageGuard><ProgressDetail /></TriageGuard></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PwaUpdater />
      <BrowserRouter>
        <AuthProvider>
          <ApplicationDataProvider>
            <TutorialProvider>
              <div className="max-w-lg mx-auto min-h-screen relative">
                <AppRoutes />
              </div>
            </TutorialProvider>
          </ApplicationDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
