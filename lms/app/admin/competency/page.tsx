import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RequirementsEditor } from "@/components/competency/RequirementsEditor";
import { TrainerSkillsEditor } from "@/components/competency/TrainerSkillsEditor";
import { SkillBreakdown } from "@/components/competency/SkillBreakdown";
import { getSession } from "@/lib/session";
import { getActiveBatch } from "@/lib/batch";
import { prisma } from "@/lib/prisma";
import { batchRequirements } from "@/lib/competency-db";
import { scoreTrainer, type TS } from "@/lib/competency";

export default async function AdminCompetencyPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const [skills, reqs, myTrainerSkills, profile] = await Promise.all([
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    batchRequirements(batch.id),
    prisma.trainerSkill.findMany({
      where: { trainerId: session.user.id },
      include: { skill: true },
      orderBy: { skill: { name: "asc" } },
    }),
    prisma.profile.findUnique({ where: { userId: session.user.id } }),
  ]);

  const ts: TS[] = myTrainerSkills.map((s) => ({
    skillId: s.skillId,
    proficiency: s.proficiency,
    isVerified: s.isVerified,
  }));
  const myMatch = scoreTrainer(reqs, ts, profile?.yearsExperience ?? 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">Competency — {batch.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          Set the competencies this course requires, and declare your own skills.
        </p>
      </header>

      <Card className="mb-6 p-5">
        <CardHeader>
            <div className="min-w-0">
          <CardTitle>Required competencies</CardTitle>
          <p className="mt-1 text-sm text-ink-500">
            Trainees are matched and recommended against these.
          </p>
            </div>
          </CardHeader>
        <div className="mt-4">
          <RequirementsEditor
            skills={skills.map((s) => ({ id: s.id, name: s.name, category: s.category }))}
            initial={reqs.map((r) => ({
              skillId: r.skillId,
              minProficiency: r.minProficiency,
              weight: r.weight,
              isMandatory: r.isMandatory,
            }))}
          />
        </div>
      </Card>

      <Card className="mb-6 p-5">
        <CardHeader>
          <CardTitle>My skills</CardTitle>
        </CardHeader>
        <div className="mt-4">
          <TrainerSkillsEditor
            skills={skills.map((s) => ({ id: s.id, name: s.name }))}
            mySkills={myTrainerSkills.map((s) => ({
              id: s.id,
              skillId: s.skillId,
              skillName: s.skill.name,
              proficiency: s.proficiency,
              yearsExperience: s.yearsExperience,
              isVerified: s.isVerified,
            }))}
          />
        </div>
      </Card>

      <Card className="p-5">
        <CardHeader>
          <CardTitle>How you match this course</CardTitle>
        </CardHeader>
        <div className="mt-4 flex items-center gap-4">
          <p className="font-display text-3xl tabular-nums text-ink-900">
            {myMatch.matchScore.toFixed(1)}
          </p>
          {myMatch.isQualified ? (
            <Badge color="green">Qualified</Badge>
          ) : (
            <Badge color="red">Mandatory gap</Badge>
          )}
        </div>
        <div className="mt-4">
          <SkillBreakdown rows={myMatch.skillBreakdown} />
        </div>
      </Card>
    </div>
  );
}
