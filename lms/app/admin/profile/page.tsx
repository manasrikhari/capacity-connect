import { BadgeCheck } from "lucide-react";
import { ProfileForm, type ProfileFormValues } from "@/components/profile/ProfileForm";
import { ProfileSummary } from "@/components/profile/ProfileSummary";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { coerceExperience, type Qualification } from "@/lib/validations/profile";

const PROFICIENCY_LABEL = ["", "Novice", "Beginner", "Competent", "Proficient", "Expert"];

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

export default async function AdminProfilePage() {
  const session = await requireAdmin();
  const userId = session.user.id;

  const [profile, trainerSkills] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.trainerSkill.findMany({
      where: { trainerId: userId },
      include: { skill: { select: { name: true } } },
      orderBy: [{ proficiency: "desc" }],
    }),
  ]);

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
    qualifications: toQualifications(profile?.qualifications),
    experience: coerceExperience(profile?.experience),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-ink-900">My profile</h1>
        <p className="mt-1 text-sm text-ink-500">
          Your professional identity, qualifications, and teaching expertise.
        </p>
      </div>

      <ProfileSummary profile={formValues} />

      {/* Trainer expertise */}
      <Card>
        <CardHeader>
          <CardTitle>Expertise</CardTitle>
        </CardHeader>
        {trainerSkills.length === 0 ? (
          <p className="text-sm text-ink-500">No skills recorded yet.</p>
        ) : (
          <ul className="divide-y divide-hair">
            {trainerSkills.map((ts) => (
              <li key={ts.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{ts.skill.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                    Level {ts.proficiency}/5 · {PROFICIENCY_LABEL[ts.proficiency] ?? ""}
                  </p>
                </div>
                {ts.isVerified && (
                  <Badge color="green">
                    <BadgeCheck className="size-3" />
                    Verified
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ProfileForm profile={formValues} />
    </div>
  );
}
