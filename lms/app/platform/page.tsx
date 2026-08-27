import {
  BookOpen,
  Clock,
  GraduationCap,
  LinkIcon,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { redirect } from "next/navigation";
import { TeacherStatusButton } from "@/components/platform/TeacherStatusButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatPaise } from "@/lib/utils";

export default async function PlatformPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    teachers,
    batchCounts,
    totalStudents,
    totalEnrollments,
    feeAgg,
    paymentAgg,
    recentTeachers7d,
    recentTeachers30d,
    recentStudents7d,
    recentStudents30d,
    batches,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      include: {
        _count: { select: { ownedBatches: true } },
        ownedBatches: {
          select: { _count: { select: { enrollments: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.batch.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.enrollment.count(),
    prisma.fee.aggregate({ _sum: { totalAmount: true } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
    prisma.user.count({ where: { role: "ADMIN", createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { role: "ADMIN", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: thirtyDaysAgo } } }),
    prisma.batch.findMany({
      include: {
        teacher: { select: { name: true, email: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const approvedTeachers = teachers.filter((t) => t.status === "APPROVED");
  const pendingTeachers = teachers.filter((t) => t.status === "PENDING");
  const suspendedTeachers = teachers.filter((t) => t.status === "SUSPENDED");
  const rejectedTeachers = teachers.filter((t) => t.status === "REJECTED");

  const activeBatches = batchCounts.find((b) => b.status === "ACTIVE")?._count ?? 0;
  const archivedBatches = batchCounts.find((b) => b.status === "ARCHIVED")?._count ?? 0;
  const totalBatches = activeBatches + archivedBatches;

  const totalFees = feeAgg._sum.totalAmount ?? 0;
  const totalPaid = paymentAgg._sum.amount ?? 0;
  const outstanding = Math.max(totalFees - totalPaid, 0);

  function studentCount(teacher: (typeof teachers)[number]) {
    return teacher.ownedBatches.reduce((sum, b) => sum + b._count.enrollments, 0);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview across all teachers, batches, and students.</p>
      </div>

      {/* ── Stat cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Users}
          label="Teachers"
          value={teachers.length}
          hint={`${approvedTeachers.length} approved · ${pendingTeachers.length} pending · ${suspendedTeachers.length} suspended`}
          color="violet"
        />
        <StatCard
          icon={BookOpen}
          label="Batches"
          value={totalBatches}
          hint={`${activeBatches} active · ${archivedBatches} archived`}
          color="blue"
        />
        <StatCard
          icon={GraduationCap}
          label="Students"
          value={totalStudents}
          color="violet"
        />
        <StatCard
          icon={LinkIcon}
          label="Enrollments"
          value={totalEnrollments}
          hint={totalEnrollments > totalStudents ? `${totalEnrollments - totalStudents} multi-batch` : undefined}
          color="blue"
        />
        <StatCard
          icon={Wallet}
          label="Collected"
          value={formatPaise(totalPaid)}
          hint={outstanding > 0 ? `${formatPaise(outstanding)} outstanding` : undefined}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="New signups"
          value={recentTeachers7d + recentStudents7d}
          hint={`7d: ${recentTeachers7d} teachers, ${recentStudents7d} students · 30d: ${recentTeachers30d} + ${recentStudents30d}`}
          color="amber"
        />
      </div>

      {/* ── Pending teachers ───────────────────────────────────────────── */}
      {pendingTeachers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Clock className="size-5 text-amber-500" />
                Pending teachers ({pendingTeachers.length})
              </span>
            </CardTitle>
          </CardHeader>
          <ul className="divide-y divide-slate-100">
            {pendingTeachers.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name ?? "Unnamed"}</p>
                  <p className="text-xs text-slate-500">{t.email} · signed up {formatDate(t.createdAt)}</p>
                </div>
                <div className="flex gap-2">
                  <TeacherStatusButton teacherId={t.id} status="APPROVED" variant="primary">
                    Approve
                  </TeacherStatusButton>
                  <TeacherStatusButton teacherId={t.id} status="REJECTED" variant="danger">
                    Reject
                  </TeacherStatusButton>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Teachers table ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>All teachers ({teachers.length})</CardTitle>
        </CardHeader>
        {teachers.length === 0 ? (
          <EmptyState icon={Users} title="No teachers yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-medium">Teacher</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 text-right font-medium">Batches</th>
                  <th className="py-2 pr-4 text-right font-medium">Students</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teachers.map((t) => {
                  const statusColor = {
                    APPROVED: "green" as const,
                    PENDING: "amber" as const,
                    SUSPENDED: "red" as const,
                    REJECTED: "slate" as const,
                  };
                  return (
                    <tr key={t.id}>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-800">{t.name ?? "Unnamed"}</p>
                        <p className="text-xs text-slate-500">{t.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color={statusColor[t.status]}>{t.status.toLowerCase()}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{t.plan}</td>
                      <td className="py-3 pr-4 text-right text-slate-800">{t._count.ownedBatches}</td>
                      <td className="py-3 pr-4 text-right text-slate-800">{studentCount(t)}</td>
                      <td className="py-3">
                        <div className="flex gap-1.5">
                          {t.status !== "APPROVED" && (
                            <TeacherStatusButton teacherId={t.id} status="APPROVED" variant="primary">
                              Approve
                            </TeacherStatusButton>
                          )}
                          {t.status === "APPROVED" && (
                            <TeacherStatusButton teacherId={t.id} status="SUSPENDED" variant="outline">
                              Suspend
                            </TeacherStatusButton>
                          )}
                          {t.status === "SUSPENDED" && (
                            <TeacherStatusButton teacherId={t.id} status="APPROVED" variant="primary">
                              Reinstate
                            </TeacherStatusButton>
                          )}
                          {t.status === "PENDING" && (
                            <TeacherStatusButton teacherId={t.id} status="REJECTED" variant="danger">
                              Reject
                            </TeacherStatusButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Batches overview ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>All batches ({batches.length})</CardTitle>
        </CardHeader>
        {batches.length === 0 ? (
          <EmptyState icon={BookOpen} title="No batches yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-medium">Batch</th>
                  <th className="py-2 pr-4 font-medium">Teacher</th>
                  <th className="py-2 pr-4 text-right font-medium">Students</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-800">{b.name}</p>
                      {b.grade && <p className="text-xs text-slate-500">{b.grade}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-slate-800">{b.teacher.name ?? "Unnamed"}</p>
                      <p className="text-xs text-slate-500">{b.teacher.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-right text-slate-800">{b._count.enrollments}</td>
                    <td className="py-3 pr-4">
                      <Badge color={b.status === "ACTIVE" ? "green" : "slate"}>
                        {b.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Suspended teachers ─────────────────────────────────────────── */}
      {suspendedTeachers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suspended teachers ({suspendedTeachers.length})</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-slate-100">
            {suspendedTeachers.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name ?? "Unnamed"}</p>
                  <p className="text-xs text-slate-500">
                    {t.email} · {t._count.ownedBatches} batch{t._count.ownedBatches !== 1 ? "es" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="red">Suspended</Badge>
                  <TeacherStatusButton teacherId={t.id} status="APPROVED" variant="primary">
                    Reinstate
                  </TeacherStatusButton>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
