import "server-only";
import {
  compareWeeks,
  emptyWeekContent,
  type WeekContent,
  type WeekProgress,
  weekProgress,
} from "@/lib/course-week";
import { prisma } from "@/lib/prisma";

/** The kinds of item a week can hold, in the order SWAYAM presents them. */
export type ItemKind = "library" | "note" | "test" | "assignment" | "thread";

export type WeekItem = {
  kind: ItemKind;
  id: string;
  title: string;
  /** Route in the course player: /student/course/<kind>/<id>. */
  href: string;
  /** Sub-label — duration, question count, due date. */
  meta: string | null;
  done: boolean;
};

export type WeekView = {
  id: string | null;
  index: number;
  title: string;
  summary: string | null;
  opensAt: Date | null;
  video: WeekItem[];
  reading: WeekItem[];
  assessment: WeekItem[];
  discussion: WeekItem[];
  /**
   * Every item in one flat, ordered sequence — recordings, then readings, then
   * assessments, then discussion.
   *
   * SWAYAM's own player lists a week as a single checklist rather than four
   * boxes; the quadrant arrays above are kept because progress is scored per
   * quadrant, but the rail reads from this.
   */
  items: WeekItem[];
  progress: WeekProgress;
};

/** The bucket for content created before weeks existed. Index 0 sorts last. */
const UNSORTED_INDEX = 0;

/**
 * Assemble a course as weeks, each carrying all four SWAYAM quadrants, with
 * this trainee's completion marked.
 *
 * `traineeId` is optional: the trainer's view of the same structure passes
 * nothing and gets the content with everything unmarked.
 */
export async function getCourseWeeks(batchId: string, traineeId?: string): Promise<WeekView[]> {
  const [weeks, libraryItems, notes, tests, assignments, threads] = await Promise.all([
    prisma.courseWeek.findMany({
      where: { batchId },
      orderBy: { index: "asc" },
      select: { id: true, index: true, title: true, summary: true, opensAt: true },
    }),
    prisma.libraryItem.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, type: true, durationMins: true, weekId: true },
    }),
    prisma.note.findMany({
      where: { batchId },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, subject: true, weekId: true },
    }),
    prisma.test.findMany({
      where: { batchId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        weekId: true,
        closesAt: true,
        _count: { select: { questions: true } },
      },
    }),
    prisma.assignment.findMany({
      where: { batchId, isPublished: true },
      orderBy: { createdAt: "asc" },
      select: { id: true, title: true, weekId: true, dueAt: true, maxPoints: true },
    }),
    prisma.discussionThread.findMany({
      where: { batchId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        weekId: true,
        isResolved: true,
        _count: { select: { posts: true } },
      },
    }),
  ]);

  // What this trainee has already done. One round trip per evidence kind, and
  // skipped entirely for the trainer's view.
  const [views, attempts, submissions, postedThreadIds] = traineeId
    ? await Promise.all([
        prisma.contentView.findMany({
          where: { traineeId },
          select: { itemType: true, itemId: true },
        }),
        prisma.testAttempt.findMany({
          where: { studentId: traineeId, batchId },
          select: { testId: true },
        }),
        prisma.assignmentSubmission.findMany({
          where: { traineeId, assignment: { batchId } },
          select: { assignmentId: true, totalScore: true },
        }),
        prisma.discussionPost
          .findMany({
            where: { authorId: traineeId, thread: { batchId } },
            select: { threadId: true },
            distinct: ["threadId"],
          })
          .then((rows) => rows.map((r) => r.threadId)),
      ])
    : [[], [], [], [] as string[]];

  const viewed = new Set(views.map((v) => `${v.itemType}:${v.itemId}`));
  const attempted = new Set(attempts.map((a) => a.testId));
  const submitted = new Set(submissions.map((s) => s.assignmentId));
  const posted = new Set(postedThreadIds);

  const byId = new Map<string | null, WeekView>();
  const make = (
    id: string | null,
    index: number,
    title: string,
    summary: string | null,
    opensAt: Date | null,
  ): WeekView => ({
    id,
    index,
    title,
    summary,
    opensAt,
    video: [],
    reading: [],
    assessment: [],
    discussion: [],
    items: [],
    progress: weekProgress(emptyWeekContent()),
  });

  for (const w of weeks) {
    byId.set(w.id, make(w.id, w.index, w.title, w.summary, w.opensAt));
  }

  /** Lazily create the Unsorted bucket only if something lands in it. */
  function bucket(weekId: string | null): WeekView {
    const key = weekId && byId.has(weekId) ? weekId : null;
    let view = byId.get(key);
    if (!view) {
      view = make(null, UNSORTED_INDEX, "Unsorted", "Content not yet placed in a week.", null);
      byId.set(null, view);
    }
    return view;
  }

  for (const item of libraryItems) {
    bucket(item.weekId).video.push({
      kind: "library",
      id: item.id,
      title: item.title,
      href: `/student/course/library/${item.id}`,
      meta: item.durationMins ? `${item.durationMins} min` : item.type.replace(/_/g, " ").toLowerCase(),
      done: viewed.has(`LIBRARY:${item.id}`),
    });
  }

  for (const note of notes) {
    bucket(note.weekId).reading.push({
      kind: "note",
      id: note.id,
      title: note.title,
      href: `/student/course/note/${note.id}`,
      meta: note.subject,
      done: viewed.has(`NOTE:${note.id}`),
    });
  }

  for (const test of tests) {
    bucket(test.weekId).assessment.push({
      kind: "test",
      id: test.id,
      title: test.title,
      href: `/student/course/test/${test.id}`,
      meta: `${test._count.questions} question${test._count.questions === 1 ? "" : "s"}`,
      done: attempted.has(test.id),
    });
  }

  for (const a of assignments) {
    bucket(a.weekId).assessment.push({
      kind: "assignment",
      id: a.id,
      title: a.title,
      href: `/student/course/assignment/${a.id}`,
      meta: `Assignment · ${a.maxPoints} points`,
      done: submitted.has(a.id),
    });
  }

  for (const t of threads) {
    bucket(t.weekId).discussion.push({
      kind: "thread",
      id: t.id,
      title: t.title,
      href: `/student/course/thread/${t.id}`,
      meta: `${t._count.posts} repl${t._count.posts === 1 ? "y" : "ies"}${t.isResolved ? " · answered" : ""}`,
      done: posted.has(t.id),
    });
  }

  const views2: WeekView[] = [...byId.values()];
  for (const w of views2) {
    const content: WeekContent = {
      video: { total: w.video.length, done: w.video.filter((i) => i.done).length },
      reading: { total: w.reading.length, done: w.reading.filter((i) => i.done).length },
      assessment: {
        total: w.assessment.length,
        done: w.assessment.filter((i) => i.done).length,
      },
      discussion: {
        total: w.discussion.length,
        done: w.discussion.filter((i) => i.done).length,
      },
    };
    w.progress = weekProgress(content);
    w.items = [...w.video, ...w.reading, ...w.assessment, ...w.discussion];
  }

  return views2.sort(compareWeeks);
}

/** Record that a trainee opened a piece of content. Never throws. */
export async function recordView(
  traineeId: string,
  itemType: "LIBRARY" | "NOTE",
  itemId: string,
): Promise<void> {
  try {
    await prisma.contentView.upsert({
      where: { traineeId_itemType_itemId: { traineeId, itemType, itemId } },
      create: { traineeId, itemType, itemId },
      update: {},
    });
  } catch (err) {
    // Progress tracking must never break the page the trainee came to read.
    console.error("[recordView] failed", itemType, itemId, err);
  }
}
