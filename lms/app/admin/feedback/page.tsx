import { redirect } from "next/navigation";
import {
  type AnonymousEntry,
  type FeedbackAverages,
  FeedbackSummary,
} from "@/components/feedback/FeedbackSummary";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Average of the defined values, or null when there are none. */
function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export default async function AdminFeedbackPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const feedbacks = await prisma.feedback.findMany({
    where: { batchId: batch.id },
    orderBy: { createdAt: "desc" },
    select: {
      traineeId: true,
      overallRating: true,
      contentRating: true,
      trainerRating: true,
      infrastructureRating: true,
      comments: true,
      suggestions: true,
    },
  });

  // Join each trainee's designation for anonymised attribution (never names).
  const traineeIds = feedbacks.map((f) => f.traineeId);
  const profiles =
    traineeIds.length > 0
      ? await prisma.profile.findMany({
          where: { userId: { in: traineeIds } },
          select: { userId: true, designation: true },
        })
      : [];
  const designationByUser = new Map(profiles.map((p) => [p.userId, p.designation ?? ""]));

  const averages: FeedbackAverages = {
    overall: average(feedbacks.map((f) => f.overallRating)),
    content: average(feedbacks.map((f) => f.contentRating)),
    trainer: average(feedbacks.map((f) => f.trainerRating)),
    infrastructure: average(feedbacks.map((f) => f.infrastructureRating)),
  };

  const distribution = [0, 0, 0, 0, 0];
  for (const f of feedbacks) {
    if (f.overallRating >= 1 && f.overallRating <= 5) distribution[f.overallRating - 1] += 1;
  }

  const entries: AnonymousEntry[] = feedbacks.map((f) => ({
    designation: designationByUser.get(f.traineeId) ?? "",
    comments: f.comments,
    suggestions: f.suggestions,
  }));

  const courseName = [batch.subject, batch.name].filter(Boolean).join(" · ") || batch.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Course feedback</h1>
        <p className="mt-1 text-sm text-ink-500">
          Anonymised trainee feedback for {courseName}.
        </p>
      </div>

      <FeedbackSummary
        count={feedbacks.length}
        averages={averages}
        distribution={distribution}
        entries={entries}
      />
    </div>
  );
}
