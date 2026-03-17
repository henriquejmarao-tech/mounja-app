import { useAuth } from "@/hooks/useAuth";

export type PlanType = "free" | "premium";

export const usePlan = () => {
  const { profile } = useAuth();

  const selectedPlan = (profile as any)?.selected_plan as string | null;

  // "mensal" and "trimestral" both map to premium
  const planType: PlanType =
    selectedPlan === "mensal" || selectedPlan === "trimestral"
      ? "premium"
      : "free";

  const isPremium = planType === "premium";
  const isFree = planType === "free";

  return { planType, isPremium, isFree, selectedPlan };
};
