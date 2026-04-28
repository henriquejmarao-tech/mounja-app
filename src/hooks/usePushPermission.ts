import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const FALLBACK_VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const usePushPermission = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [askedAt, setAskedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getVapidPublicKey = useCallback(async () => {
    const { data } = await supabase.functions.invoke("send-dose-reminders", {
      body: { action: "vapid-public-key" },
    });
    return (data as { publicKey?: string } | null)?.publicKey || FALLBACK_VAPID_PUBLIC_KEY;
  }, []);

  const syncPushSubscription = useCallback(async () => {
    if (!user || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;

    const vapidPublicKey = await getVapidPublicKey();
    if (!vapidPublicKey) return false;

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await supabase.from("push_subscriptions" as any).update({ active: false } as any).eq("endpoint", existing.endpoint);
      await existing.unsubscribe();
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const json = subscription.toJSON();

    await supabase.from("push_subscriptions" as any).upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
      user_agent: navigator.userAgent,
      last_used_at: new Date().toISOString(),
      active: true,
    } as any, { onConflict: "user_id,endpoint" });

    return true;
  }, [getVapidPublicKey, user]);

  useEffect(() => {
    if (!user || !("Notification" in window) || Notification.permission !== "granted") return;
    syncPushSubscription().catch((error) => console.error("[push] subscription sync failed", error));
  }, [syncPushSubscription, user]);

  useEffect(() => {
    setAskedAt((profile as any)?.push_permission_asked_at ?? null);
  }, [profile]);

  const markAsked = useCallback(async () => {
    if (!user) return;
    const now = new Date().toISOString();
    setAskedAt(now);
    await supabase.from("profiles").update({ push_permission_asked_at: now } as any).eq("id", user.id);
    await refreshProfile();
  }, [refreshProfile, user]);

  const askPermission = useCallback(async () => {
    if (!user || loading) return "default" as NotificationPermission;
    setLoading(true);

    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        await markAsked();
        return "denied" as NotificationPermission;
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const synced = await syncPushSubscription();
        if (!synced) {
          await markAsked();
          return "denied" as NotificationPermission;
        }
      }

      await markAsked();
      return permission;
    } finally {
      setLoading(false);
    }
  }, [loading, markAsked, syncPushSubscription, user]);

  return {
    askedAt,
    hasAsked: !!askedAt,
    loading,
    askPermission,
    markAsked,
  };
};