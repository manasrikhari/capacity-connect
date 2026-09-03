import { Grape } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { plumSphere } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/platform", label: "Dashboard" },
  { href: "/platform/competency", label: "Competency" },
  { href: "/platform/skills", label: "Skills" },
  { href: "/platform/announcements", label: "Announcements" },
  { href: "/platform/graph", label: "Knowledge graph" },
  { href: "/verify", label: "Verify" },
];

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-hair bg-paper px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <div
            className="flex size-9 items-center justify-center rounded-full text-paper"
            style={plumSphere}
          >
            <Grape className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-sm font-medium text-ink-900">Capacity Connect</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              Ministry admin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-500 sm:block">
            {session.user.name ?? session.user.email}
          </span>
          <SignOutButton size="sm" />
        </div>
      </header>

      <nav className="border-b border-hair bg-paper px-4 md:px-8">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 py-2 text-sm">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-ink-500 transition-colors hover:text-plum-700"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
