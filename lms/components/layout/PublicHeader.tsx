import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { GovBanner } from "@/components/layout/GovBanner";
import { plumSphere } from "@/components/ui/avatar";
import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n-server";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";

/** Where each role's shell lives, so a signed-in visitor lands back inside it. */
const HUB_BY_ROLE: Record<string, string> = {
  SUPER_ADMIN: "/platform",
  ADMIN: "/admin",
  STUDENT: "/student",
};

/**
 * Chrome for the pages that sit OUTSIDE the role shells — /verify and
 * /announcements are reachable by anyone, including a QR scan with no browser
 * history, so they cannot use `Sidebar` (which needs a session and a role).
 * The back link is session-aware: signed-in visitors return to their own
 * dashboard, everyone else to the public landing page.
 */
export async function PublicHeader({ right }: { right?: ReactNode }) {
  const session = await getSession();
  const locale = await getLocale();
  const hub = session ? HUB_BY_ROLE[session.user.role] : undefined;

  return (
    <>
      <GovBanner />
      <header className="sticky top-0 z-50 border-b border-hair bg-paper/90 backdrop-blur reduce-transparency:bg-paper reduce-transparency:backdrop-blur-none">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link
          href={hub ?? "/"}
          className="group inline-flex min-w-0 items-center gap-2.5 rounded-[10px]"
        >
          <span
            aria-hidden="true"
            className="block size-8 shrink-0 rounded-full"
            style={plumSphere}
          />
          <span className="min-w-0">
            <span className="block truncate font-display text-[15px] font-medium text-ink-900">
              Capacity Connect
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300 transition-colors group-hover:text-plum-700">
              <ArrowLeft className="size-3" />
              {hub ? "Back to dashboard" : "Back to home"}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          {right}
          <LanguageToggle current={locale} />
        </div>
      </div>
    </header>
    </>
  );
}
