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
    if (!user) {
      setState({ isPremium: false, source: null, plan: "free", status: "free", subscriptionEnd: null, promoCode: null });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setState({
        isPremium: data?.isPremium ?? false,
        source: data?.source ?? null,
        plan: data?.plan ?? "free",
        status: data?.status ?? "free",
        subscriptionEnd: data?.subscription_end ?? null,
        promoCode: data?.promo_code ?? null,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      // Don't reset to free on error — keep last known state
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    checkSubscription();

    // Poll every 60 seconds
    intervalRef.current = setInterval(checkSubscription, 60000);
    return () => clearInterval(intervalRef.current);
  }, [checkSubscription, authLoading]);

  return {
    ...state,
    isFree: !state.isPremium,
    loading: authLoading || loading,
    refresh: checkSubscription,
  };
};
