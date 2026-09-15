import { Library } from "lucide-react";
import { redirect } from "next/navigation";
import { LibraryFilters } from "@/components/library/LibraryFilters";
import {
  LibraryItemCard,
  type LibraryItemView,
} from "@/components/library/LibraryItemCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { LIBRARY_ITEM_TYPES } from "@/lib/validations/library";
import type { LibraryItemType } from "@/app/generated/prisma/enums";

const TYPE_SET = new Set<string>(LIBRARY_ITEM_TYPES);

export default async function StudentLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; subject?: string; skill?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const params = await searchParams;
  const typeFilter = params.type && TYPE_SET.has(params.type) ? (params.type as LibraryItemType) : undefined;
  const subjectFilter = params.subject || undefined;
  const skillFilter = params.skill || undefined;

  // Full set (for building filter options) + filtered set (for display).
  const [all, filtered] = await Promise.all([
    prisma.libraryItem.findMany({
      where: { batchId: batch.id },
      select: { subject: true, skillId: true, skill: { select: { id: true, name: true } } },
    }),
    prisma.libraryItem.findMany({
      where: {
        batchId: batch.id,
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(subjectFilter ? { subject: subjectFilter } : {}),
        ...(skillFilter ? { skillId: skillFilter } : {}),
      },
      include: { skill: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const subjects = Array.from(
    new Set(all.map((i) => i.subject).filter((s): s is string => !!s))
  ).sort();

  const skillMap = new Map<string, string>();
  for (const i of all) {
    if (i.skill) skillMap.set(i.skill.id, i.skill.name);
  }
  const skills = Array.from(skillMap, ([id, name]) => ({ id, name })).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const views: LibraryItemView[] = filtered.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    type: i.type,
    subject: i.subject,
    skillId: i.skillId,
    skillName: i.skill?.name ?? null,
    fileUrl: i.fileUrl,
    mimeType: i.mimeType,
    fileSizeBytes: i.fileSizeBytes,
    durationMins: i.durationMins,
  }));

  const hasAny = all.length > 0;
  const hasFilters = !!(typeFilter || subjectFilter || skillFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Library</h1>
        <p className="mt-1 text-sm text-ink-500">
          Recorded lectures, slides and study material for your course.
        </p>
      </div>

      {hasAny && (
        <LibraryFilters
          subjects={subjects}
          skills={skills}
          active={{ type: typeFilter, subject: subjectFilter, skill: skillFilter }}
        />
      )}

      {views.length === 0 ? (
        <EmptyState
          icon={Library}
          title={hasFilters ? "Nothing matches these filters" : "No resources yet"}
          description={
            hasFilters
              ? "Try clearing a filter to see more."
              : "Your trainer hasn't shared any library resources."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {views.map((item) => (
            <LibraryItemCard key={item.id} item={item} href={`/student/library/${item.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
