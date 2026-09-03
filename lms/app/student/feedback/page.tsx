import { redirect } from "next/navigation";
import { CourseFeedbackForm } from "@/components/feedback/CourseFeedbackForm";
import { getActiveStudentBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export default async function StudentFeedbackPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const batch = await getActiveStudentBatch(session);
  if (!batch) redirect("/student");

  const feedback = await prisma.feedback.findUnique({
    where: { batchId_traineeId: { batchId: batch.id, traineeId: session.user.id } },
    select: {
      overallRating: true,
      contentRating: true,
      trainerRating: true,
      infrastructureRating: true,
      comments: true,
      suggestions: true,
    },
  });

  const courseName = [batch.subject, batch.name].filter(Boolean).join(" · ") || batch.name;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">Course feedback</h1>
        <p className="mt-1 text-sm text-ink-500">
          {feedback
            ? "Thank you for your feedback. You can edit it any time."
            : "Rate your course and help us improve future training."}
        </p>
      </div>

      <CourseFeedbackForm courseName={courseName} feedback={feedback} />
    </div>
  );
}
