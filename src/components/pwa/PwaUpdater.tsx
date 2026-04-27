import { useEffect } from "react";

const RELOAD_FLAG = "mounja-sw-reload-once";

const reloadOnceForUpdate = () => {
  if (sessionStorage.getItem(RELOAD_FLAG) === "1") return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  window.location.reload();
};

const PwaUpdater = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    let intervalId: number | undefined;

    const watchForActivatedUpdate = (worker: ServiceWorker | null) => {
      if (!worker) return;

      worker.addEventListener("statechange", () => {
        if (worker.state === "activated" && navigator.serviceWorker.controller) {
          reloadOnceForUpdate();
        }
      });
    };

    const checkForUpdate = () =>
      registration?.update().catch((error) => console.error("SW update check error:", error));

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    const handleControllerChange = () => reloadOnceForUpdate();

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registered) => {
        registration = registered;
        sessionStorage.removeItem(RELOAD_FLAG);

        registration.addEventListener("updatefound", () => watchForActivatedUpdate(registration?.installing ?? null));
        document.addEventListener("visibilitychange", handleVisibilityChange);
        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

        checkForUpdate();
        intervalId = window.setInterval(checkForUpdate, 60 * 1000);
      })
      .catch((error) => console.error("SW registration error:", error));

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
};

export default PwaUpdater;
