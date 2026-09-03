import { ArrowLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export default async function AdminTestResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      attempts: {
        where: { batchId: batch.id },
        include: { student: { select: { name: true, email: true } } },
        orderBy: { score: "desc" },
      },
    },
  });

  if (!test || test.batchId !== batch.id) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/tests/${test.id}`}
        className="inline-flex items-center gap-1 text-sm text-plum-700 hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to test
      </Link>

      <div>
        <h1 className="text-2xl font-medium text-ink-900">{test.title} — results</h1>
        <p className="mt-1 text-sm text-ink-500">
          {test.subject} · {test.attempts.length} attempt{test.attempts.length === 1 ? "" : "s"}
        </p>
      </div>

      <Card>
        {test.attempts.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No attempts yet"
            description="Results will appear here once students take this test."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hair-strong font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  <th className="py-2 pr-4 font-normal">Student</th>
                  <th className="py-2 pr-4 font-normal">Score</th>
                  <th className="py-2 pr-4 font-normal">Percentage</th>
                  <th className="py-2 pr-4 font-normal">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {test.attempts.map((attempt) => {
                  const pct =
                    attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                  return (
                    <tr key={attempt.id}>
                      <td className="py-2 pr-4">
                        <p className="font-medium text-ink-900">{attempt.student.name ?? "Unnamed"}</p>
                        <p className="text-xs text-ink-500">{attempt.student.email}</p>
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums text-ink-900">
                        {attempt.score} / {attempt.totalMarks}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge color={pct >= 50 ? "green" : "red"}>{pct}%</Badge>
                      </td>
                      <td className="py-2 pr-4 font-mono text-xs text-ink-500">
                        {formatDateTime(attempt.submittedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
