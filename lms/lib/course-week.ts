/**
 * Week and progress logic for the SWAYAM four-quadrant course experience.
 *
 * Pure — no Prisma, no React — so the progress arithmetic can be tested
 * directly, the same split as `lib/eligibility.ts` and `lib/catalogue.ts`.
 */

/** SWAYAM's four quadrants, in the order the course page presents them. */
export const QUADRANTS = ["video", "reading", "assessment", "discussion"] as const;
export type Quadrant = (typeof QUADRANTS)[number];

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  video: "Watch",
  reading: "Read",
  assessment: "Assess",
  discussion: "Discuss",
};

/** What a week contains, and what this trainee has done with it. */
export type QuadrantState = {
  /** Items the trainee could engage with. Zero means the quadrant is empty. */
  total: number;
  /** Items they have — viewed, attempted, submitted, or posted in. */
  done: number;
};

export type WeekContent = Record<Quadrant, QuadrantState>;

export type WeekProgress = {
  /** 0-100, over the quadrants that actually have content. */
  percent: number;
  /** Quadrants carrying at least one item. */
  populated: Quadrant[];
  /** Quadrants fully completed. */
  complete: Quadrant[];
  /** True when every populated quadrant is complete. */
  isComplete: boolean;
  /** True when the week carries nothing at all. */
  isEmpty: boolean;
};

/**
 * Progress across one week.
 *
 * Empty quadrants are excluded from the denominator rather than counted as
 * incomplete: a week with a reading and a quiz but no recording is a complete
 * week once both are done, and scoring it 50% would punish the trainer for the
 * shape of their course rather than describing the trainee.
 */
export function weekProgress(content: WeekContent): WeekProgress {
  const populated: Quadrant[] = [];
  const complete: Quadrant[] = [];
  let total = 0;
  let done = 0;

  for (const q of QUADRANTS) {
    const state = content[q];
    if (!state || state.total <= 0) continue;
    populated.push(q);
    total += state.total;
    // Guard against a `done` that exceeds `total` — a trainee can post twice in
    // one thread, and progress must never read 130%.
    const clamped = Math.min(state.done, state.total);
    done += clamped;
    if (clamped >= state.total) complete.push(q);
  }

  if (populated.length === 0) {
    return { percent: 0, populated: [], complete: [], isComplete: false, isEmpty: true };
  }

  return {
    percent: Math.round((done / total) * 100),
    populated,
    complete,
    isComplete: complete.length === populated.length,
    isEmpty: false,
  };
}

/**
 * Progress across a whole course.
 *
 * Weighted by item count, not by week, so a heavy week counts for more than a
 * week holding a single reading.
 */
export function courseProgress(weeks: WeekContent[]): {
  percent: number;
  weeksComplete: number;
  weeksPopulated: number;
} {
  let total = 0;
  let done = 0;
  let weeksComplete = 0;
  let weeksPopulated = 0;

  for (const week of weeks) {
    const p = weekProgress(week);
    if (p.isEmpty) continue;
    weeksPopulated += 1;
    if (p.isComplete) weeksComplete += 1;
    for (const q of p.populated) {
      total += week[q].total;
      done += Math.min(week[q].done, week[q].total);
    }
  }

  return {
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    weeksComplete,
    weeksPopulated,
  };
}

/** An empty content record — the starting point when assembling a week. */
export function emptyWeekContent(): WeekContent {
  return {
    video: { total: 0, done: 0 },
    reading: { total: 0, done: 0 },
    assessment: { total: 0, done: 0 },
    discussion: { total: 0, done: 0 },
  };
}

/**
 * Order weeks for display: by index, with anything unnumbered last.
 *
 * Content that predates the week structure lands in an "Unsorted" bucket which
 * carries index 0 and must sort after the real weeks, not before them.
 */
export function compareWeeks(a: { index: number }, b: { index: number }): number {
  if (a.index === 0) return b.index === 0 ? 0 : 1;
  if (b.index === 0) return -1;
  return a.index - b.index;
}

/** Label for a week's release date — shown, never enforced. */
export function weekStatusLabel(
  opensAt: Date | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!opensAt) return null;
  if (opensAt <= now) return null;
  const days = Math.ceil((opensAt.getTime() - now.getTime()) / 86_400_000);
  return days === 1 ? "Opens tomorrow" : `Opens in ${days} days`;
}
