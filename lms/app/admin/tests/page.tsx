import { redirect } from "next/navigation";
import { TestsManager } from "@/components/admin/TestsManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";

export default async function AdminTestsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const tests = await prisma.test.findMany({
    where: { batchId: batch.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return <TestsManager tests={tests} />;
}
