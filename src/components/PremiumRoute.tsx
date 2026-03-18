import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";

interface PremiumRouteProps {
  children: ReactNode;
  fallback?: string;
}

/**
 * Route-level premium gate.
 * Redirects free users to /planos (or custom fallback).
 * Shows loading spinner while checking subscription.
 */
const PremiumRoute = ({ children, fallback = "/planos" }: PremiumRouteProps) => {
  const { isPremium, loading } = usePlan();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPremium) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default PremiumRoute;
