import "server-only";
import { prisma } from "@/lib/prisma";
import {
  rankCourses,
  type CourseRecommendation,
  type ScoreCourseInput,
} from "@/lib/recommender";

const PASS_THRESHOLD = 60;

export async function getRecommendationsForTrainee(
  traineeId: string,
  limit = 4,
): Promise<CourseRecommendation[]> {
  const [enrollments, batches, traineeSkills, attempts, profile] = await Promise.all([
    prisma.enrollment.findMany({ where: { studentId: traineeId } }),
    prisma.batch.findMany({
      where: { status: "ACTIVE", teacher: { status: "APPROVED" } },
      include: { skillRequirements: { include: { skill: true } } },
    }),
    prisma.traineeSkill.findMany({ where: { traineeId } }),
    prisma.testAttempt.findMany({
      where: { studentId: traineeId },
      include: {
        test: { select: { subject: true, title: true } },
        batch: { select: { subject: true } },
      },
    }),
    prisma.profile.findUnique({ where: { userId: traineeId } }),
  ]);

  const enrollmentByBatch = new Map(enrollments.map((e) => [e.batchId, e.status]));

  const failedAttempts = attempts
    .filter((a) => a.totalMarks > 0 && (a.score / a.totalMarks) * 100 < PASS_THRESHOLD)
    .map((a) => ({
      subject: a.test.subject,
      testTitle: a.test.title,
      percent: (a.score / a.totalMarks) * 100,
      batchSubject: a.batch.subject,
    }));

  const skills = traineeSkills.map((s) => ({ skillId: s.skillId, proficiency: s.proficiency }));

  const inputs: ScoreCourseInput[] = batches
    .filter((b) => enrollmentByBatch.get(b.id) !== "APPROVED")
    .map((b) => {
      const status = enrollmentByBatch.get(b.id);
      const enrollmentStatus =
        status === "PENDING" ? "PENDING" : status === "REJECTED" ? "REJECTED" : null;
      return {
        batch: {
          id: b.id,
          name: b.name,
          subject: b.subject,
          department: b.department,
          wmoTier: b.wmoTier,
          level: b.grade,
        },
        requirements: b.skillRequirements.map((r) => ({
          skillId: r.skillId,
          skillName: r.skill.name,
          minProficiency: r.minProficiency,
          weight: r.weight,
        })),
        traineeSkills: skills,
        failedAttempts,
        profile: profile
          ? {
              postingLocation: profile.postingLocation,
              department: profile.department,
              interests: profile.interests,
            }
          : null,
        enrollmentStatus,
      } satisfies ScoreCourseInput;
    });

  return rankCourses(inputs, limit);
}
