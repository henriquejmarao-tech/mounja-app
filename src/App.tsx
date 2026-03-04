import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ApplicationDataProvider } from "@/hooks/useApplicationData";
import { TutorialProvider } from "@/hooks/useTutorial";
import BottomNav from "./components/BottomNav";
import TutorialOverlay from "./components/tutorial/TutorialOverlay";
import TutorialStartDialog from "./components/tutorial/TutorialStartDialog";
import InstallPrompt from "./components/pwa/InstallPrompt";
import PwaUpdater from "./components/pwa/PwaUpdater";

// Pages
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Triage from "./pages/Triage";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import History from "./pages/History";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import Workouts from "./pages/Workouts";
import Application from "./pages/Application";
import MyTriage from "./pages/MyTriage";
import Profile from "./pages/Profile";
import DoseHistory from "./pages/DoseHistory";
import HealthInfo from "./pages/HealthInfo";
import RoutinePreferences from "./pages/RoutinePreferences";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
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
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
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
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected */}
        <Route path="/triagem" element={<ProtectedRoute><Triage /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><TriageGuard><Dashboard /></TriageGuard></ProtectedRoute>} />
        <Route path="/registrar" element={<ProtectedRoute><TriageGuard><Register /></TriageGuard></ProtectedRoute>} />
        <Route path="/historico" element={<ProtectedRoute><TriageGuard><History /></TriageGuard></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><TriageGuard><Insights /></TriageGuard></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><TriageGuard><Settings /></TriageGuard></ProtectedRoute>} />
        <Route path="/comunidade" element={<ProtectedRoute><TriageGuard><Community /></TriageGuard></ProtectedRoute>} />
        <Route path="/treinos" element={<ProtectedRoute><TriageGuard><Workouts /></TriageGuard></ProtectedRoute>} />
        <Route path="/aplicacao" element={<ProtectedRoute><TriageGuard><Application /></TriageGuard></ProtectedRoute>} />
        <Route path="/minha-triagem" element={<ProtectedRoute><TriageGuard><MyTriage /></TriageGuard></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><TriageGuard><Profile /></TriageGuard></ProtectedRoute>} />
        <Route path="/historico-dose" element={<ProtectedRoute><TriageGuard><DoseHistory /></TriageGuard></ProtectedRoute>} />
        <Route path="/saude" element={<ProtectedRoute><TriageGuard><HealthInfo /></TriageGuard></ProtectedRoute>} />
        <Route path="/rotina" element={<ProtectedRoute><TriageGuard><RoutinePreferences /></TriageGuard></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
      <TutorialOverlay />
      <TutorialStartDialog />
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
                <InstallPrompt />
              </div>
            </TutorialProvider>
          </ApplicationDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
