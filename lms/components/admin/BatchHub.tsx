"use client";

import {
  ChevronRight,
  GraduationCap,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { setActiveBatchAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/Button";
import { CopyJoinCode } from "@/components/ui/CopyJoinCode";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
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
          <h1 className="text-2xl font-normal text-ink-900">My batches</h1>
          <p className="mt-1 text-sm text-ink-500">
            Select a batch to manage its classes, notes, tests and students.
          </p>
        </div>
        {batches.length > 0 && (
          <Button type="button" onClick={() => setModalOpen(true)}>
            <Plus className="size-4" />
            Create new batch
          </Button>
        )}
      </div>

      {batches.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={GraduationCap}
            title="No batches yet"
            description="Create your first batch to start scheduling meetings, sharing notes, running tests, and tracking fees. You'll get a join code to give your students."
            action={
              <Button type="button" onClick={() => setModalOpen(true)}>
                <Plus className="size-4" />
                Create your first batch
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <StatCard value={stats.activeBatches} label="Active batches" />
            <StatCard value={stats.totalStudents} label="Total students" />
            <StatCard value={stats.pendingRequests} label="Pending requests" />
          </div>

          {/* Section label */}
          <div className="mb-4 mt-8 flex items-center justify-between border-b border-hair-strong pb-2">
            <h2 className="text-sm font-semibold text-ink-900">Your batches</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
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
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-hair-strong bg-sunken/30 p-5 text-center transition-[background-color,border-color] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-300 hover:bg-plum-50/50"
            >
              <div className="flex size-10 items-center justify-center rounded-[10px] border border-hair bg-paper text-plum-600">
                <Plus className="size-5" />
              </div>
              <span className="text-sm font-medium text-plum-700">
                Create new batch
              </span>
              <span className="max-w-[170px] text-xs text-ink-500">
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
        className="group relative flex min-h-40 w-full cursor-pointer flex-col rounded-2xl border border-hair bg-paper p-[18px] text-left transition-[border-color] duration-[var(--dur-press)] ease-[var(--ease-out)] hover:border-plum-200 active:scale-[0.99]"
      >
        {/* Arrow */}
        <div className="absolute right-[18px] top-[18px] flex size-7 items-center justify-center rounded-[9px] border border-hair bg-sunken/50 text-ink-500 transition-colors group-hover:border-plum-600 group-hover:bg-plum-600 group-hover:text-paper">
          <ChevronRight className="size-4" />
        </div>

        {/* Icon */}
        <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-plum-50 text-plum-600">
          <GraduationCap className="size-6" />
        </div>

        {/* Name + grade */}
        <h3 className="mt-3 text-lg font-normal text-ink-900">{batch.name}</h3>
        {batch.grade && (
          <p className="mt-0.5 text-xs text-ink-500">{batch.grade}</p>
        )}

        {/* Bottom chips */}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {showJoinCodeChip ? (
            <span className="inline-flex items-center gap-2 rounded-[8px] border border-dashed border-hair bg-paper px-2.5 py-1.5 text-xs text-ink-500">
              Code{" "}
              <span className="font-mono text-plum-700">{batch.joinCode}</span>
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
          ? "inline-flex items-center gap-1 rounded-[8px] border border-status-partial/25 bg-status-partial/10 px-2.5 py-1.5 text-xs text-status-partial [&>b]:font-semibold [&>b]:text-status-partial"
          : "inline-flex items-center gap-1 rounded-[8px] border border-hair bg-sunken/50 px-2.5 py-1.5 text-xs text-ink-500 [&>b]:font-semibold [&>b]:text-ink-900"
      }
    >
      {children}
    </span>
  );
}
