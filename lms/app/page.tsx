import { redirect } from "next/navigation";
import { allLandingStyles } from "@/components/landing/styles";
import { LandingInit } from "@/components/landing/LandingInit";
import { LandingScrollbar } from "@/components/landing/sections/LandingScrollbar";
import { LandingHeader } from "@/components/landing/sections/LandingHeader";
import { LandingHero } from "@/components/landing/sections/LandingHero";
import { LandingFeatures } from "@/components/landing/sections/LandingFeatures";
import { LandingAnnouncements } from "@/components/landing/sections/LandingAnnouncements";
import { LandingCourses } from "@/components/landing/sections/LandingCourses";
import { LandingHowItWorks } from "@/components/landing/sections/LandingHowItWorks";
import { LandingPlatform } from "@/components/landing/sections/LandingPlatform";
import { LandingVerify } from "@/components/landing/sections/LandingVerify";
import { LandingSignIn } from "@/components/landing/sections/LandingSignIn";
import { LandingCTA } from "@/components/landing/sections/LandingCTA";
import { LandingFooter } from "@/components/landing/sections/LandingFooter";
import { auth } from "@/lib/auth";
import { getCapacityMetrics } from "@/lib/metrics-db";
import { prisma } from "@/lib/prisma";

async function loadLandingData() {
  const now = new Date();
  const [announcements, courses, metrics, activeCourseCount, traineeCount] = await Promise.all([
    prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 5,
      select: {
        slug: true,
        title: true,
        summary: true,
        category: true,
        isFeatured: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.batch.findMany({
      where: { status: "ACTIVE", endDate: { gt: now } },
      orderBy: { startDate: "asc" },
      take: 4,
      select: {
        id: true,
        name: true,
        subject: true,
        grade: true,
        wmoTier: true,
        startDate: true,
        endDate: true,
        teacher: { select: { name: true } },
      },
    }),
    getCapacityMetrics(),
    prisma.batch.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
  ]);

  return {
    announcements: announcements.map((a) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      category: a.category,
      isFeatured: a.isFeatured,
      date: a.publishedAt ?? a.createdAt,
    })),
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      domain: c.subject,
      level: c.grade,
      wmoTier: c.wmoTier,
      trainer: c.teacher?.name ?? null,
      startDate: c.startDate,
      endDate: c.endDate,
    })),
    stats: {
      certified: metrics.certifiedCount,
      courses: activeCourseCount,
      trainees: traineeCount,
    },
  };
}

export default async function Home() {
  const session = await auth();

  if (!session) {
    const { announcements, courses, stats } = await loadLandingData();
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: allLandingStyles }} />

        <LandingScrollbar />
        <LandingHeader />
        <LandingHero />
        <LandingFeatures />
        <LandingAnnouncements announcements={announcements} />
        <LandingCourses courses={courses} stats={stats} />
        <LandingHowItWorks />
        <LandingPlatform />
        <LandingVerify />
        <LandingSignIn />
        <LandingCTA />
        <LandingFooter />

        {/* Loads Lucide icons + runs scroll/animation scripts on the client */}
        <LandingInit />
      </>
    );
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
