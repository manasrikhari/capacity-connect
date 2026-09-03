import { ArrowLeft, Clock, HardDrive } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  TYPE_META,
  formatBytes,
  formatDuration,
} from "@/components/library/LibraryItemCard";
import { MediaViewer } from "@/components/library/MediaViewer";
import { Badge } from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function StudentLibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const { id } = await params;

  const item = await prisma.libraryItem.findUnique({
    where: { id },
    include: { skill: { select: { name: true } } },
  });
  if (!item) notFound();

  // Must have an APPROVED enrollment in the item's batch.
  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId: item.batchId } },
    select: { status: true },
  });
  if (enrollment?.status !== "APPROVED") notFound();

  const meta = TYPE_META[item.type];
  const size = formatBytes(item.fileSizeBytes);
  const duration = formatDuration(item.durationMins);

  return (
    <div className="space-y-6">
      <Link
        href="/student/library"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="size-4" />
        Back to library
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge color={meta.color}>{meta.label}</Badge>
          {item.subject && <span className="text-sm text-ink-500">{item.subject}</span>}
          {item.skill?.name && <Badge color="slate">{item.skill.name}</Badge>}
        </div>
        <h1 className="text-2xl font-medium text-ink-900">{item.title}</h1>
        {item.description && <p className="max-w-2xl text-sm text-ink-500">{item.description}</p>}
        {(duration || size) && (
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {duration && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                <Clock aria-hidden="true" className="size-3" />
                {duration}
              </span>
            )}
            {size && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                <HardDrive aria-hidden="true" className="size-3" />
                {size}
              </span>
            )}
          </div>
        )}
      </div>

      <MediaViewer
        item={{
          title: item.title,
          type: item.type,
          fileUrl: item.fileUrl,
          mimeType: item.mimeType,
        }}
      />
    </div>
  );
}
