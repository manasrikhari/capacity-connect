import { notFound, redirect } from "next/navigation";
import { TestDetailManager } from "@/components/admin/TestDetailManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";

export default async function AdminTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!test || test.batchId !== batch.id) notFound();

  return <TestDetailManager test={test} />;
}
