import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

const PwaUpdater = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
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
