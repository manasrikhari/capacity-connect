import {
  Award,
  BadgeCheck,
  Briefcase,
  BookOpen,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getPublicProfile } from "@/lib/public-profile";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) return { title: "Profile not found — Capacity Connect" };
  const line = [p.designation, p.organisation].filter(Boolean).join(", ");
  return {
    title: `${p.name} — Capacity Connect`,
    description: line || `Professional profile of ${p.name}.`,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) notFound();

  const roleLabel = p.role === "trainer" ? "Trainer" : p.role === "admin" ? "Administrator" : "Trainee";

  return (
    <>
      <PublicHeader
        right={
          <Link href="/courses" className="text-sm text-plum-700 hover:underline">
            Browse courses
          </Link>
        }
      />

      <main id="main-content" tabIndex={-1} className="flex-1 bg-page">
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
          {/* Identity */}
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <Badge color="violet">{roleLabel}</Badge>
              {p.cadre && <Badge color="slate">{p.cadre}</Badge>}
              {p.openToMentoring && (
                <Badge color="green">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="size-3" />
                    Open to mentoring
                  </span>
                </Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl font-normal text-ink-900">{p.name}</h1>
            {(p.designation || p.organisation) && (
              <p className="mt-1 text-lg text-ink-700">
                {[p.designation, p.organisation].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
              {p.postingLocation && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-ink-300" />
                  {p.postingLocation}
                </span>
              )}
              {p.yearsExperience > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-ink-300" />
                  {p.yearsExperience} years of service
                </span>
              )}
              {p.department && <span>{p.department}</span>}
            </div>
            {p.bio && <p className="mt-4 max-w-2xl whitespace-pre-line text-ink-700">{p.bio}</p>}
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_17rem]">
            <div className="min-w-0 space-y-8">
              {p.experience.length > 0 && (
                <Section title="Experience" icon={Briefcase}>
                  <ol className="space-y-4 border-l border-hair pl-5">
                    {p.experience.map((e, i) => (
                      <li key={`${e.role}-${i}`} className="relative">
                        <span className="absolute -left-[1.4rem] top-1.5 size-2 rounded-full bg-plum-300" />
                        <p className="font-medium text-ink-900">{e.role}</p>
                        {e.organisation && <p className="text-sm text-ink-500">{e.organisation}</p>}
                        <p className="font-mono text-[11px] tabular-nums text-ink-300">
                          {e.startYear ?? "—"} – {e.current ? "present" : (e.endYear ?? "—")}
                        </p>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {p.qualifications.length > 0 && (
                <Section title="Qualifications" icon={GraduationCap}>
                  <ul className="space-y-3">
                    {p.qualifications.map((q, i) => (
                      <li key={`${q.degree}-${i}`}>
                        <p className="font-medium text-ink-900">{q.degree}</p>
                        <p className="text-sm text-ink-500">
                          {[q.institution, q.year].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* The credible part: every credential here is checkable. */}
              {p.certificates.length > 0 && (
                <Section title="Verified certifications" icon={Award}>
                  <ul className="space-y-3">
                    {p.certificates.map((c) => (
                      <li
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-paper px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-medium text-ink-900">
                            <ShieldCheck className="size-4 shrink-0 text-sage-600" />
                            {c.courseName}
                          </p>
                          <p className="font-mono text-[11px] text-ink-300">
                            {c.certificateNumber} · {formatDate(c.issueDate)}
                            {c.grade ? ` · ${c.grade}` : ""}
                            {c.wmoTier ? ` · ${c.wmoTier}` : ""}
                          </p>
                        </div>
                        <Link
                          href={`/verify/${encodeURIComponent(c.certificateNumber)}`}
                          className="shrink-0 text-sm text-plum-600 hover:underline"
                        >
                          Verify
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {p.coursesTaught.length > 0 && (
                <Section title="Courses taught" icon={BookOpen}>
                  <ul className="space-y-2">
                    {p.coursesTaught.map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/courses/${c.slug ?? c.id}`}
                          className="flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-sunken"
                        >
                          <span className="min-w-0 text-sm text-ink-900">{c.name}</span>
                          <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-300">
                            {c.enrolled} enrolled
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </div>

            <aside className="space-y-4">
              {p.competencies.length > 0 && (
                <Card>
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                    Competencies
                  </p>
                  <ul className="space-y-2">
                    {p.competencies.slice(0, 12).map((c) => (
                      <li key={c.name} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm text-ink-700">
                          {c.verified && (
                            <BadgeCheck className="mr-1 inline size-3.5 align-[-2px] text-sage-600" />
                          )}
                          {c.name}
                        </span>
                        <span
                          className="shrink-0 font-mono text-[11px] tabular-nums text-ink-300"
                          aria-label={`Level ${c.proficiency} of 5`}
                        >
                          {c.proficiency}/5
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 border-t border-hair pt-2 text-[11px] text-ink-300">
                    <BadgeCheck className="mr-1 inline size-3 align-[-1px] text-sage-600" />
                    Earned through assessment or certification.
                  </p>
                </Card>
              )}

              {p.role === "trainer" && p.traineesTaught > 0 && (
                <Card>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">Reach</p>
                  <p className="mt-1 font-display text-3xl font-normal tabular-nums text-ink-900">
                    {p.traineesTaught}
                  </p>
                  <p className="text-sm text-ink-500">trainees across active courses</p>
                </Card>
              )}

              {p.interests.length > 0 && (
                <Card>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                    Interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.interests.map((i) => (
                      <span
                        key={i}
                        className="rounded-lg bg-sunken px-2 py-0.5 text-xs text-ink-500"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-normal text-ink-900">
        <Icon className="size-4 text-ink-300" />
        {title}
      </h2>
      {children}
    </section>
  );
}
