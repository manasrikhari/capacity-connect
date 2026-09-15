import "server-only";
import { prisma } from "@/lib/prisma";
import { slugify, uniqueSlug } from "@/lib/slug";
import { coerceExperience, type Experience, type Qualification } from "@/lib/validations/profile";

/**
 * The public professional profile at `/p/<slug>`.
 *
 * SECURITY: `Profile` also holds `phone`, `governmentIdType`, `governmentIdNum`
 * and `resumeUrl`. None of them may ever cross this boundary, so every field is
 * listed explicitly below — never spread a Prisma row into the view. Email is
 * excluded for the same reason: a public page is a scraping target.
 */
export type PublicProfileView = {
  name: string;
  role: "trainer" | "trainee" | "admin";
  designation: string | null;
  organisation: string | null;
  department: string | null;
  postingLocation: string | null;
  cadre: string | null;
  bio: string | null;
  yearsExperience: number;
  interests: string[];
  openToMentoring: boolean;
  qualifications: Qualification[];
  experience: Experience[];
  certificates: {
    id: string;
    certificateNumber: string;
    courseName: string;
    wmoTier: string | null;
    grade: string | null;
    issueDate: Date;
  }[];
  competencies: { name: string; category: string; proficiency: number; verified: boolean }[];
  /** Trainer-only: what they teach. */
  coursesTaught: { id: string; slug: string | null; name: string; enrolled: number }[];
  traineesTaught: number;
};

function coerceQualifications(value: unknown): Qualification[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is Record<string, unknown> => typeof q === "object" && q !== null)
    .map((q) => ({
      degree: String(q.degree ?? ""),
      institution: String(q.institution ?? ""),
      year: typeof q.year === "number" ? q.year : null,
    }))
    .filter((q) => q.degree.length > 0);
}

/**
 * Load a public profile by handle. Returns null when the profile does not
 * exist, is not marked public, or belongs to a suspended account — an
 * unpublished page must be indistinguishable from a missing one.
 */
export async function getPublicProfile(slug: string): Promise<PublicProfileView | null> {
  const profile = await prisma.profile.findUnique({
    where: { publicSlug: slug },
    select: {
      isPublic: true,
      designation: true,
      organisation: true,
      department: true,
      postingLocation: true,
      cadre: true,
      bio: true,
      yearsExperience: true,
      interests: true,
      openToMentoring: true,
      qualifications: true,
      experience: true,
      user: {
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!profile?.isPublic) return null;
  if (profile.user.status === "SUSPENDED" || profile.user.status === "REJECTED") return null;

  const userId = profile.user.id;
  const isTrainer = profile.user.role === "ADMIN";

  const [certificates, traineeSkills, trainerSkills, courses] = await Promise.all([
    prisma.certificate.findMany({
      where: { traineeId: userId, status: "VALID" },
      orderBy: { issueDate: "desc" },
      select: {
        id: true,
        certificateNumber: true,
        grade: true,
        issueDate: true,
        batch: { select: { name: true, wmoTier: true } },
      },
    }),
    prisma.traineeSkill.findMany({
      where: { traineeId: userId },
      select: { proficiency: true, source: true, skill: { select: { name: true, category: true } } },
    }),
    isTrainer
      ? prisma.trainerSkill.findMany({
          where: { trainerId: userId },
          select: {
            proficiency: true,
            isVerified: true,
            skill: { select: { name: true, category: true } },
          },
        })
      : Promise.resolve([]),
    isTrainer
      ? prisma.batch.findMany({
          where: { teacherId: userId, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: { id: true, slug: true, name: true, _count: { select: { enrollments: true } } },
        })
      : Promise.resolve([]),
  ]);

  const competencies = isTrainer
    ? trainerSkills.map((s) => ({
        name: s.skill.name,
        category: s.skill.category,
        proficiency: s.proficiency,
        verified: s.isVerified,
      }))
    : traineeSkills.map((s) => ({
        name: s.skill.name,
        category: s.skill.category,
        proficiency: s.proficiency,
        // A skill earned from a certificate or an assessment is evidence;
        // a self-declared one is a claim. The page must not blur the two.
        verified: Boolean(s.source && !s.source.startsWith("SELF")),
      }));

  return {
    name: profile.user.name ?? "Member",
    role: profile.user.role === "ADMIN" ? "trainer" : profile.user.role === "SUPER_ADMIN" ? "admin" : "trainee",
    designation: profile.designation,
    organisation: profile.organisation,
    department: profile.department,
    postingLocation: profile.postingLocation,
    cadre: profile.cadre,
    bio: profile.bio,
    yearsExperience: profile.yearsExperience,
    interests: profile.interests,
    openToMentoring: profile.openToMentoring,
    qualifications: coerceQualifications(profile.qualifications),
    experience: coerceExperience(profile.experience),
    certificates: certificates.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      courseName: c.batch.name,
      wmoTier: c.batch.wmoTier,
      grade: c.grade,
      issueDate: c.issueDate,
    })),
    competencies: competencies.sort((a, b) => b.proficiency - a.proficiency),
    coursesTaught: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      enrolled: c._count.enrollments,
    })),
    traineesTaught: courses.reduce((n, c) => n + c._count.enrollments, 0),
  };
}

/**
 * Give a user a stable public handle, derived from their name. Idempotent, so
 * toggling the page off and on again keeps the same URL — a shared link must
 * not rot because someone unpublished for an afternoon.
 */
export async function ensurePublicSlug(userId: string, name: string | null): Promise<string> {
  const existing = await prisma.profile.findUnique({
    where: { userId },
    select: { publicSlug: true },
  });
  if (existing?.publicSlug) return existing.publicSlug;

  const taken = await prisma.profile.findMany({
    where: { publicSlug: { not: null } },
    select: { publicSlug: true },
  });
  const slug = uniqueSlug(
    slugify(name || "member"),
    taken.map((t) => t.publicSlug).filter((s): s is string => Boolean(s)),
  );
  await prisma.profile.update({ where: { userId }, data: { publicSlug: slug } });
  return slug;
}
