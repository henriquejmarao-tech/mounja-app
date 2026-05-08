import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type PlanSource = "stripe" | "promo" | null;

interface PlanState {
  isPremium: boolean;
  isFree: boolean;
  source: PlanSource;
  plan: string;
  status: string;
  subscriptionEnd: string | null;
  promoCode: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const usePlan = (): PlanState => {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<Omit<PlanState, "loading" | "refresh" | "isFree">>({
    isPremium: false,
    source: null,
    plan: "free",
    status: "free",
    subscriptionEnd: null,
    promoCode: null,
  });
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const checkSubscription = useCallback(async () => {
    setState({
      isPremium: true,
      source: null,
      plan: "premium",
      status: "active",
      subscriptionEnd: null,
      promoCode: null,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  return {
    ...state,
    isFree: !state.isPremium,
    loading: authLoading || loading,
    refresh: checkSubscription,
  };
};
