import {
  CheckSquare,
  ChevronRight,
  CircleCheck,
  Clock,
  GraduationCap,
  X,
} from "lucide-react";
import { redirect } from "next/navigation";
import { setActiveBatchAction, cancelEnrollmentAction } from "@/app/student/actions";
import { getSession } from "@/lib/session";
import { getStudentHubData } from "@/lib/batch";
import type { StudentHubBatch, StudentHubPending } from "@/lib/batch";
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
          <h1 className="text-[27px] font-extrabold tracking-tight text-slate-800">
            My Batches
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pick a class to see its meetings, notes and tests.
          </p>
        </div>
        {hasAny && <JoinBatchTrigger variant="top-button" />}
      </div>

      {!hasAny ? (
        <StudentEmptyState />
      ) : (
        <>
          {/* Stat chips */}
          <div className="mt-5 flex flex-wrap gap-3">
            <StatChip
              icon={GraduationCap}
              value={stats.joinedBatches}
              label="Joined batches"
              color="violet"
            />
            <StatChip
              icon={CircleCheck}
              value={stats.liveNow}
              label="Live now"
              color="green"
            />
            <StatChip
              icon={CheckSquare}
              value={stats.testsToAttempt}
              label="Tests to attempt"
              color="amber"
            />
          </div>

          {/* Section label */}
          <div className="mb-4 mt-7 flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-slate-800">
              My batches
            </h2>
            <div className="h-px flex-1 bg-violet-100" />
            <span className="text-xs text-slate-400">
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
    </div>
  );
}

function ApprovedBatchCard({ batch }: { batch: StudentHubBatch }) {
  return (
    <form action={setActiveBatchAction.bind(null, batch.id)}>
      <button
        type="submit"
        className="group relative flex min-h-42 w-full cursor-pointer flex-col rounded-2xl border border-white/60 bg-white/80 p-4.5 text-left shadow-sm shadow-violet-100/60 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-200/50"
      >
        {/* Arrow */}
        <div className="absolute right-4.5 top-4.5 flex size-7.5 items-center justify-center rounded-[9px] border border-violet-100 bg-violet-50/60 text-violet-600 transition-colors group-hover:border-violet-600 group-hover:bg-violet-600 group-hover:text-white">
          <ChevronRight className="size-4" />
        </div>

        {/* Top row: icon + live badge */}
        <div className="flex items-start gap-2.5">
          <div className="flex size-11.5 shrink-0 items-center justify-center rounded-[13px] bg-violet-100 text-violet-600">
            <GraduationCap className="size-6" />
          </div>
          {batch.isLive && (
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
              <span
                className="inline-block size-1.5 rounded-full bg-emerald-500"
                style={{ animation: "live-pulse 1.6s infinite" }}
              />
              Live now
            </span>
          )}
        </div>

        {/* Name + grade */}
        <h3 className="mt-3 text-lg font-bold text-slate-800">{batch.name}</h3>
        <p className="mt-0.5 text-[12.5px] text-slate-400">
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
    <div className="flex min-h-42 flex-col rounded-2xl border border-white/60 bg-white/80 p-4.5 shadow-sm shadow-violet-100/60 backdrop-blur-sm">
      {/* Top row: icon + waiting badge + cancel */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex size-11.5 shrink-0 items-center justify-center rounded-[13px] bg-amber-100 text-amber-600">
            <Clock className="size-6" />
          </div>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <span className="inline-block size-1.5 rounded-full bg-amber-500" />
            Waiting
          </span>
        </div>
        <form action={cancelEnrollmentAction.bind(null, batch.enrollmentId)}>
          <button
            type="submit"
            title="Cancel request"
            className="flex size-7.5 items-center justify-center rounded-[9px] border border-red-100 bg-red-50/60 text-red-400 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-600 cursor-pointer"
          >
            <X className="size-3.5" />
          </button>
        </form>
      </div>

      {/* Name + grade */}
      <h3 className="mt-3 text-lg font-bold text-slate-800">{batch.name}</h3>
      <p className="mt-0.5 text-[12.5px] text-slate-400">
        {[batch.grade, batch.teacherName].filter(Boolean).join(" · ")}
      </p>

      {/* Status chip */}
      <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-dashed border-violet-100 bg-violet-50/60 px-2.5 py-1.5 text-xs text-slate-500">
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
          ? "inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-100 px-2.5 py-1.5 text-xs text-amber-700 [&>b]:font-bold [&>b]:text-amber-700"
          : "inline-flex items-center gap-1 rounded-lg border border-violet-100 bg-violet-50/60 px-2.5 py-1.5 text-xs text-slate-500 [&>b]:font-bold [&>b]:text-slate-800"
      }
    >
      {children}
    </span>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof GraduationCap;
  value: number;
  label: string;
  color: "violet" | "blue" | "amber" | "green";
}) {
  const styles = {
    violet: "bg-violet-100 text-violet-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-emerald-100 text-emerald-600",
  };

  return (
    <div className="flex items-center gap-3 rounded-[13px] border border-violet-100 bg-white/80 px-3.5 py-2.5">
      <div
        className={`flex size-7.5 shrink-0 items-center justify-center rounded-[9px] ${styles[color]}`}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-lg font-extrabold leading-none tracking-tight text-slate-800">
          {value}
        </p>
        <p className="mt-0.5 text-[11.5px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function StudentEmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-violet-100 bg-white/80 px-6 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-100">
        <GraduationCap className="size-8 text-violet-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">No batches yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        Enter a join code from your teacher to start accessing meetings, notes,
        and tests.
      </p>
      <JoinBatchTrigger variant="empty-state" />
    </div>
  );
}
