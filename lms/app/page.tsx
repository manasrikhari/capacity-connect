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

  if (dbUser && !dbUser.onboarded) {
    redirect("/welcome");
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/platform");
  }
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const approvedCount = await prisma.enrollment.count({
    where: {
      studentId: session.user.id,
      status: "APPROVED",
      batch: { teacher: { status: { not: "SUSPENDED" } } },
    },
  });

  if (approvedCount === 1) redirect("/student/dashboard");
  redirect("/student");
}
