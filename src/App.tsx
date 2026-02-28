import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Nutrition from "./pages/Nutrition";
import Workouts from "./pages/Workouts";
import Application from "./pages/Application";
import Profile from "./pages/Profile";
import HealthHistory from "./pages/HealthHistory";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="max-w-lg mx-auto min-h-screen relative">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/nutricao" element={<Nutrition />} />
            <Route path="/treinos" element={<Workouts />} />
            <Route path="/aplicacao" element={<Application />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/historico-saude" element={<HealthHistory />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
