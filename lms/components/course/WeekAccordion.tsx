"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  MessagesSquare,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { type Quadrant, QUADRANT_LABEL, weekStatusLabel } from "@/lib/course-week";
import type { WeekItem, WeekView } from "@/lib/course-week-db";

const QUADRANT_ICON: Record<Quadrant, React.ComponentType<{ className?: string }>> = {
  video: PlayCircle,
  reading: FileText,
  assessment: ClipboardList,
  discussion: MessagesSquare,
};

/**
 * A course rendered as SWAYAM weeks, each carrying all four quadrants.
 *
 * Weeks are never gated: `opensAt` shows as a label and the content stays
 * clickable, so a reviewer can look ahead.
 */
export function WeekAccordion({ weeks }: { weeks: WeekView[] }) {
  // Open the first week that still has something to do, so a returning trainee
  // lands where they left off rather than at the top every time.
  const firstIncomplete = weeks.findIndex((w) => !w.progress.isEmpty && !w.progress.isComplete);
  const [openId, setOpenId] = useState<string | null>(
    weeks[firstIncomplete === -1 ? 0 : firstIncomplete]?.id ?? null,
  );

  return (
    <div className="space-y-3">
      {weeks.map((w) => {
        const key = w.id ?? "unsorted";
        const isOpen = openId === key || openId === w.id;
        const status = weekStatusLabel(w.opensAt);

        return (
          <Card key={key} className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : key)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-sunken"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                    {w.index > 0 ? `Week ${w.index}` : "Unsorted"}
                  </span>
                  {status && <Badge color="amber">{status}</Badge>}
                  {w.progress.isComplete && (
                    <Badge color="green">
                      <span className="inline-flex items-center gap-1">
                        <Check className="size-3" />
                        Complete
                      </span>
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 truncate text-base font-medium text-ink-900">{w.title}</p>
                {w.summary && <p className="truncate text-sm text-ink-500">{w.summary}</p>}
              </div>

              {!w.progress.isEmpty && (
                <div className="hidden w-40 shrink-0 sm:block">
                  <ProgressBar percent={w.progress.percent} />
                </div>
              )}

              {isOpen ? (
                <ChevronUp className="size-4 shrink-0 text-ink-300" />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-ink-300" />
              )}
            </button>

            {isOpen && (
              <div className="border-t border-hair px-5 py-4">
                {w.progress.isEmpty ? (
                  <p className="text-sm text-ink-300">Nothing published for this week yet.</p>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <QuadrantBlock quadrant="video" items={w.video} />
                    <QuadrantBlock quadrant="reading" items={w.reading} />
                    <QuadrantBlock quadrant="assessment" items={w.assessment} />
                    <QuadrantBlock quadrant="discussion" items={w.discussion} />
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function QuadrantBlock({ quadrant, items }: { quadrant: Quadrant; items: WeekItem[] }) {
  if (items.length === 0) return null;
  const Icon = QUADRANT_ICON[quadrant];

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
        <Icon className="size-3.5" />
        {QUADRANT_LABEL[quadrant]}
      </p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-sunken"
            >
              <span
                aria-hidden="true"
                className={
                  item.done
                    ? "flex size-4 shrink-0 items-center justify-center rounded-full bg-sage-500 text-paper"
                    : "size-4 shrink-0 rounded-full border border-hair-strong"
                }
              >
                {item.done && <Check className="size-2.5" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink-900">{item.title}</span>
              {item.meta && (
                <span className="shrink-0 font-mono text-[10px] text-ink-300">{item.meta}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={percent === 100 ? "h-full bg-sage-500" : "h-full bg-plum-500"}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-500">{percent}%</span>
    </div>
  );
}
