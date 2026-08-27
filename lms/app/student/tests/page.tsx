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

export default async function StudentTestsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");
  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const studentId = session.user.id;

  const tests = await prisma.test.findMany({
    where: { batchId: batch.id, isActive: true },
    include: {
      _count: { select: { questions: true } },
      attempts: { where: { studentId } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Tests</h1>
        <p className="mt-1 text-sm text-slate-500">Each test can be attempted only once, so take your time.</p>
      </div>

      {tests.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tests available" description="Check back later for new tests." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const attempt = test.attempts[0];
            return (
              <Card key={test.id} className="flex flex-col">
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-slate-800">{test.title}</h3>
                    <Badge color="violet">{test.subject}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{test._count.questions} questions</p>
                  {attempt && (
                    <p className="mt-2 text-sm font-medium text-emerald-600">
                      Score: {attempt.score} / {attempt.totalMarks}
                    </p>
                  )}
                </div>
                <Link href={`/student/tests/${test.id}`} className={buttonClasses("primary", "sm", "mt-4 w-full")}>
                  {attempt ? "View result" : "Start test"}
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
