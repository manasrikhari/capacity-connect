import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerEnrollmentRequested } from "@/lib/pusher-server";

export async function GET(request: Request) {
  const session = await auth();
  const store = await cookies();
  const joinCode = store.get("join_code")?.value;

  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    res.cookies.delete("join_code");
    res.cookies.delete("auth_intent");
    return res;
  };

  if (!session?.user) return go("/");
  if (!joinCode) return go("/join");

  const batch = await prisma.batch.findUnique({
    where: { joinCode },
    include: { teacher: { select: { status: true } } },
  });

  if (!batch || batch.status !== "ACTIVE" || batch.teacher.status === "SUSPENDED") {
    return go("/join?error=unavailable");
  }

  if (session.user.role !== "STUDENT") {
    return go("/join?error=not-student");
  }

  const existing = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId: batch.id } },
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
  }

  return go(`/student?joined=${encodeURIComponent(batch.name)}`);
}
