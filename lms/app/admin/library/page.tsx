import { redirect } from "next/navigation";
import { LibraryList } from "@/components/library/LibraryList";
import type { LibraryItemView } from "@/components/library/LibraryItemCard";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function AdminLibraryPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const [items, skills] = await Promise.all([
    prisma.libraryItem.findMany({
      where: { batchId: batch.id },
      include: { skill: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.skill.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const views: LibraryItemView[] = items.map((i) => ({
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
    isPublic: i.isPublic,
  }));

  return <LibraryList items={views} batchId={batch.id} skills={skills} />;
}
