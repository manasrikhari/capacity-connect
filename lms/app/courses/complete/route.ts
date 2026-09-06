import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { triggerEnrollmentRequested } from "@/lib/pusher-server";

/**
 * Landing point after a signed-out visitor clicks "Request enrolment" on a
 * course and signs in with Google. Mirrors `/join/complete`: read the intent
 * cookie, finish the enrolment, then clear the cookies whichever way it goes.
 */
export async function GET(request: Request) {
  const session = await auth();
  const store = await cookies();
  const batchId = store.get("enrol_batch")?.value;

  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    res.cookies.delete("enrol_batch");
    res.cookies.delete("auth_intent");
    return res;
  };

  if (!session?.user) return go("/");
  if (!batchId) return go("/courses");

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, status: "ACTIVE", teacher: { status: { not: "SUSPENDED" } } },
    select: { id: true, name: true, slug: true, teacherId: true },
  });
  const handle = batch?.slug ?? batchId;

  if (!batch) return go("/courses?error=unavailable");
  if (session.user.role !== "STUDENT") return go(`/courses/${handle}?error=not-trainee`);

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId: batch.id } },
    select: { id: true },
  });

  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_batchId: { studentId: session.user.id, batchId: batch.id } },
    create: { studentId: session.user.id, batchId: batch.id, status: "PENDING" },
    update: {},
  });

  if (!existing) {
    await triggerEnrollmentRequested({
      enrollmentId: enrollment.id,
      studentId: session.user.id,
      studentName: session.user.name ?? null,
      studentEmail: session.user.email ?? "",
      batchId: batch.id,
      batchName: batch.name,
    });
    await notify({
      userId: batch.teacherId,
      kind: "enrollment.requested",
      title: `${session.user.name ?? "A trainee"} requested to join ${batch.name}`,
      body: "Review the request from your trainees list.",
      href: "/admin/students",
    });
  }

  return go(`/student?joined=${encodeURIComponent(batch.name)}`);
}
