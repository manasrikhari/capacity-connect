import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  LinkIcon,
  Percent,
  Target,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { DepartmentBars } from "@/components/platform/DepartmentBars";
import { DomainBars } from "@/components/platform/DomainBars";
import { TeacherStatusButton } from "@/components/platform/TeacherStatusButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { auth } from "@/lib/auth";
import { getCapacityMetrics } from "@/lib/metrics-db";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

const TABLE_HEAD = "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300";

/** An attempt counts as a pass at or above this share of the marks (lib/metrics.ts). */
const PASS_MARK_PERCENT = 50;
/** A cohort pass rate at or above this is shown green. */
const PASS_RATE_TARGET = 60;

function pctLabel(v: number | null) {
  return v == null ? "—" : `${v}%`;
}

export default async function PlatformPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    metrics,
    teachers,
    batchCounts,
    totalStudents,
    totalEnrollments,
    recentStudents7d,
    batches,
  ] = await Promise.all([
    getCapacityMetrics(),
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
    prisma.user.count({ where: { role: "STUDENT", createdAt: { gte: sevenDaysAgo } } }),
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

  const activeBatches = batchCounts.find((b) => b.status === "ACTIVE")?._count ?? 0;
  const archivedBatches = batchCounts.find((b) => b.status === "ARCHIVED")?._count ?? 0;
  const totalBatches = activeBatches + archivedBatches;

  function studentCount(teacher: (typeof teachers)[number]) {
    return teacher.ownedBatches.reduce((sum, b) => sum + b._count.enrollments, 0);
  }

  // The bar the pass rate is judged against, shown in the card hint rather
  // than left as an invisible magic number.
  const passColor =
    metrics.passRatePercent == null
      ? "violet"
      : metrics.passRatePercent >= PASS_RATE_TARGET
        ? "green"
        : "red";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Capacity dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">
          National training capacity across trainers, courses, and trainees.
        </p>
      </div>

      {/* ── Action queue: always rendered so its position never moves ──── */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <Clock
                className={
                  pendingTeachers.length > 0 ? "size-5 text-status-partial" : "size-5 text-ink-300"
                }
              />
              Awaiting approval ({pendingTeachers.length})
            </span>
          </CardTitle>
        </CardHeader>
        {pendingTeachers.length === 0 ? (
          <p className="py-2 text-sm text-ink-500">
            No trainers are waiting for approval.
          </p>
        ) : (
          <ul className="divide-y divide-hair">
            {pendingTeachers.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900">{t.name ?? "Unnamed"}</p>
                  <p className="text-xs text-ink-500">
                    {t.email} · signed up <span className="font-mono">{formatDate(t.createdAt)}</span>
                  </p>
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
        )}
      </Card>

      {/* ── Outcomes: how the system is performing ────────────────────── */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          Outcomes
        </h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <StatCard
            icon={Percent}
            label="Attendance"
            value={pctLabel(metrics.attendancePercent)}
            hint={`${metrics.totals.attendanceMarks} marks recorded`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Certification rate"
            value={pctLabel(metrics.completionPercent)}
            hint={`${metrics.certifiedCount} of ${metrics.totals.enrollments} enrolments certified`}
          />
          <StatCard
            icon={Target}
            label="Assessment pass rate"
            value={pctLabel(metrics.passRatePercent)}
            hint={`${metrics.totals.attempts} attempts · pass mark ${PASS_MARK_PERCENT}%`}
            color={passColor}
          />
          <StatCard
            icon={Award}
            label="Certified personnel"
            value={metrics.certifiedCount}
            hint="valid certificates"
            color="green"
          />
        </div>
      </section>

      {/* ── Scale: how big the system is ──────────────────────────────── */}
      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          Scale
        </h2>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Trainers"
            value={teachers.length}
            hint={`${approvedTeachers.length} approved · ${pendingTeachers.length} pending`}
          />
          <StatCard
            icon={BookOpen}
            label="Courses"
            value={totalBatches}
            hint={`${activeBatches} active · ${archivedBatches} archived`}
          />
          <StatCard
            icon={GraduationCap}
            label="Trainees"
            value={totalStudents}
            hint={`${recentStudents7d} new this week`}
          />
          <StatCard
            icon={LinkIcon}
            label="Enrolments"
            value={totalEnrollments}
            hint={
              totalEnrollments > totalStudents
                ? `${totalEnrollments - totalStudents} multi-course`
                : "one course each"
            }
          />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DepartmentBars byDepartment={metrics.byDepartment} />
        <DomainBars byDomain={metrics.byDomain} />
      </div>

      {/* ── Trainers table ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>All trainers ({teachers.length})</CardTitle>
        </CardHeader>
        {teachers.length === 0 ? (
          <EmptyState icon={Users} title="No trainers yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b border-hair-strong ${TABLE_HEAD}`}>
                  <th className="py-2 pr-4 font-normal">Trainer</th>
                  <th className="py-2 pr-4 font-normal">Status</th>
                  <th className="py-2 pr-4 font-normal">Plan</th>
                  <th className="py-2 pr-4 text-right font-normal">Courses</th>
                  <th className="py-2 pr-4 text-right font-normal">Trainees</th>
                  <th className="py-2 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
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
                        <p className="font-medium text-ink-900">{t.name ?? "Unnamed"}</p>
                        <p className="text-xs text-ink-500">{t.email}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge color={statusColor[t.status]}>{t.status.toLowerCase()}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-ink-700">{t.plan}</td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">{t._count.ownedBatches}</td>
                      <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">{studentCount(t)}</td>
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

      {/* ── Courses overview ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>All courses ({batches.length})</CardTitle>
        </CardHeader>
        {batches.length === 0 ? (
          <EmptyState icon={BookOpen} title="No courses yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={`border-b border-hair-strong ${TABLE_HEAD}`}>
                  <th className="py-2 pr-4 font-normal">Course</th>
                  <th className="py-2 pr-4 font-normal">Trainer</th>
                  <th className="py-2 pr-4 text-right font-normal">Trainees</th>
                  <th className="py-2 pr-4 font-normal">Status</th>
                  <th className="py-2 font-normal">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink-900">{b.name}</p>
                      {b.subject && <p className="text-xs text-ink-500">{b.subject}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-ink-900">{b.teacher.name ?? "Unnamed"}</p>
                      <p className="text-xs text-ink-500">{b.teacher.email}</p>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-900">{b._count.enrollments}</td>
                    <td className="py-3 pr-4">
                      <Badge color={b.status === "ACTIVE" ? "green" : "slate"}>
                        {b.status.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-ink-500">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Suspended trainers ─────────────────────────────────────────── */}
      {suspendedTeachers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Suspended trainers ({suspendedTeachers.length})</CardTitle>
          </CardHeader>
          <ul className="divide-y divide-hair">
            {suspendedTeachers.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900">{t.name ?? "Unnamed"}</p>
                  <p className="text-xs text-ink-500">
                    {t.email} · {t._count.ownedBatches} course{t._count.ownedBatches !== 1 ? "s" : ""}
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
