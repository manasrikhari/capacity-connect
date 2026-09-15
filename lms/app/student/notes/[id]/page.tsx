import { ArrowLeft, Link2 } from "lucide-react";
import { TrackView } from "@/components/course/TrackView";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { renderMarkdown } from "@/lib/markdown";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function StudentNoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const { id } = await params;
  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.batchId !== batch.id) notFound();

  return (
    <div className="space-y-6">
      <TrackView itemType="NOTE" itemId={id} />
      <Link href="/student/notes" className="inline-flex items-center gap-1.5 text-sm text-plum-700 hover:underline">
        <ArrowLeft className="size-4" />
        Back to notes
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-medium text-ink-900">{note.title}</h1>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              Updated {formatDate(note.updatedAt)}
            </p>
          </div>
          <Badge color="violet">{note.subject}</Badge>
        </div>

        {note.fileUrl && (
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-plum-700 hover:underline"
          >
            <Link2 className="size-4" />
            Open attachment
          </a>
        )}

        <div className="mt-4 border-t border-hair pt-4">{renderMarkdown(note.content)}</div>
      </Card>
    </div>
  );
}
