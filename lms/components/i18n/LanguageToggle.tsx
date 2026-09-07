"use client";

import { Languages } from "lucide-react";
import { useTransition } from "react";
import { LOCALES, LOCALE_LABEL, LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/**
 * A tiny English/हिन्दी switch. Writes the locale cookie and reloads so the
 * server re-renders every string (and `<html lang>`) for the chosen language.
 * Cookie-based rather than a URL segment so it works on every route without
 * restructuring the whole app under `/[locale]`.
 */
export function LanguageToggle({ current }: { current: Locale }) {
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    startTransition(() => window.location.reload());
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-hair bg-paper p-0.5"
      role="group"
      aria-label="Language"
    >
      <Languages className="ml-1.5 size-3.5 text-ink-300" aria-hidden="true" />
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => choose(locale)}
          disabled={pending}
          aria-pressed={current === locale}
          className={
            current === locale
              ? "rounded-full bg-plum-600 px-2.5 py-1 text-xs font-medium text-paper"
              : "rounded-full px-2.5 py-1 text-xs text-ink-500 hover:text-ink-900 disabled:opacity-60"
          }
          lang={locale}
        >
          {LOCALE_LABEL[locale]}
        </button>
      ))}
    </div>
  );
}
