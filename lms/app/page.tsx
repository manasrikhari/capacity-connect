import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <LandingPage />;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboarded: true },
  });

  // TEMP DEBUG — remove once the new-user redirect path is confirmed.
  console.log(
    "[onboarding-debug] app/page.tsx: userId=%s role=%s onboarded=%s",
    session.user.id,
    session.user.role,
    dbUser?.onboarded
  );

  if (dbUser && !dbUser.onboarded) {
    console.log("[onboarding-debug] app/page.tsx: not onboarded -> redirect /welcome");
    redirect("/welcome");
  }

  if (session.user.role === "SUPER_ADMIN") {
    console.log("[onboarding-debug] app/page.tsx: role=SUPER_ADMIN -> redirect /platform");
    redirect("/platform");
  }
  if (session.user.role === "ADMIN") {
    console.log("[onboarding-debug] app/page.tsx: role=ADMIN -> redirect /admin");
    redirect("/admin");
  }

  const approvedCount = await prisma.enrollment.count({
    where: {
      studentId: session.user.id,
      status: "APPROVED",
      batch: { teacher: { status: { not: "SUSPENDED" } } },
    },
  });

  console.log(
    "[onboarding-debug] app/page.tsx: role=STUDENT approvedCount=%d -> redirect %s",
    approvedCount,
    approvedCount === 1 ? "/student/dashboard" : "/student"
  );

  if (approvedCount === 1) redirect("/student/dashboard");
  redirect("/student");
}
