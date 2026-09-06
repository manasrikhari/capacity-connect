import { Award, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm, type ProfileFormValues } from "@/components/profile/ProfileForm";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate } from "@/lib/utils";
import { coerceExperience, type Qualification } from "@/lib/validations/profile";

/** Coerce a stored Json value into a typed qualification list. */
function toQualifications(value: unknown): Qualification[] {
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

export default async function StudentProfilePage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const userId = session.user.id;

  const [profile, traineeSkills, certificates] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.traineeSkill.findMany({
      where: { traineeId: userId },
      include: { skill: { select: { name: true, category: true } } },
      orderBy: [{ proficiency: "desc" }],
    }),
    prisma.certificate.findMany({
      where: { traineeId: userId },
      include: { batch: { select: { name: true } } },
      orderBy: { issueDate: "desc" },
    }),
  ]);

  const qualifications = toQualifications(profile?.qualifications);

  const formValues: ProfileFormValues = {
    name: session.user.name ?? "",
    designation: profile?.designation ?? "",
    department: profile?.department ?? "",
    organisation: profile?.organisation ?? "",
    postingLocation: profile?.postingLocation ?? "",
    phone: profile?.phone ?? "",
    bio: profile?.bio ?? "",
    yearsExperience: profile?.yearsExperience ?? 0,
    interests: profile?.interests ?? [],
    governmentIdType: profile?.governmentIdType ?? "",
    governmentIdNum: profile?.governmentIdNum ?? "",
    resumeUrl: profile?.resumeUrl ?? "",
    qualifications,
    experience: coerceExperience(profile?.experience),
  };

  // Group skills by category for a read-only competency snapshot.
  const skillsByCategory = new Map<string, { name: string; proficiency: number }[]>();
  for (const ts of traineeSkills) {
    const list = skillsByCategory.get(ts.skill.category) ?? [];
    list.push({ name: ts.skill.name, proficiency: ts.proficiency });
    skillsByCategory.set(ts.skill.category, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">My profile</h1>
        <p className="mt-1 text-sm text-ink-500">
          Your professional identity, qualifications, skills, and certificates.
        </p>
      </div>

      <ProfileSummary profile={formValues} />

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
          <Link href="/student/competency" className="text-sm text-plum-700 hover:underline">
            View competency
          </Link>
        </CardHeader>
        {traineeSkills.length === 0 ? (
          <p className="text-sm text-ink-500">
            No skills recorded yet. They build up as you complete courses and assessments.
          </p>
        ) : (
          <div className="space-y-4">
            {[...skillsByCategory.entries()].map(([category, skills]) => (
              <div key={category}>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Badge key={s.name} color="slate">
                      {s.name} · L{s.proficiency}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
          {formValues.resumeUrl && (
            <a
              href={formValues.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-plum-700 hover:underline"
            >
              View resume
            </a>
          )}
        </CardHeader>
        {certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Complete a course to earn a verifiable certificate."
          />
        ) : (
          <ul className="divide-y divide-hair">
            {certificates.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{c.batch.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                    {c.certificateNumber} · {formatDate(c.issueDate)}
                    {c.grade ? ` · ${c.grade}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {c.status !== "VALID" && <Badge color="red">{c.status}</Badge>}
                  <Link
                    href={`/verify/${c.verificationHash}`}
                    className="inline-flex items-center gap-1 text-sm text-plum-700 hover:underline"
                  >
                    <ShieldCheck className="size-3.5" />
                    Verify
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ProfileForm profile={formValues} />
    </div>
  );
}
