import { describe, expect, it } from "vitest";
import {
  compareWeeks,
  courseProgress,
  emptyWeekContent,
  type WeekContent,
  weekProgress,
  weekStatusLabel,
} from "@/lib/course-week";

const NOW = new Date("2026-06-15T00:00:00Z");

function week(partial: Partial<Record<keyof WeekContent, [number, number]>>): WeekContent {
  const c = emptyWeekContent();
  for (const [q, [total, done]] of Object.entries(partial)) {
    c[q as keyof WeekContent] = { total, done };
  }
  return c;
}

describe("weekProgress", () => {
  it("reports an empty week rather than dividing by zero", () => {
    const p = weekProgress(emptyWeekContent());
    expect(p).toEqual({
      percent: 0,
      populated: [],
      complete: [],
      isComplete: false,
      isEmpty: true,
    });
  });

  it("counts across all populated quadrants", () => {
    const p = weekProgress(week({ video: [2, 1], reading: [2, 2] }));
    expect(p.percent).toBe(75);
    expect(p.populated).toEqual(["video", "reading"]);
    expect(p.complete).toEqual(["reading"]);
    expect(p.isComplete).toBe(false);
  });

  it("excludes empty quadrants from the denominator", () => {
    // A week with only a reading and a quiz, both done, is 100% — not 50%
    // because it happens to have no recording.
    const p = weekProgress(week({ reading: [1, 1], assessment: [1, 1] }));
    expect(p.percent).toBe(100);
    expect(p.isComplete).toBe(true);
    expect(p.populated).toEqual(["reading", "assessment"]);
  });

  it("never exceeds 100% when done overshoots total", () => {
    // A trainee can post several times in one discussion thread.
    const p = weekProgress(week({ discussion: [1, 5] }));
    expect(p.percent).toBe(100);
    expect(p.isComplete).toBe(true);
  });

  it("is 0% for a populated but untouched week", () => {
    const p = weekProgress(week({ video: [3, 0], assessment: [1, 0] }));
    expect(p.percent).toBe(0);
    expect(p.isComplete).toBe(false);
    expect(p.isEmpty).toBe(false);
  });

  it("rounds to the nearest whole percent", () => {
    expect(weekProgress(week({ reading: [3, 1] })).percent).toBe(33);
    expect(weekProgress(week({ reading: [3, 2] })).percent).toBe(67);
  });
});

describe("courseProgress", () => {
  it("is zero for a course with no content", () => {
    expect(courseProgress([])).toEqual({ percent: 0, weeksComplete: 0, weeksPopulated: 0 });
    expect(courseProgress([emptyWeekContent()])).toEqual({
      percent: 0,
      weeksComplete: 0,
      weeksPopulated: 0,
    });
  });

  it("weights by item count, not by week", () => {
    // Week A: 1 item done. Week B: 9 items, none done. A week-averaged figure
    // would say 50%; the honest answer is 10%.
    const p = courseProgress([week({ reading: [1, 1] }), week({ video: [9, 0] })]);
    expect(p.percent).toBe(10);
    expect(p.weeksPopulated).toBe(2);
    expect(p.weeksComplete).toBe(1);
  });

  it("skips empty weeks when counting", () => {
    const p = courseProgress([week({ reading: [2, 2] }), emptyWeekContent()]);
    expect(p.percent).toBe(100);
    expect(p.weeksPopulated).toBe(1);
    expect(p.weeksComplete).toBe(1);
  });
});

describe("compareWeeks", () => {
  it("orders numbered weeks ascending", () => {
    const sorted = [{ index: 3 }, { index: 1 }, { index: 2 }].sort(compareWeeks);
    expect(sorted.map((w) => w.index)).toEqual([1, 2, 3]);
  });

  it("sorts the unsorted bucket (index 0) last, not first", () => {
    const sorted = [{ index: 0 }, { index: 2 }, { index: 1 }].sort(compareWeeks);
    expect(sorted.map((w) => w.index)).toEqual([1, 2, 0]);
  });

  it("is stable between two unsorted buckets", () => {
    expect(compareWeeks({ index: 0 }, { index: 0 })).toBe(0);
  });
});

describe("weekStatusLabel", () => {
  it("is null for a week already open or with no date", () => {
    expect(weekStatusLabel(null, NOW)).toBeNull();
    expect(weekStatusLabel(new Date("2026-06-01"), NOW)).toBeNull();
    expect(weekStatusLabel(NOW, NOW)).toBeNull();
  });

  it("counts days to a future opening", () => {
    expect(weekStatusLabel(new Date("2026-06-16T00:00:00Z"), NOW)).toBe("Opens tomorrow");
    expect(weekStatusLabel(new Date("2026-06-20T00:00:00Z"), NOW)).toBe("Opens in 5 days");
  });
});
