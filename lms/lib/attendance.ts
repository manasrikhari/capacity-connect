/**
 * Auto-attendance from the live classroom (Phase 4). LiveKit emits
 * `participant_joined` / `participant_left` webhooks; the live backend turns
 * those into per-trainee presence and posts a roster to
 * `POST /api/live/attendance`. This module is the pure decision layer —
 * "was this trainee present enough to count?" — kept free of Prisma so the
 * boundary cases can be unit-tested directly (the house style, cf.
 * `lib/eligibility.ts`).
 */

export type AttendanceMark = "PRESENT" | "ABSENT";

/** A trainee counts as present once they've been in the room this fraction of the class. */
export const DEFAULT_PRESENCE_THRESHOLD = 0.5;

/** One continuous stint in the room, as epoch-millisecond timestamps. */
export type PresenceInterval = { joinedAt: number; leftAt: number };

/**
 * Total seconds a participant was present, merging overlapping/duplicate
 * intervals (a flaky connection can fire join/leave several times, and a
 * multi-device join produces genuinely overlapping stints — both must count
 * once, not twice). Malformed intervals (leftAt <= joinedAt) are dropped.
 */
export function totalPresenceSeconds(intervals: PresenceInterval[]): number {
  const valid = intervals
    .filter((i) => Number.isFinite(i.joinedAt) && Number.isFinite(i.leftAt) && i.leftAt > i.joinedAt)
    .sort((a, b) => a.joinedAt - b.joinedAt);
  if (valid.length === 0) return 0;

  let totalMs = 0;
  let curStart = valid[0]!.joinedAt;
  let curEnd = valid[0]!.leftAt;
  for (let i = 1; i < valid.length; i++) {
    const iv = valid[i]!;
    if (iv.joinedAt <= curEnd) {
      curEnd = Math.max(curEnd, iv.leftAt); // overlap → extend the run
    } else {
      totalMs += curEnd - curStart;
      curStart = iv.joinedAt;
      curEnd = iv.leftAt;
    }
  }
  totalMs += curEnd - curStart;
  return Math.round(totalMs / 1000);
}

/**
 * Present when a trainee's presence meets the threshold fraction of the class.
 * A zero-or-negative class duration falls back to "present if seen at all", so
 * a room that ends before its scheduled length still records who showed up.
 */
export function attendanceStatusFromPresence(
  presenceSeconds: number,
  classDurationSeconds: number,
  threshold: number = DEFAULT_PRESENCE_THRESHOLD,
): AttendanceMark {
  if (presenceSeconds <= 0) return "ABSENT";
  if (classDurationSeconds <= 0) return "PRESENT";
  const required = classDurationSeconds * clampThreshold(threshold);
  return presenceSeconds >= required ? "PRESENT" : "ABSENT";
}

function clampThreshold(t: number): number {
  if (!Number.isFinite(t)) return DEFAULT_PRESENCE_THRESHOLD;
  return Math.min(1, Math.max(0, t));
}

export type RosterEntry = { userId: string; presenceSeconds: number };

/**
 * Build the full attendance roster for a class: every approved trainee gets a
 * mark, defaulting to ABSENT for anyone who never appeared in the room. This is
 * what makes it *auto*-attendance rather than a partial "who happened to be
 * reported" list.
 */
export function buildAttendanceRoster(
  approvedTraineeIds: string[],
  present: RosterEntry[],
  classDurationSeconds: number,
  threshold: number = DEFAULT_PRESENCE_THRESHOLD,
): { userId: string; status: AttendanceMark }[] {
  const seconds = new Map<string, number>();
  for (const p of present) {
    // A trainee can appear more than once across devices — keep the longest.
    seconds.set(p.userId, Math.max(seconds.get(p.userId) ?? 0, p.presenceSeconds));
  }
  return approvedTraineeIds.map((userId) => ({
    userId,
    status: attendanceStatusFromPresence(seconds.get(userId) ?? 0, classDurationSeconds, threshold),
  }));
}
