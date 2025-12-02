import React, { useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import runOneSignal from "@/pages/utility/runOnesignal";

const PushPermissionGate = () => {
    const userInfo = useSelector((s) => s.auth.user);
  
    const ensureRegister = useCallback(async () => {
      if (!userInfo?._id) return;
      try { await runOneSignal(userInfo._id); } catch {}
    }, [userInfo?._id]);
  
    useEffect(() => {
      if (typeof window === "undefined") return;
  
      let stopped = false;
      let timerId;
  
      const tryInit = async () => {
        if (stopped) return;
        // Wait until OneSignal SDK is available
        if (!window.OneSignal || !window.OneSignal.Notifications) {
          timerId = setTimeout(tryInit, 300);
          return;
        }
  
        // Best-effort register/init (safe to call repeatedly)
        await ensureRegister();
  
        // If permission undecided, trigger the browser's native prompt
        const status = Notification?.permission || "default";
        if (status === "default" && window.OneSignal.Notifications.requestPermission) {
          try {
            await window.OneSignal.Notifications.requestPermission();
          } catch {}
          if (Notification?.permission === "granted") {
            await ensureRegister();
          }
        }
      };
  
      // Start the check loop after window load (helps with defer script)
      const start = () => tryInit();
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start);
  
      return () => {
        stopped = true;
        if (timerId) clearTimeout(timerId);
        window.removeEventListener("load", start);
      };
    }, [ensureRegister]);
  
    return null;
  };
  
  export default PushPermissionGate;