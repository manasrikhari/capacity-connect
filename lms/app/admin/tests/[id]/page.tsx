import { Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TestDetailManager } from "@/components/admin/TestDetailManager";
import { buttonClasses } from "@/components/ui/Button";
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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link href={`/admin/tests/${id}/generate`} className={buttonClasses("secondary", "sm")}>
          <Sparkles className="size-4" /> Generate with AI
        </Link>
      </div>
      <TestDetailManager test={test} />
    </div>
  );
}
