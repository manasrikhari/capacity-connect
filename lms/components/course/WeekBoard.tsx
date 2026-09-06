"use client";

import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Inbox,
  MessagesSquare,
  PenLine,
  PlayCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { assignToWeekAction, createWeekAction, deleteWeekAction } from "@/app/admin/weeks/actions";
import { Card } from "@/components/ui/Card";
import { FieldError, Input, Select, Textarea } from "@/components/ui/Field";
import { initialActionState } from "@/lib/action-state";
import { cn, formatDate } from "@/lib/utils";

export type BoardItem = {
  kind: "LIBRARY" | "NOTE" | "TEST" | "ASSIGNMENT";
  id: string;
  title: string;
  weekId: string | null;
};

export type BoardWeek = {
  id: string;
  index: number;
  title: string;
  summary: string | null;
  opensAt: Date | null;
};

const ICON = {
  LIBRARY: PlayCircle,
  NOTE: FileText,
  TEST: ClipboardList,
  ASSIGNMENT: PenLine,
} as const;

const KIND_LABEL = {
  LIBRARY: "Recording",
  NOTE: "Reading",
  TEST: "Quiz",
  ASSIGNMENT: "Assignment",
} as const;

/**
 * The trainer's mirror of the trainee's course rail.
 *
 * Previously this screen showed weeks in one card and an unrelated flat list of
 * every item in another, so a trainer had to hold the mapping in their head.
 * Here each week owns its contents, and moving an item is a select on the item
 * itself — the same shape the trainee sees, which is what makes it legible.
 */
export function WeekBoard({ weeks, items }: { weeks: BoardWeek[]; items: BoardItem[] }) {
  const [state, formAction, pending] = useActionState(createWeekAction, initialActionState);
  const [busy, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setAdding(false);
    }
  }, [state?.success]);

  const unsorted = items.filter((i) => !i.weekId);
  const byWeek = new Map<string, BoardItem[]>();
  for (const w of weeks) byWeek.set(w.id, []);
  for (const i of items) if (i.weekId && byWeek.has(i.weekId)) byWeek.get(i.weekId)!.push(i);

  function move(item: BoardItem, weekId: string) {
    startTransition(async () => {
      const res = await assignToWeekAction(item.kind, item.id, weekId || null);
      if (res?.error) toast.error(res.error);
    });
  }

  function remove(w: BoardWeek) {
    const count = byWeek.get(w.id)?.length ?? 0;
    if (
      !confirm(
        `Delete "${w.title}"? Its ${count} item${count === 1 ? "" : "s"} move to Unsorted — nothing is deleted.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteWeekAction(w.id);
      if (res?.error) toast.error(res.error);
      else toast.success("Week deleted");
    });
  }

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {weeks.map((w) => {
        const contents = byWeek.get(w.id) ?? [];
        const isOpen = !collapsed.has(w.id);
        return (
          <Card key={w.id} className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-hair px-4 py-3">
              <button
                type="button"
                onClick={() => toggle(w.id)}
                aria-expanded={isOpen}
                aria-label={isOpen ? `Collapse ${w.title}` : `Expand ${w.title}`}
                className="shrink-0 text-ink-300 hover:text-ink-700"
              >
                {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">
                  <span className="font-mono text-[11px] text-ink-300">W{w.index}</span> {w.title}
                </p>
                <p className="text-xs text-ink-500">
                  {contents.length} item{contents.length === 1 ? "" : "s"}
                  {w.opensAt ? ` · opens ${formatDate(w.opensAt)}` : ""}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(w)}
                aria-label={`Delete ${w.title}`}
                className="shrink-0 rounded-full p-1.5 text-ink-300 transition-colors hover:bg-status-unpaid/10 hover:text-status-unpaid disabled:opacity-40"
              >
                <Trash2 className="size-4" />
              </button>
            </div>

            {isOpen && (
              <ItemRows items={contents} weeks={weeks} busy={busy} onMove={move} emptyHint="Nothing in this week yet — move something up from Unsorted." />
            )}
          </Card>
        );
      })}

      {/* Unsorted always renders last, and only when it has something in it. */}
      {unsorted.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b border-hair bg-sunken px-4 py-3">
            <Inbox className="size-4 shrink-0 text-ink-300" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">Unsorted</p>
              <p className="text-xs text-ink-500">
                {unsorted.length} item{unsorted.length === 1 ? "" : "s"} not yet placed in a week.
                Trainees can still see these.
              </p>
            </div>
          </div>
          <ItemRows items={unsorted} weeks={weeks} busy={busy} onMove={move} emptyHint="" />
        </Card>
      )}

      {adding ? (
        <Card>
          <form ref={formRef} action={formAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_11rem]">
              <div>
                <Input name="title" placeholder="Week title, e.g. Radar fundamentals" required autoFocus />
                <FieldError>{state?.fieldErrors?.title?.[0]}</FieldError>
              </div>
              <div>
                <Input name="opensAt" type="date" aria-label="Opens on" />
                <FieldError>{state?.fieldErrors?.opensAt?.[0]}</FieldError>
              </div>
            </div>
            <Textarea name="summary" rows={2} placeholder="What this week covers (optional)" />
            {state?.error && (
              <p className="rounded-xl bg-sunken px-3 py-2 text-sm text-status-unpaid">
                {state.error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
              >
                {pending ? "Adding…" : "Add week"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-lg border border-hair px-4 py-2 text-sm text-ink-500 hover:text-ink-900"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-hair-strong py-3 text-sm text-ink-500 transition-colors hover:border-plum-300 hover:text-ink-900"
        >
          <Plus className="size-4" />
          Add a week
        </button>
      )}
    </div>
  );
}

function ItemRows({
  items,
  weeks,
  busy,
  onMove,
  emptyHint,
}: {
  items: BoardItem[];
  weeks: BoardWeek[];
  busy: boolean;
  onMove: (item: BoardItem, weekId: string) => void;
  emptyHint: string;
}) {
  if (items.length === 0) {
    return emptyHint ? <p className="px-4 py-3 text-xs text-ink-300">{emptyHint}</p> : null;
  }

  return (
    <ul className="divide-y divide-hair">
      {items.map((item) => {
        const Icon = ICON[item.kind];
        return (
          <li
            key={`${item.kind}:${item.id}`}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <Icon className="size-4 shrink-0 text-ink-300" />
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-900">{item.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  {KIND_LABEL[item.kind]}
                </p>
              </div>
            </div>
            <Select
              aria-label={`Week for ${item.title}`}
              defaultValue={item.weekId ?? ""}
              disabled={busy || weeks.length === 0}
              onChange={(e) => onMove(item, e.target.value)}
              className={cn("w-auto shrink-0", busy && "opacity-60")}
            >
              <option value="">Unsorted</option>
              {weeks.map((w) => (
                <option key={w.id} value={w.id}>
                  Week {w.index} — {w.title}
                </option>
              ))}
            </Select>
          </li>
        );
      })}
    </ul>
  );
}
