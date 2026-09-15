import { redirect } from "next/navigation";
import { type BoardItem, WeekBoard } from "@/components/course/WeekBoard";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminWeeksPage() {
  const session = await requireAdmin();
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const [weeks, libraryItems, notes, tests, assignments] = await Promise.all([
    prisma.courseWeek.findMany({
      where: { batchId: batch.id },
      orderBy: { index: "asc" },
      select: {
        id: true,
        index: true,
        title: true,
        summary: true,
        opensAt: true,
        _count: { select: { libraryItems: true, notes: true, tests: true, assignments: true } },
      },
    }),
    prisma.libraryItem.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, weekId: true },
    }),
    prisma.note.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, weekId: true },
    }),
    prisma.test.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, weekId: true },
    }),
    prisma.assignment.findMany({
      where: { batchId: batch.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, weekId: true },
    }),
  ]);

  const items: BoardItem[] = [
    ...notes.map((n) => ({ kind: "NOTE" as const, ...n })),
    ...libraryItems.map((l) => ({ kind: "LIBRARY" as const, ...l })),
    ...tests.map((t) => ({ kind: "TEST" as const, ...t })),
    ...assignments.map((a) => ({ kind: "ASSIGNMENT" as const, ...a })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Weeks</h1>
        <p className="mt-1 text-sm text-ink-500">
          Structure {batch.name} the way SWAYAM does — one week at a time, each holding its own
          recordings, readings and assessments. This is exactly what trainees see under Course plan.
          Weeks are never locked; the release date is shown as guidance.
        </p>
      </div>

      <WeekBoard
        weeks={weeks.map((w) => ({
          id: w.id,
          index: w.index,
          title: w.title,
          summary: w.summary,
          opensAt: w.opensAt,
        }))}
        items={items}
      />
    </div>
  );
}
