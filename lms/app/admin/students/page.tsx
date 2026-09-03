import { Clock, UserCheck, UserX } from "lucide-react";
import { redirect } from "next/navigation";
import { StudentDeleteButton } from "@/components/admin/StudentDeleteButton";
import { StudentStatusButton } from "@/components/admin/StudentStatusButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { batchChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

export default async function AdminStudentsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const enrollments = await prisma.enrollment.findMany({
    where: { batchId: batch.id },
    include: { student: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  const pending = enrollments.filter((e) => e.status === "PENDING");
  const approved = enrollments.filter((e) => e.status === "APPROVED");
  const rejected = enrollments.filter((e) => e.status === "REJECTED");

  return (
    <div className="space-y-6">
      <LiveRefresh
        channels={[batchChannel(batch.id)]}
        bindings={[{ event: PUSHER_EVENTS.ENROLLMENT_REQUESTED, toastMessageKey: "enrollmentRequested" }]}
      />
      <div>
        <h1 className="text-2xl text-ink-900">Students</h1>
        <p className="mt-1 text-sm text-ink-500">Approve, reject, or manage student access to {batch.name}.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending requests ({pending.length})</CardTitle>
        </CardHeader>
        {pending.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No pending requests"
            description="Students who join with your batch code will appear here for approval."
          />
        ) : (
          <ul className="divide-y divide-hair">
            {pending.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.student.name ?? "Unnamed"}</p>
                  <p className="text-xs text-ink-500">{e.student.email}</p>
                </div>
                <div className="flex gap-2">
                  <StudentStatusButton enrollmentId={e.id} status="APPROVED" variant="primary">
                    Approve
                  </StudentStatusButton>
                  <StudentStatusButton enrollmentId={e.id} status="REJECTED" variant="danger">
                    Reject
                  </StudentStatusButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved students ({approved.length})</CardTitle>
        </CardHeader>
        {approved.length === 0 ? (
          <EmptyState icon={UserCheck} title="No approved students yet" />
        ) : (
          <ul className="divide-y divide-hair">
            {approved.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.student.name ?? "Unnamed"}</p>
                  <p className="text-xs text-ink-500">
                    {e.student.email} · joined {formatDate(e.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="green">Approved</Badge>
                  <StudentStatusButton enrollmentId={e.id} status="REJECTED" variant="outline">
                    Revoke access
                  </StudentStatusButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rejected students ({rejected.length})</CardTitle>
        </CardHeader>
        {rejected.length === 0 ? (
          <EmptyState icon={UserX} title="No rejected students" />
        ) : (
          <ul className="divide-y divide-hair">
            {rejected.map((e) => (
              <li
                key={e.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">{e.student.name ?? "Unnamed"}</p>
                  <p className="text-xs text-ink-500">{e.student.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="red">Rejected</Badge>
                  <StudentStatusButton enrollmentId={e.id} status="APPROVED" variant="primary">
                    Move to Approved
                  </StudentStatusButton>
                  <StudentDeleteButton studentId={e.student.id} studentName={e.student.name ?? e.student.email} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
