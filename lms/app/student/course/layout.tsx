import { redirect } from "next/navigation";
import { CourseRail } from "@/components/course/CourseRail";
import { getActiveStudentBatch } from "@/lib/batch";
import { courseProgress, emptyWeekContent, type WeekContent } from "@/lib/course-week";
import { getCourseWeeks } from "@/lib/course-week-db";
import { getSession } from "@/lib/session";

/**
 * The course player: a persistent rail on the left, the selected item on the
 * right — the shape SWAYAM uses, so a trainee never loses their place in the
 * course to read one note.
 *
 * The rail lives in the layout rather than each page, so navigating between
 * items re-renders only the right pane and the rail's open/closed weeks and
 * scroll position survive.
 */
export default async function CourseLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const weeks = await getCourseWeeks(batch.id, session.user.id);

  const contents: WeekContent[] = weeks.map((w) => {
    const c = emptyWeekContent();
    c.video = { total: w.video.length, done: w.video.filter((i) => i.done).length };
    c.reading = { total: w.reading.length, done: w.reading.filter((i) => i.done).length };
    c.assessment = { total: w.assessment.length, done: w.assessment.filter((i) => i.done).length };
    c.discussion = { total: w.discussion.length, done: w.discussion.filter((i) => i.done).length };
    return c;
  });
  const overall = courseProgress(contents);

  const allItems = weeks.flatMap((w) => w.items);
  const doneCount = allItems.filter((i) => i.done).length;

  return (
    <div className="-m-4 flex min-h-[calc(100vh-4rem)] flex-col md:-m-6 lg:flex-row">
      <aside className="shrink-0 border-b border-hair bg-paper lg:h-[calc(100vh-4rem)] lg:w-[22rem] lg:border-b-0 lg:border-r">
        <CourseRail
          weeks={weeks}
          percent={overall.percent}
          doneCount={doneCount}
          totalCount={allItems.length}
        />
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
