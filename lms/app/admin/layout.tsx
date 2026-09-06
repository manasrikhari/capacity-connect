import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { MobileSidebar, Sidebar } from "@/components/layout/Sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const batch = await getActiveBatch(session);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="admin"
        subtitle="Trainer panel"
        batchName={batch?.name}
        joinCode={batch?.joinCode}
        userName={session.user.name}
        userEmail={session.user.email}
        slot={<NotificationBell />}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSidebar
          variant="admin"
          subtitle="Trainer panel"
          batchName={batch?.name}
          joinCode={batch?.joinCode}
          userName={session.user.name}
          userEmail={session.user.email}
          slot={<NotificationBell />}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
