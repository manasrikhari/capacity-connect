import type { ReactNode } from "react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GOV } from "@/lib/gigw";

/**
 * Shared shell for the statutory GIGW pages (terms, privacy, copyright,
 * hyperlinking, help). Gives them the national masthead, a consistent reading
 * column, a "last reviewed" line and the GIGW footer, so each route file only
 * holds its own prose.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main id="main-content" tabIndex={-1} className="flex-1 bg-page">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
            {GOV.ministry} · {GOV.department}
          </p>
          <h1 className="mt-2 font-display text-4xl font-normal text-ink-900">{title}</h1>
          {intro ? <div className="mt-6 text-ink-700">{intro}</div> : null}

          <div className="mt-6 space-y-6 text-ink-700 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-ink-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
            {children}
          </div>

          <p className="mt-10 border-t border-hair pt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-300">
            Last reviewed: {GOV.lastReviewed}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
