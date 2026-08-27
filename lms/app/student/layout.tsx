import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { MobileSidebar, Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    redirect("/");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/blocked");
  }

  const batch = await getActiveStudentBatch(session);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="student"
        subtitle="Student"
        batchName={batch?.name}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileSidebar
          variant="student"
          subtitle="Student"
          batchName={batch?.name}
          userName={session.user.name}
          userEmail={session.user.email}
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
