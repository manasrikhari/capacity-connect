"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth, signIn } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { triggerEnrollmentRequested } from "@/lib/pusher-server";

export type EnrolState = {
  error?: string;
  success?: string;
  /** Set when the visitor must sign in first — the page swaps to the auth card. */
  needsAuth?: boolean;
} | null;

/**
 * Request a place on a course from the public catalogue.
 *
 * Enrolment stays PENDING and the trainer approves, exactly as the join-code
 * path already does — the catalogue is a new door onto the same workflow, not
 * a second workflow. Requesting twice is a no-op rather than an error.
 */
export async function requestEnrolmentAction(
  batchId: string,
): Promise<EnrolState> {
  const session = await auth();
  if (!session?.user) return { needsAuth: true };

  if (session.user.role !== "STUDENT") {
    return { error: "You are signed in as staff — trainees enrol with a trainee account." };
  }

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, status: "ACTIVE", teacher: { status: { not: "SUSPENDED" } } },
    select: { id: true, name: true, slug: true, teacherId: true },
  });
  if (!batch) return { error: "This course is not accepting trainees right now." };

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId: batch.id } },
    select: { status: true },
  });

  if (existing?.status === "APPROVED") return { success: "You are already enrolled." };
  if (existing?.status === "PENDING") return { success: "Your request is already with the trainer." };
  if (existing?.status === "REJECTED") {
    return { error: "A previous request for this course was declined. Contact the trainer." };
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId: session.user.id, batchId: batch.id, status: "PENDING" },
  });

  await triggerEnrollmentRequested({
    enrollmentId: enrollment.id,
    studentId: session.user.id,
    studentName: session.user.name ?? null,
    studentEmail: session.user.email ?? "",
    batchId: batch.id,
    batchName: batch.name,
  });

  // The trainer is the one who has to act, and the audit found approvals were
  // invisible unless the right page happened to be open. Tell them.
  await notify({
    userId: batch.teacherId,
    kind: "enrollment.requested",
    title: `${session.user.name ?? "A trainee"} requested to join ${batch.name}`,
    body: "Review the request from your trainees list.",
    href: "/admin/students",
  });

  revalidatePath(`/courses/${batch.slug ?? batch.id}`);
  revalidatePath("/student");
  return { success: `Request sent. ${batch.name} will appear on your dashboard once approved.` };
}

/**
 * Signed-out enrolment: carry the intended course through the OAuth round trip
 * in an httpOnly cookie, exactly as `studentGoogleSignInAction` already does
 * for join codes, and finish the enrolment at `/courses/complete`.
 */
export async function enrolWithGoogleAction(formData: FormData) {
  const batchId = (formData.get("batchId") as string | null)?.trim();
  const store = await cookies();

  store.set("auth_intent", "student", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });
  if (batchId) {
    store.set("enrol_batch", batchId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 5,
    });
  }

  await signIn("google", { redirectTo: "/courses/complete" });
}
