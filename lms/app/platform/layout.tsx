import { Grape } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { auth } from "@/lib/auth";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-violet-100 bg-white/70 px-4 py-3 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            <Grape className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-violet-700">OpenGrapes</h1>
            <p className="text-xs text-slate-500">Platform admin</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:block">
            {session.user.name ?? session.user.email}
          </span>
          <SignOutButton size="sm" />
        </div>
      </header>
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
