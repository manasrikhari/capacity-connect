import { ArrowLeft, Link2 } from "lucide-react";
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
      <Link href="/student/notes" className="inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline">
        <ArrowLeft className="size-4" />
        Back to notes
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{note.title}</h1>
            <p className="mt-1 text-xs text-slate-400">Updated {formatDate(note.updatedAt)}</p>
          </div>
          <Badge color="violet">{note.subject}</Badge>
        </div>

        {note.fileUrl && (
          <a
            href={note.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet-600 hover:underline"
          >
            <Link2 className="size-4" />
            Open attachment
          </a>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">{renderMarkdown(note.content)}</div>
      </Card>
    </div>
  );
}
