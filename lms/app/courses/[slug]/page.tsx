import { BookOpen, CalendarDays, CheckCircle2, ClipboardList, MinusCircle, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrolPanel, type EnrolViewer } from "@/components/courses/EnrolPanel";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { auth } from "@/lib/auth";
import { coursePhase, durationWeeks } from "@/lib/catalogue";
import { findCourseByHandle } from "@/lib/catalogue-db";
import {
  coerceEligibilityRule,
  evaluateEligibility,
  hasEligibilityRules,
} from "@/lib/eligibility";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await findCourseByHandle(slug);
  if (!course) return { title: "Course not found — Capacity Connect" };
  return {
    title: `${course.name} — Capacity Connect`,
    description: course.description ?? "A capacity-building course from the Ministry of Earth Sciences.",
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await findCourseByHandle(slug);
  if (!course) notFound();

  const session = await auth();
  const phase = coursePhase(course.startDate, course.endDate);
  const weeks = durationWeeks(course.startDate, course.endDate);

  // Eligibility is advisory. It is evaluated only for a signed-in trainee, and
  // shown to everyone else as a plain list of what the course expects.
  const rule = coerceEligibilityRule(course.eligibility);
  const declaresRules = hasEligibilityRules(rule);

  let viewer: EnrolViewer = { kind: "signedOut" };
  let eligibility: ReturnType<typeof evaluateEligibility> | null = null;

  if (session?.user) {
    if (session.user.role !== "STUDENT") {
      viewer = { kind: "staff" };
    } else {
      const [enrolment, profile, certificates] = await Promise.all([
        prisma.enrollment.findUnique({
          where: { studentId_batchId: { studentId: session.user.id, batchId: course.id } },
          select: { status: true },
        }),
        prisma.profile.findUnique({
          where: { userId: session.user.id },
          select: { cadre: true, yearsExperience: true, qualifications: true },
        }),
        prisma.certificate.findMany({
          where: { traineeId: session.user.id, status: "VALID" },
          select: { batchId: true },
        }),
      ]);

      viewer = { kind: "trainee", enrolment: enrolment?.status ?? "none" };

      if (declaresRules) {
        const prereqIds = rule.prerequisiteCourseIds ?? [];
        const prereqNames = prereqIds.length
          ? await prisma.batch.findMany({
              where: { id: { in: prereqIds } },
              select: { id: true, name: true, slug: true },
            })
          : [];
        eligibility = evaluateEligibility(
          rule,
          {
            cadre: profile?.cadre ?? null,
            yearsExperience: profile?.yearsExperience ?? null,
            qualifications: Array.isArray(profile?.qualifications)
              ? (profile.qualifications as { degree?: string; institution?: string }[])
              : null,
            completedCourseIds: certificates.map((c) => c.batchId),
          },
          Object.fromEntries(prereqNames.map((p) => [p.id, p.name])),
        );
      }
    }
  }

  const trainerProfile = course.teacher?.profile;
  const trainerHandle = trainerProfile?.isPublic ? trainerProfile.publicSlug : null;

  return (
    <>
      <PublicHeader
        right={
          <Link href="/courses" className="text-sm text-plum-700 hover:underline">
            All courses
          </Link>
        }
      />

      <main className="flex-1 bg-page">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
          <Link href="/courses" className="text-sm text-ink-500 hover:text-ink-900">
            ← Back to courses
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge color={phase.color}>{phase.label}</Badge>
            {course.wmoTier && <Badge color="blue">{course.wmoTier}</Badge>}
            {course.grade && <Badge color="slate">{course.grade}</Badge>}
          </div>

          <h1 className="mt-3 font-display text-4xl font-normal leading-tight text-ink-900">
            {course.name}
          </h1>
          {course.subject && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-300">
              {course.subject}
              {course.department ? ` · ${course.department}` : ""}
            </p>
          )}

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
            <div className="min-w-0 space-y-6">
              {course.description && (
                <section>
                  <h2 className="mb-2 font-display text-lg font-normal text-ink-900">About this course</h2>
                  <p className="whitespace-pre-line text-ink-700">{course.description}</p>
                </section>
              )}

              {course.skillRequirements.length > 0 && (
                <section>
                  <h2 className="mb-2 font-display text-lg font-normal text-ink-900">
                    Competencies covered
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {course.skillRequirements.map((r) => (
                      <li
                        key={r.skill.id}
                        className="rounded-lg border border-hair bg-paper px-3 py-1.5 text-sm text-ink-700"
                      >
                        {r.skill.name}
                        <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                          {r.isMandatory ? "core" : "optional"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {declaresRules && (
                <section>
                  <h2 className="mb-2 font-display text-lg font-normal text-ink-900">Who this is for</h2>
                  {eligibility ? (
                    <>
                      <p className="mb-3 text-sm text-ink-500">
                        You meet {eligibility.metCount} of {eligibility.totalCount} requirements. This is
                        guidance, not a barrier — the trainer can still approve your request.
                      </p>
                      <ul className="space-y-2">
                        {eligibility.checks.map((c) => (
                          <li key={c.key} className="flex gap-2.5 text-sm">
                            {c.met ? (
                              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-sage-600" />
                            ) : (
                              <MinusCircle className="mt-0.5 size-4 shrink-0 text-ink-300" />
                            )}
                            <span>
                              <span className={c.met ? "text-ink-700" : "text-ink-900"}>{c.label}</span>
                              {!c.met && c.detail && (
                                <span className="block text-xs text-ink-500">{c.detail}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <ul className="space-y-2 text-sm text-ink-700">
                      {rule.qualificationLabel && <li>· {rule.qualificationLabel}</li>}
                      {rule.requiredCadre && <li>· {rule.requiredCadre} cadre</li>}
                      {typeof rule.minYearsExperience === "number" && (
                        <li>· {rule.minYearsExperience}+ years of experience</li>
                      )}
                      {(rule.prerequisiteCourseIds ?? []).length > 0 && (
                        <li>· A prerequisite course must be completed first</li>
                      )}
                      <li className="pt-1 text-xs text-ink-300">
                        Sign in to see how your profile measures against these.
                      </li>
                    </ul>
                  )}
                </section>
              )}
            </div>

            <div className="space-y-4">
              <Card className="space-y-4">
                <EnrolPanel batchId={course.id} viewer={viewer} />

                <dl className="space-y-3 border-t border-hair pt-4 text-sm">
                  {course.startDate && (
                    <Row icon={CalendarDays} label="Starts">
                      {formatDate(course.startDate)}
                    </Row>
                  )}
                  {weeks && (
                    <Row icon={ClipboardList} label="Duration">
                      {weeks} week{weeks === 1 ? "" : "s"}
                    </Row>
                  )}
                  <Row icon={Users} label="Enrolled">
                    {course._count.enrollments}
                  </Row>
                  <Row icon={BookOpen} label="Resources">
                    {course._count.libraryItems} item{course._count.libraryItems === 1 ? "" : "s"}
                  </Row>
                </dl>

                {course.teacher && (
                  <div className="border-t border-hair pt-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                      Trainer
                    </p>
                    <p className="mt-1 text-sm font-medium text-ink-900">
                      {trainerHandle ? (
                        <Link href={`/p/${trainerHandle}`} className="hover:underline">
                          {course.teacher.name ?? "Trainer"}
                        </Link>
                      ) : (
                        (course.teacher.name ?? "Trainer")
                      )}
                    </p>
                    {trainerProfile?.designation && (
                      <p className="text-xs text-ink-500">{trainerProfile.designation}</p>
                    )}
                    {trainerProfile?.organisation && (
                      <p className="text-xs text-ink-300">{trainerProfile.organisation}</p>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-ink-500">
        <Icon className="size-4 text-ink-300" />
        {label}
      </dt>
      <dd className="text-ink-900">{children}</dd>
    </div>
  );
}
