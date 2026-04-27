import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

const RELOAD_FLAG = "mounja-sw-reload-once";

const reloadOnceForUpdate = () => {
  if (sessionStorage.getItem(RELOAD_FLAG) === "1") return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
};

const PwaUpdater = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;

      sessionStorage.removeItem(RELOAD_FLAG);

      const checkForUpdate = () => registration.update().catch((error) => console.error("SW update check error:", error));
      const intervalId = window.setInterval(checkForUpdate, 60 * 1000);

      checkForUpdate();

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") checkForUpdate();
      });

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "activated" && navigator.serviceWorker.controller) {
            reloadOnceForUpdate();
          }
        });
      });

      navigator.serviceWorker.addEventListener("controllerchange", reloadOnceForUpdate);

      return () => window.clearInterval(intervalId);
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      // Auto-update silently
      updateServiceWorker(true);
      toast.info("App atualizado!", { duration: 2000 });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
};

export default PwaUpdater;
