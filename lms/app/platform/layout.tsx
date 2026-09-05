import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { MobileSidebar, Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/session";

/**
 * The ministry admin shell. Uses the same Sidebar as the trainer and trainee
 * shells (variant "platform") so all three roles share one navigation
 * language; it has no batch workspace, so it stays on the hub view.
 */
export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="platform"
        subtitle="Ministry admin"
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSidebar
          variant="platform"
          subtitle="Ministry admin"
          userName={session.user.name}
          userEmail={session.user.email}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
