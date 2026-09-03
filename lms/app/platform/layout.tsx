import { Grape } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { plumSphere } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";

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
            <h1 className="font-display text-sm font-medium text-ink-900">OpenGrapes</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              Platform admin
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
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
