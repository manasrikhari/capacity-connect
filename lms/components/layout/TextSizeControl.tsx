"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Text-size control, as required of Indian government sites by the Guidelines
 * for Indian Government Websites (GIGW).
 *
 * Scales the root font size, so every `rem`-based measurement in the app
 * follows. Persisted per browser; every storage access is guarded because a
 * private window or blocked site data makes it throw.
 */
const STEPS = [100, 112.5, 125] as const;
const KEY = "cc-text-scale";

export function TextSizeControl() {
  const [index, setIndex] = useState(0);

  // Restore on mount rather than during render: the server has no localStorage,
  // so reading it while rendering would produce a hydration mismatch.
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(KEY));
      const found = STEPS.findIndex((s) => s === saved);
      if (found > 0) setIndex(found);
    } catch {
      /* storage unavailable — keep the default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = index === 0 ? "" : `${STEPS[index]}%`;
    try {
      localStorage.setItem(KEY, String(STEPS[index]));
    } catch {
      /* storage unavailable — the setting just won't persist */
    }
  }, [index]);

  const btn =
    "inline-flex size-7 items-center justify-center rounded-[6px] text-ink-500 transition-colors hover:bg-sunken hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Text size">
      <button
        type="button"
        className={btn}
        onClick={() => setIndex((i) => Math.max(0, i - 1))}
        disabled={index === 0}
        aria-label="Decrease text size"
      >
        <span className="text-[13px] leading-none">A−</span>
      </button>
      <button
        type="button"
        className={cn(btn, "text-[11px]")}
        onClick={() => setIndex(0)}
        aria-label="Reset text size"
      >
        A
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => setIndex((i) => Math.min(STEPS.length - 1, i + 1))}
        disabled={index === STEPS.length - 1}
        aria-label="Increase text size"
      >
        <span className="text-[16px] leading-none">A+</span>
      </button>
    </div>
  );
}
