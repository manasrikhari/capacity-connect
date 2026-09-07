import { redirect } from "next/navigation";
import { DrillManager } from "@/components/admin/DrillManager";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";

export default async function AdminDrillPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const batch = await getActiveBatch(session);
  if (!batch) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8">
        <p className="text-sm text-ink-500">Create or select a course to author forecast drill cases.</p>
      </div>
    );
  }

  const cases = await prisma.weatherCase.findMany({
    where: { batchId: batch.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      hazard: true,
      region: true,
      correctColour: true,
      _count: { select: { attempts: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <DrillManager
        cases={cases.map((c) => ({
          id: c.id,
          title: c.title,
          hazard: c.hazard,
          region: c.region,
          correctColour: c.correctColour,
          attemptCount: c._count.attempts,
        }))}
      />
    </div>
  );
}
