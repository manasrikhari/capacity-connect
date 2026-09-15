import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { cn, formatDateTime, isTestOpen } from "@/lib/utils";

export default async function StudentTestsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const studentId = session.user.id;

  // Active tests to attempt, plus any inactive test the student already
  // attempted (so results stay reachable after a teacher deactivates it).
  const tests = await prisma.test.findMany({
    where: {
      batchId: batch.id,
      OR: [{ isActive: true }, { attempts: { some: { studentId } } }],
    },
    include: {
      _count: { select: { questions: true } },
      attempts: { where: { studentId } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Tests</h1>
        <p className="mt-1 text-sm text-ink-500">Each test can be attempted only once, so take your time.</p>
      </div>

      {tests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tests available" description="Check back later for new tests." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const attempt = test.attempts[0];
            const open = isTestOpen(test);
            return (
              <Card key={test.id} className="flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 font-medium text-ink-900">{test.title}</h3>
                    <Badge color="violet">{test.subject}</Badge>
                  </div>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-500">
                    {test._count.questions} question{test._count.questions === 1 ? "" : "s"}
                    {test.durationMins ? ` · ${test.durationMins} min` : ""}
                  </p>
                  {!test.isActive ? (
                    <p className="mt-1.5 text-xs text-ink-300">No longer active · results only</p>
                  ) : test.closesAt ? (
                    <p className={cn("mt-1.5 text-xs", open ? "text-ink-500" : "text-status-unpaid")}>
                      {open ? `Closes ${formatDateTime(test.closesAt)}` : "Closed"}
                    </p>
                  ) : null}
                  {attempt && (
                    <p className="mt-2 font-mono text-sm tabular-nums text-sage-700">
                      Score {attempt.score} / {attempt.totalMarks}
                    </p>
                  )}
                </div>
                {attempt ? (
                  <Link
                    href={`/student/tests/${test.id}`}
                    className={buttonClasses("secondary", "sm", "mt-4 w-full")}
                  >
                    View result
                  </Link>
                ) : open ? (
                  <Link
                    href={`/student/tests/${test.id}`}
                    className={buttonClasses("primary", "sm", "mt-4 w-full")}
                  >
                    Start test
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={cn(buttonClasses("outline", "sm", "mt-4 w-full"), "cursor-not-allowed opacity-60")}
                  >
                    Closed
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
