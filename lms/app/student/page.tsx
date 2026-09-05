import {
  ChevronRight,
  Clock,
  GraduationCap,
  X,
} from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { setActiveBatchAction, cancelEnrollmentAction } from "@/app/student/actions";
import { getSession } from "@/lib/session";
import { getStudentHubData } from "@/lib/batch";
import type { StudentHubBatch, StudentHubPending } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { getRecommendationsForTrainee } from "@/lib/recommender-db";
import {
  RecommendationCard,
  type RecommendationView,
} from "@/components/recommendations/RecommendationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import {
  JoinBatchTrigger,
  JoinSuccessModal,
} from "@/components/join/JoinBatchTrigger";
import { LiveRefresh } from "@/components/realtime/LiveRefresh";
import { batchChannel, userChannel, PUSHER_EVENTS } from "@/lib/pusher-channels";

export default async function StudentHubPage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const [{ approved, pending, stats }, { joined }] = await Promise.all([
    getStudentHubData(session),
    searchParams,
  ]);

  const hasAny = approved.length > 0 || pending.length > 0;

  // Top course recommendations for the hub strip.
  const recs = await getRecommendationsForTrainee(session.user.id, 3);
  const recBatches = recs.length
    ? await prisma.batch.findMany({
        where: { id: { in: recs.map((r) => r.batchId) } },
        select: { id: true, grade: true, wmoTier: true, teacher: { select: { name: true } } },
      })
    : [];
  const recMeta = new Map(recBatches.map((b) => [b.id, b]));
  const recViews: RecommendationView[] = recs.map((r) => ({
    batchId: r.batchId,
    name: r.name,
    domain: r.domain,
    level: recMeta.get(r.batchId)?.grade ?? null,
    wmoTier: recMeta.get(r.batchId)?.wmoTier ?? null,
    trainerName: recMeta.get(r.batchId)?.teacher.name ?? null,
    score: r.score,
    reasons: r.reasons.slice(0, 2),
    enrollmentStatus: r.enrollmentStatus,
  }));

  return (
    <div>
      <LiveRefresh
        channels={[userChannel(session.user.id)]}
        bindings={[{ event: PUSHER_EVENTS.ENROLLMENT_UPDATED, toastMessageKey: "enrollmentUpdated" }]}
      />
      <LiveRefresh
        channels={approved.map((b) => batchChannel(b.id))}
        bindings={[
          { event: PUSHER_EVENTS.MEETING_STARTED, toastMessageKey: "meetingStarted" },
          { event: PUSHER_EVENTS.MEETING_ENDED, toastMessageKey: "meetingEnded" },
        ]}
      />
      {joined && <JoinSuccessModal batchName={joined} />}
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-ink-900">My courses</h1>
          <p className="mt-1 text-sm text-ink-500">
            Pick a course to see its sessions, notes and assessments.
          </p>
        </div>
        {hasAny && <JoinBatchTrigger variant="top-button" />}
      </div>

      {!hasAny ? (
        <div className="mt-6">
          <EmptyState
            icon={GraduationCap}
            title="No courses yet"
            description="Enter a course code from your trainer to start accessing sessions, notes, and assessments."
            action={<JoinBatchTrigger variant="empty-state" />}
          />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <StatCard value={stats.joinedBatches} label="Joined courses" />
            <StatCard
              value={stats.liveNow}
              label="Live now"
              color={stats.liveNow > 0 ? "green" : "slate"}
            />
            <StatCard value={stats.testsToAttempt} label="Assessments to attempt" />
          </div>

          {/* Section label */}
          <div className="mb-4 mt-8 flex items-center justify-between border-b border-hair-strong pb-2">
            <h2 className="text-sm font-semibold text-ink-900">My courses</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
              {stats.joinedBatches} joined
              {pending.length > 0 && ` · ${pending.length} pending`}
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {approved.map((batch) => (
              <ApprovedBatchCard key={batch.id} batch={batch} />
            ))}
            {pending.map((p) => (
              <PendingBatchCard key={p.enrollmentId} batch={p} />
            ))}
            <JoinBatchTrigger variant="card" />
          </div>
        </>
      )}

      {recViews.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between border-b border-hair-strong pb-2">
            <h2 className="text-sm font-semibold text-ink-900">Recommended for you</h2>
            <Link
              href="/student/recommendations"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-plum-600 hover:text-plum-700"
            >
              See all
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recViews.map((v) => (
              <RecommendationCard key={v.batchId} rec={v} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ApprovedBatchCard({ batch }: { batch: StudentHubBatch }) {
  return (
    <form action={setActiveBatchAction.bind(null, batch.id)}>
      <button
        type="submit"
        className="group relative flex min-h-40 w-full cursor-pointer flex-col rounded-2xl border border-hair bg-paper p-[18px] text-left transition-[border-color] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-200 active:scale-[0.99]"
      >
        {/* Arrow */}
        <div className="absolute right-[18px] top-[18px] flex size-7 items-center justify-center rounded-[9px] border border-hair bg-sunken/50 text-ink-500 transition-colors group-hover:border-plum-600 group-hover:bg-plum-600 group-hover:text-paper">
          <ChevronRight className="size-4" />
        </div>

        {/* Top row: icon + live badge */}
        <div className="flex items-start gap-2.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-plum-50 text-plum-600">
            <GraduationCap className="size-6" />
          </div>
          {batch.isLive && (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-status-live/10 px-2.5 py-1 text-[11px] font-semibold text-status-live">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-status-live" />
              Live now
            </span>
          )}
        </div>

        {/* Name + grade */}
        <h3 className="mt-3 text-lg font-normal text-ink-900">{batch.name}</h3>
        <p className="mt-0.5 text-xs text-ink-500">
          {[batch.grade, batch.teacherName].filter(Boolean).join(" · ")}
        </p>

        {/* Bottom chips */}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Chip>
            <b>{batch.meetingCount}</b> meetings
          </Chip>
          {batch.testsDue > 0 ? (
            <Chip alert>
              <b>{batch.testsDue}</b> test{batch.testsDue !== 1 && "s"} due
            </Chip>
          ) : null}
          <Chip>
            <b>{batch.noteCount}</b> notes
          </Chip>
        </div>
      </button>
    </form>
  );
}

function PendingBatchCard({ batch }: { batch: StudentHubPending }) {
  return (
    <div className="flex min-h-40 flex-col rounded-2xl border border-hair bg-paper p-[18px]">
      {/* Top row: icon + waiting badge + cancel */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-status-partial/10 text-status-partial">
            <Clock className="size-6" />
          </div>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-status-partial/10 px-2.5 py-1 text-[11px] font-semibold text-status-partial">
            <span className="inline-block size-1.5 rounded-full bg-status-partial" />
            Waiting
          </span>
        </div>
        <form action={cancelEnrollmentAction.bind(null, batch.enrollmentId)}>
          <button
            type="submit"
            title="Cancel request"
            className="flex size-7 cursor-pointer items-center justify-center rounded-[9px] border border-status-unpaid/25 bg-status-unpaid/10 text-status-unpaid transition-colors hover:bg-status-unpaid/15"
          >
            <X className="size-3.5" />
          </button>
        </form>
      </div>

      {/* Name + grade */}
      <h3 className="mt-3 text-lg font-normal text-ink-900">{batch.name}</h3>
      <p className="mt-0.5 text-xs text-ink-500">
        {[batch.grade, batch.teacherName].filter(Boolean).join(" · ")}
      </p>

      {/* Status chip */}
      <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-[8px] border border-dashed border-hair bg-paper px-2.5 py-1.5 text-xs text-ink-500">
        Request sent — waiting for approval
      </span>
    </div>
  );
}

function Chip({
  alert,
  children,
}: {
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        alert
          ? "inline-flex items-center gap-1 rounded-[8px] border border-status-partial/25 bg-status-partial/10 px-2.5 py-1.5 text-xs text-status-partial [&>b]:font-semibold [&>b]:text-status-partial"
          : "inline-flex items-center gap-1 rounded-[8px] border border-hair bg-sunken/50 px-2.5 py-1.5 text-xs text-ink-500 [&>b]:font-semibold [&>b]:text-ink-900"
      }
    >
      {children}
    </span>
  );
}
