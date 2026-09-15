"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (Phase 6, offline). Only in production — a dev
 * service worker fights Next's HMR. Renders nothing.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[pwa] service worker registration failed", err);
      });
    };

    // Hydration usually finishes *after* `load` has already fired, and a
    // listener added then never runs — so register straight away in that case
    // and only wait for the event when the document is still loading.
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
