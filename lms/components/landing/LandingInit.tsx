"use client";

import { useEffect } from "react";
import { mainScript } from "./scripts/main";

export function LandingInit() {
  useEffect(() => {
    const lucide = document.createElement("script");
    lucide.src = "/og-landing/c11c6e72-1b9f-4ccc-aa73-0c8bbc246203.js";
    lucide.onload = () => {
      const s1 = document.createElement("script");
      s1.textContent = mainScript;
      document.body.appendChild(s1);
    };
    document.head.appendChild(lucide);

    return () => {
      if (lucide.parentNode) lucide.parentNode.removeChild(lucide);
    };
  }, []);

  return null;
}
