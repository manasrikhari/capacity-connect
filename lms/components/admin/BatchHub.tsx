"use client";

import {
  ChevronRight,
  Clock,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { setActiveBatchAction } from "@/app/admin/actions";
import { CopyJoinCode } from "@/components/ui/CopyJoinCode";
import type { TeacherHubBatch } from "@/lib/batch";
import { CreateBatchModal } from "./CreateBatchModal";

export function BatchHub({
  batches,
  stats,
}: {
  batches: TeacherHubBatch[];
  stats: { activeBatches: number; totalStudents: number; pendingRequests: number };
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[27px] font-extrabold tracking-tight text-slate-800">
            My Batches
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a batch to manage its classes, notes, tests and students.
          </p>
        </div>
        {batches.length > 0 && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-300/60 transition-all hover:-translate-y-0.5 hover:bg-violet-700"
          >
            <Plus className="size-4" />
            Create new batch
          </button>
        )}
      </div>

      {batches.length === 0 ? (
        <EmptyHub onCreateClick={() => setModalOpen(true)} />
      ) : (
        <>
          {/* Stat chips */}
          <div className="mt-5 flex flex-wrap gap-3">
            <StatChip
              icon={GraduationCap}
              value={stats.activeBatches}
              label="Active batches"
              color="violet"
            />
            <StatChip
              icon={Users}
              value={stats.totalStudents}
              label="Total students"
              color="blue"
            />
            <StatChip
              icon={Clock}
              value={stats.pendingRequests}
              label="Pending requests"
              color="amber"
            />
          </div>

          {/* Section label */}
          <div className="mb-4 mt-7 flex items-center gap-3">
            <h2 className="text-[15px] font-bold text-slate-800">
              Your batches
            </h2>
            <div className="h-px flex-1 bg-violet-100" />
            <span className="text-xs text-slate-400">
              {stats.activeBatches} active
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {batches.map((batch) => (
              <BatchCard key={batch.id} batch={batch} />
            ))}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex min-h-42 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-violet-400 hover:bg-white"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-violet-200 bg-white text-2xl font-light text-violet-600">
                +
              </div>
              <span className="text-sm font-semibold text-violet-700">
                Create new batch
              </span>
              <span className="max-w-42.5 text-xs text-slate-500">
                Start a class and get a join code to share
              </span>
            </button>
          </div>
        </>
      )}

      <CreateBatchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}

function BatchCard({ batch }: { batch: TeacherHubBatch }) {
  const showJoinCodeChip = batch.studentCount === 0 && batch.pendingCount === 0;

  return (
    <form action={() => setActiveBatchAction(batch.id)}>
      <button
        type="submit"
        className="group relative flex min-h-42 w-full cursor-pointer flex-col rounded-2xl border border-white/60 bg-white/80 p-4.5 text-left shadow-sm shadow-violet-100/60 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-200/50"
      >
        {/* Arrow */}
        <div className="absolute right-4.5 top-4.5 flex size-7.5 items-center justify-center rounded-[9px] border border-violet-100 bg-violet-50/60 text-violet-600 transition-colors group-hover:border-violet-600 group-hover:bg-violet-600 group-hover:text-white">
          <ChevronRight className="size-4" />
        </div>

        {/* Top row: icon */}
        <div className="flex items-start gap-2.5">
          <div className="flex size-11.5 shrink-0 items-center justify-center rounded-[13px] bg-violet-100 text-violet-600">
            <GraduationCap className="size-6" />
          </div>
        </div>

        {/* Name + grade */}
        <h3 className="mt-3 text-lg font-bold text-slate-800">
          {batch.name}
        </h3>
        {batch.grade && (
          <p className="mt-0.5 text-[12.5px] text-slate-400">{batch.grade}</p>
        )}

        {/* Bottom chips */}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {showJoinCodeChip ? (
            <span className="inline-flex items-center gap-2 rounded-lg border border-dashed border-violet-100 bg-violet-50/60 px-2.5 py-1.5 text-xs text-slate-500">
              Code{" "}
              <span className="font-bold text-violet-700">
                {batch.joinCode}
              </span>
              <CopyJoinCode code={batch.joinCode} />
            </span>
          ) : (
            <>
              <Chip>
                <b>{batch.studentCount}</b> students
              </Chip>
              {batch.pendingCount > 0 && (
                <Chip alert>
                  <b>{batch.pendingCount}</b> pending
                </Chip>
              )}
              <Chip>
                <b>{batch.testCount}</b> tests
              </Chip>
            </>
          )}
        </div>
      </button>
    </form>
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

function EmptyHub({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="mt-6 flex flex-col items-center rounded-2xl border border-violet-100 bg-white/80 px-6 py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-violet-100">
        <GraduationCap className="size-8 text-violet-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">No batches yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        Create your first batch to start scheduling meetings, sharing notes,
        running tests, and tracking fees. You'll get a join code to give your
        students.
      </p>
      <button
        type="button"
        onClick={onCreateClick}
        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
      >
        <Plus className="size-4" />
        Create your first batch
      </button>
    </div>
  );
}
