import { redirect } from "next/navigation";
import { NoticesManager } from "@/components/admin/NoticesManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";

export default async function AdminNoticesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const notices = await prisma.notice.findMany({
    where: { batchId: batch.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, text: true, createdAt: true },
  });

  return <NoticesManager notices={notices} />;
}
