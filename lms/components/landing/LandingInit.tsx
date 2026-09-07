"use client";

import { useEffect } from "react";
import { mainScript } from "./scripts/main";

// Module-scoped so it survives a React StrictMode remount (and client-side
// navigations back to the landing). Without this, the effect runs twice in dev
// and injects `mainScript` — which declares a top-level `const hdr` in the
// shared classic-script scope — a second time, throwing "Identifier 'hdr' has
// already been declared". Injecting exactly once avoids the redeclaration.
let landingScriptsInjected = false;

export function LandingInit() {
  useEffect(() => {
    if (landingScriptsInjected) return;
    landingScriptsInjected = true;

    const lucide = document.createElement("script");
    lucide.src = "/og-landing/c11c6e72-1b9f-4ccc-aa73-0c8bbc246203.js";
    lucide.onload = () => {
      const s1 = document.createElement("script");
      s1.textContent = mainScript;
      document.body.appendChild(s1);
    };
    document.head.appendChild(lucide);
  }, []);

  return null;
}
