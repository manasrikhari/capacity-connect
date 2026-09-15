import { CalendarDays, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { type CatalogueCourse, } from "@/lib/catalogue-db";
import { coursePhase, daysUntilStart, durationWeeks } from "@/lib/catalogue";
import { formatDate } from "@/lib/utils";

/**
 * One course in the public catalogue. Deliberately carries no join code — the
 * catalogue is a public surface and `joinCode` is the private handle for
 * closed cohorts.
 */
export function CourseCard({ course }: { course: CatalogueCourse }) {
  const phase = coursePhase(course.startDate, course.endDate);
  const startsIn = daysUntilStart(course.startDate);
  const weeks = durationWeeks(course.startDate, course.endDate);
  const href = `/courses/${course.slug ?? course.id}`;

  return (
    <li>
      <Link
        href={href}
        className="flex h-full flex-col rounded-2xl border border-hair bg-paper p-5 transition-colors hover:border-plum-300"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge color={phase.color}>{phase.label}</Badge>
          {course.wmoTier && <Badge color="blue">{course.wmoTier}</Badge>}
          {course.level && <Badge color="slate">{course.level}</Badge>}
        </div>

        <h2 className="font-display text-lg font-normal leading-snug text-ink-900">{course.name}</h2>

        {course.domain && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-300">
            {course.domain}
            {course.department ? ` · ${course.department}` : ""}
          </p>
        )}

        {course.description && (
          <p className="mt-2 line-clamp-3 text-sm text-ink-500">{course.description}</p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
            {course.startDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-ink-300" />
                {formatDate(course.startDate)}
                {weeks ? ` · ${weeks} week${weeks === 1 ? "" : "s"}` : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5 text-ink-300" />
              {course.enrolledCount} enrolled
            </span>
          </div>
          {startsIn !== null && startsIn <= 30 && (
            <p className="mt-2 text-xs font-medium text-plum-600">
              Starts in {startsIn} day{startsIn === 1 ? "" : "s"}
            </p>
          )}
          {course.trainerName && (
            <p className="mt-2 truncate text-xs text-ink-300">Led by {course.trainerName}</p>
          )}
        </div>
      </Link>
    </li>
  );
}
