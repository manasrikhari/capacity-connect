import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";
import { CATALOGUE_PAGE_SIZE, type CatalogueFilters } from "@/lib/catalogue";
import { prisma } from "@/lib/prisma";
import { slugify, uniqueSlug } from "@/lib/slug";

/** Shape returned to the catalogue and calendar. Never carries `joinCode`. */
export type CatalogueCourse = {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  domain: string | null;
  level: string | null;
  department: string | null;
  wmoTier: string | null;
  startDate: Date | null;
  endDate: Date | null;
  trainerName: string | null;
  enrolledCount: number;
};

const COURSE_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  subject: true,
  grade: true,
  department: true,
  wmoTier: true,
  startDate: true,
  endDate: true,
  teacher: { select: { name: true } },
  _count: { select: { enrollments: true } },
} satisfies Prisma.BatchSelect;

type Row = Prisma.BatchGetPayload<{ select: typeof COURSE_SELECT }>;

function toCourse(b: Row): CatalogueCourse {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    domain: b.subject,
    level: b.grade,
    department: b.department,
    wmoTier: b.wmoTier,
    startDate: b.startDate,
    endDate: b.endDate,
    trainerName: b.teacher?.name ?? null,
    enrolledCount: b._count.enrollments,
  };
}

/**
 * Only ACTIVE courses whose trainer is not suspended are ever public. This
 * mirrors the guard `validateCodeAction` already applies to join codes, so a
 * course cannot be reached through the catalogue that could not be joined.
 */
function baseWhere(): Prisma.BatchWhereInput {
  return { status: "ACTIVE", teacher: { status: { not: "SUSPENDED" } } };
}

function filterWhere(f: CatalogueFilters, now: Date = new Date()): Prisma.BatchWhereInput {
  // Two independent OR groups (search, and the finished-course cut) cannot both
  // sit at the top level of one where object, so they are combined under AND.
  const and: Prisma.BatchWhereInput[] = [];

  if (f.q) {
    and.push({
      OR: [
        { name: { contains: f.q, mode: "insensitive" } },
        { description: { contains: f.q, mode: "insensitive" } },
      ],
    });
  }

  // A catalogue is for courses you can still join. Finished ones are hidden by
  // default rather than sorted last, otherwise "starting soonest" leads with a
  // course that ended months ago.
  if (!f.past) {
    and.push({ OR: [{ endDate: null }, { endDate: { gte: now } }] });
  }

  return {
    ...baseWhere(),
    ...(f.domain ? { subject: f.domain } : {}),
    ...(f.level ? { grade: f.level } : {}),
    ...(f.department ? { department: f.department } : {}),
    ...(f.tier ? { wmoTier: f.tier } : {}),
    ...(and.length ? { AND: and } : {}),
  };
}

function orderBy(f: CatalogueFilters): Prisma.BatchOrderByWithRelationInput[] {
  if (f.sort === "name") return [{ name: "asc" }];
  if (f.sort === "newest") return [{ createdAt: "desc" }];
  // "starting": soonest first, but courses with no date sink to the bottom
  // rather than sorting as if they began in 1970.
  return [{ startDate: { sort: "asc", nulls: "last" } }, { name: "asc" }];
}

export type FacetCount = { value: string; count: number };

/**
 * One page of the catalogue plus the counts for every facet.
 *
 * Facet counts deliberately ignore *their own* dimension so a user can see the
 * other departments available while filtered to IMD, instead of every other
 * count collapsing to zero.
 */
export async function searchCatalogue(f: CatalogueFilters): Promise<{
  courses: CatalogueCourse[];
  total: number;
  pageCount: number;
  facets: {
    domain: FacetCount[];
    level: FacetCount[];
    department: FacetCount[];
    tier: FacetCount[];
  };
}> {
  const where = filterWhere(f);

  const countBy = async (
    field: "subject" | "grade" | "department" | "wmoTier",
    exclude: keyof CatalogueFilters,
  ): Promise<FacetCount[]> => {
    const rest: CatalogueFilters = { ...f, [exclude]: null };
    const rows = await prisma.batch.groupBy({
      by: [field],
      where: filterWhere(rest),
      _count: { _all: true },
    });
    return rows
      .filter((r): r is typeof r & Record<typeof field, string> => Boolean(r[field]))
      .map((r) => ({ value: r[field] as string, count: r._count._all }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  };

  const [total, rows, domain, level, department, tier] = await Promise.all([
    prisma.batch.count({ where }),
    prisma.batch.findMany({
      where,
      orderBy: orderBy(f),
      skip: (f.page - 1) * CATALOGUE_PAGE_SIZE,
      take: CATALOGUE_PAGE_SIZE,
      select: COURSE_SELECT,
    }),
    countBy("subject", "domain"),
    countBy("grade", "level"),
    countBy("department", "department"),
    countBy("wmoTier", "tier"),
  ]);

  return {
    courses: rows.map(toCourse),
    total,
    pageCount: Math.max(1, Math.ceil(total / CATALOGUE_PAGE_SIZE)),
    facets: { domain, level, department, tier },
  };
}

/** Courses with a start date inside [from, to) — powers the training calendar. */
export async function coursesStartingBetween(from: Date, to: Date): Promise<CatalogueCourse[]> {
  const rows = await prisma.batch.findMany({
    where: { ...baseWhere(), startDate: { gte: from, lt: to } },
    orderBy: [{ startDate: "asc" }, { name: "asc" }],
    select: COURSE_SELECT,
  });
  return rows.map(toCourse);
}

/**
 * Resolve a public course handle. Falls back to the id so a course whose slug
 * has not been backfilled is still reachable rather than 404-ing.
 */
export async function findCourseByHandle(handle: string) {
  return prisma.batch.findFirst({
    where: { ...baseWhere(), OR: [{ slug: handle }, { id: handle }] },
    select: {
      ...COURSE_SELECT,
      eligibility: true,
      createdAt: true,
      teacher: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              designation: true,
              organisation: true,
              department: true,
              publicSlug: true,
              isPublic: true,
            },
          },
        },
      },
      skillRequirements: {
        select: {
          minProficiency: true,
          isMandatory: true,
          skill: { select: { id: true, name: true, category: true } },
        },
      },
      _count: { select: { enrollments: true, libraryItems: true, tests: true } },
    },
  });
}

/**
 * Give a batch a stable public handle. Called on create and as a lazy backfill,
 * so a course made before the catalogue existed gets one the first time it is
 * needed rather than requiring a migration pass.
 */
export async function ensureBatchSlug(batchId: string, name: string): Promise<string> {
  const existing = await prisma.batch.findUnique({ where: { id: batchId }, select: { slug: true } });
  if (existing?.slug) return existing.slug;

  const taken = await prisma.batch.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  });
  const slug = uniqueSlug(
    slugify(name),
    taken.map((t) => t.slug).filter((s): s is string => Boolean(s)),
  );
  await prisma.batch.update({ where: { id: batchId }, data: { slug } });
  return slug;
}
