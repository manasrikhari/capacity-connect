"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  MessagesSquare,
  PenLine,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ItemKind, WeekItem, WeekView } from "@/lib/course-week-db";
import { cn } from "@/lib/utils";

const ICON: Record<ItemKind, React.ComponentType<{ className?: string }>> = {
  library: PlayCircle,
  note: FileText,
  test: ClipboardList,
  assignment: PenLine,
  thread: MessagesSquare,
};

/**
 * The course rail, modelled on SWAYAM's player: overall progress at the top,
 * then each week as a collapsible section holding one flat checklist.
 *
 * Deliberately *not* grouped by quadrant. The four quadrants are how progress
 * is scored, but presenting them as four separate boxes fragments a week that
 * a trainee reads as a single sequence — lectures, notes, quiz, discussion.
 */
export function CourseRail({
  weeks,
  percent,
  doneCount,
  totalCount,
}: {
  weeks: WeekView[];
  percent: number;
  doneCount: number;
  totalCount: number;
}) {
  const pathname = usePathname();

  // Open the week containing whatever is on screen; failing that, the first
  // week with something left to do.
  const activeWeekKey =
    weeks.find((w) => w.items.some((i) => i.href === pathname))?.id ??
    weeks.find((w) => !w.progress.isEmpty && !w.progress.isComplete)?.id ??
    weeks[0]?.id ??
    null;

  const [open, setOpen] = useState<Set<string>>(new Set([activeWeekKey ?? "unsorted"]));

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <nav aria-label="Course contents" className="flex h-full flex-col">
      {/* The course name is already on the batch switcher directly above this
          rail, and again as the overview's heading — a third copy is noise. */}
      <div className="border-b border-hair px-4 py-4">
        <div className="flex items-baseline justify-between gap-2">
          <Link
            href="/student/course"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300 transition-colors hover:text-ink-700"
          >
            Course progress
          </Link>
          <span className="text-sm font-medium text-ink-900">
            {percent}%{" "}
            <span className="font-mono text-[11px] font-normal text-ink-500">
              ({doneCount} of {totalCount})
            </span>
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
          <div
            className={cn("h-full", percent === 100 ? "bg-sage-500" : "bg-plum-500")}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto py-1">
        {weeks.map((w) => {
          const key = w.id ?? "unsorted";
          const isOpen = open.has(key);
          return (
            <li key={key} className="border-b border-hair/60 last:border-0">
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-sunken"
              >
                {isOpen ? (
                  <ChevronDown className="size-4 shrink-0 text-ink-300" />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-ink-300" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink-900">
                    {w.index > 0 ? `Week ${w.index}` : "Unsorted"}
                  </span>
                  <span className="block truncate text-xs text-ink-500">{w.title}</span>
                </span>
                {!w.progress.isEmpty && (
                  <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-300">
                    {w.progress.complete.length === w.progress.populated.length ? "✓" : `${w.progress.percent}%`}
                  </span>
                )}
              </button>

              {isOpen && (
                <ul className="pb-2">
                  {w.items.length === 0 ? (
                    <li className="px-4 pb-2 pl-10 text-xs text-ink-300">Nothing published yet.</li>
                  ) : (
                    w.items.map((item) => (
                      <RailItem key={item.href} item={item} active={pathname === item.href} />
                    ))
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function RailItem({ item, active }: { item: WeekItem; active: boolean }) {
  const Icon = ICON[item.kind];
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-start gap-2.5 py-2 pl-10 pr-4 transition-colors",
          active ? "bg-plum-50" : "hover:bg-sunken",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
            item.done ? "bg-sage-500 text-paper" : "border border-hair-strong",
          )}
        >
          {item.done && <Check className="size-2.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-[13px] leading-snug",
              active ? "font-medium text-plum-700" : "text-ink-700",
            )}
          >
            {item.title}
          </span>
          {item.meta && (
            <span className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-ink-300">
              <Icon className="size-2.5" />
              {item.meta}
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}
