import { CheckCircle2, MessageSquare, Pin } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ThreadSummary } from "@/lib/discussion-db";
import { formatDate } from "@/lib/utils";

/**
 * The forum index — SWAYAM's fourth quadrant.
 *
 * `basePath` differs per role (`/student/discussion` vs `/admin/discussion`)
 * but the list itself is identical, so it is rendered once here.
 */
export function ThreadList({
  threads,
  basePath,
}: {
  threads: ThreadSummary[];
  basePath: string;
}) {
  if (threads.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No questions yet"
        description="Ask the first one — the trainer and everyone on the course can see it."
      />
    );
  }

  return (
    <ul className="divide-y divide-hair">
      {threads.map((t) => (
        <li key={t.id}>
          <Link
            href={`${basePath}/${t.id}`}
            className="flex flex-wrap items-start justify-between gap-3 py-3.5 transition-colors hover:bg-sunken"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {t.isPinned && (
                  <Pin className="size-3.5 shrink-0 text-plum-600" aria-label="Pinned" />
                )}
                <p className="min-w-0 text-sm font-medium text-ink-900">{t.title}</p>
                {t.isResolved && (
                  <Badge color="green">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Answered
                    </span>
                  </Badge>
                )}
                {t.weekLabel && <Badge color="slate">{t.weekLabel}</Badge>}
              </div>
              <p className="mt-0.5 text-xs text-ink-500">
                {t.authorName}
                {t.authorIsStaff ? " · Trainer" : ""} · asked {formatDate(t.createdAt)}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-ink-500">
              <MessageSquare className="size-3.5 text-ink-300" />
              {t.replies}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
