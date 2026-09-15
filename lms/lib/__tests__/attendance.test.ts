import { describe, expect, it } from "vitest";
import {
  attendanceStatusFromPresence,
  buildAttendanceRoster,
  totalPresenceSeconds,
  DEFAULT_PRESENCE_THRESHOLD,
} from "@/lib/attendance";

const t0 = 1_700_000_000_000; // a fixed epoch base for readable intervals
const at = (startSec: number, endSec: number) => ({ joinedAt: t0 + startSec * 1000, leftAt: t0 + endSec * 1000 });

describe("totalPresenceSeconds", () => {
  it("sums disjoint intervals", () => {
    expect(totalPresenceSeconds([at(0, 60), at(120, 180)])).toBe(120);
  });
  it("merges overlapping intervals (multi-device / reconnect)", () => {
    expect(totalPresenceSeconds([at(0, 100), at(50, 150)])).toBe(150);
  });
  it("merges touching intervals", () => {
    expect(totalPresenceSeconds([at(0, 60), at(60, 120)])).toBe(120);
  });
  it("is order-independent", () => {
    expect(totalPresenceSeconds([at(120, 180), at(0, 60)])).toBe(120);
  });
  it("drops malformed intervals", () => {
    expect(totalPresenceSeconds([at(100, 100), at(200, 100), at(0, 30)])).toBe(30);
  });
  it("is zero for no intervals", () => {
    expect(totalPresenceSeconds([])).toBe(0);
  });
});

describe("attendanceStatusFromPresence", () => {
  it("is ABSENT with zero presence", () => {
    expect(attendanceStatusFromPresence(0, 3600)).toBe("ABSENT");
  });
  it("is PRESENT exactly at the threshold boundary", () => {
    expect(attendanceStatusFromPresence(1800, 3600, 0.5)).toBe("PRESENT");
  });
  it("is ABSENT just below the threshold", () => {
    expect(attendanceStatusFromPresence(1799, 3600, 0.5)).toBe("ABSENT");
  });
  it("defaults to a 50% threshold", () => {
    expect(DEFAULT_PRESENCE_THRESHOLD).toBe(0.5);
    expect(attendanceStatusFromPresence(1800, 3600)).toBe("PRESENT");
  });
  it("falls back to present-if-seen when duration is unknown", () => {
    expect(attendanceStatusFromPresence(30, 0)).toBe("PRESENT");
    expect(attendanceStatusFromPresence(0, 0)).toBe("ABSENT");
  });
  it("clamps an out-of-range threshold", () => {
    expect(attendanceStatusFromPresence(1, 3600, 5)).toBe("ABSENT"); // >1 clamps to 1
    expect(attendanceStatusFromPresence(1, 3600, -1)).toBe("PRESENT"); // <0 clamps to 0
  });
});

describe("buildAttendanceRoster", () => {
  it("marks unseen approved trainees ABSENT and present ones PRESENT", () => {
    const roster = buildAttendanceRoster(
      ["a", "b", "c"],
      [
        { userId: "a", presenceSeconds: 3000 },
        { userId: "b", presenceSeconds: 100 },
      ],
      3600,
    );
    expect(roster).toEqual([
      { userId: "a", status: "PRESENT" },
      { userId: "b", status: "ABSENT" },
      { userId: "c", status: "ABSENT" },
    ]);
  });
  it("keeps the longest stint when a trainee is reported twice", () => {
    const roster = buildAttendanceRoster(
      ["a"],
      [
        { userId: "a", presenceSeconds: 100 },
        { userId: "a", presenceSeconds: 3000 },
      ],
      3600,
    );
    expect(roster).toEqual([{ userId: "a", status: "PRESENT" }]);
  });
  it("ignores presence from non-approved trainees", () => {
    const roster = buildAttendanceRoster(["a"], [{ userId: "ghost", presenceSeconds: 3600 }], 3600);
    expect(roster).toEqual([{ userId: "a", status: "ABSENT" }]);
  });
});
