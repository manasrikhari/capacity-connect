"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signIn, auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerEnrollmentRequested } from "@/lib/pusher-server";

export type JoinBatchState = {
  error?: string;
  success?: string;
  phase?: "code" | "auth" | "done";
  batch?: { id: string; name: string };
  code?: string;
} | undefined;

export async function validateCodeAction(
  _prev: JoinBatchState,
  formData: FormData
): Promise<JoinBatchState> {
  const joinCode = (formData.get("joinCode") as string | null)?.trim().toUpperCase();
  if (!joinCode) {
    return { phase: "code", error: "Please enter a join code." };
  }

  const batch = await prisma.batch.findUnique({
    where: { joinCode },
    include: { teacher: { select: { status: true } } },
  });

  if (!batch) {
    return { phase: "code", error: "We couldn't find a class with that code.", code: joinCode };
  }

  if (batch.status !== "ACTIVE" || batch.teacher.status === "SUSPENDED") {
    return { phase: "code", error: "This class isn't accepting students right now.", code: joinCode };
  }

  const session = await auth();

  if (session) {
    if (session.user.role !== "STUDENT") {
      return {
        phase: "code",
        error: "You're signed in as a teacher — students join with a student account.",
        code: joinCode,
      };
    }

    return enrollStudent(session.user.id, session.user.name ?? null, session.user.email ?? "", batch.id, batch.name);
  }

  return { phase: "auth", batch: { id: batch.id, name: batch.name }, code: joinCode };
}

export async function studentGoogleSignInAction(formData: FormData) {
  const code = formData.get("joinCode") as string;
  const cookieStore = await cookies();

  cookieStore.set("auth_intent", "student", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });

  cookieStore.set("join_code", code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });

  await signIn("google", { redirectTo: "/join/complete" });
}

async function enrollStudent(
  studentId: string,
  studentName: string | null,
  studentEmail: string,
  batchId: string,
  batchName: string
): Promise<JoinBatchState> {
  const existing = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId, batchId } },
  });

  if (existing) {
    if (existing.status === "APPROVED") {
      return { phase: "done", success: `You're already enrolled in ${batchName}.` };
    }
    if (existing.status === "PENDING") {
      return { phase: "done", success: `You've already requested to join ${batchName}. Your teacher will approve you shortly.` };
    }
    return {
      phase: "code",
      error: "Your enrollment in this batch was rejected. Contact your teacher.",
    };
  }

  const enrollment = await prisma.enrollment.create({
    data: { studentId, batchId, status: "PENDING" },
  });

  await triggerEnrollmentRequested({
    enrollmentId: enrollment.id,
    studentId,
    studentName,
    studentEmail,
    batchId,
    batchName,
  });

  revalidatePath("/student");

  return {
    phase: "done",
    success: `Request sent — ${batchName}. Your teacher will approve you shortly.`,
  };
}
