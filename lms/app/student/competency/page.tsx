import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, type BadgeColor } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Target } from "lucide-react";
import { RadarChart } from "@/components/charts/RadarChart";
import { DeclareSkillForm } from "@/components/competency/DeclareSkillForm";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { traineeCompetencyProfile } from "@/lib/competency-db";

function sourceBadge(source: string | null): { label: string; color: BadgeColor } {
  if (source?.startsWith("CERTIFICATE:")) return { label: "Certified", color: "green" };
  if (source?.startsWith("TEST:")) return { label: "Assessment", color: "blue" };
  return { label: "Self-declared", color: "slate" };
}

export default async function StudentCompetencyPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const [profile, mySkills, allSkills] = await Promise.all([
    traineeCompetencyProfile(session.user.id),
    prisma.traineeSkill.findMany({
      where: { traineeId: session.user.id },
      include: { skill: true },
      orderBy: { skill: { name: "asc" } },
    }),
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-2xl text-ink-900">My competencies</h1>
        <p className="mt-1 text-sm text-ink-500">
          Your verified and self-declared skill levels across the WMO competency areas.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <CardHeader>
            <CardTitle>Competency radar</CardTitle>
          </CardHeader>
          <div className="mt-4 flex justify-center">
            {profile.length >= 3 ? (
              <RadarChart axes={profile.map((c) => ({ label: c.category, value: c.average, max: 5 }))} />
            ) : (
              <p className="py-8 text-center text-sm text-ink-500">
                Declare skills across at least three categories to see your radar.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Declare a skill</CardTitle>
              <p className="mt-1 text-sm text-ink-500">
                Levels earned from assessments or certificates can&apos;t be lowered here.
              </p>
            </div>
          </CardHeader>
          <div className="mt-4">
            <DeclareSkillForm skills={allSkills.map((s) => ({ id: s.id, name: s.name }))} />
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <CardHeader>
          <CardTitle>My skills</CardTitle>
        </CardHeader>
        <div className="mt-4">
          {mySkills.length === 0 ? (
            <EmptyState icon={Target} title="No skills yet" description="Declare a skill above to start building your profile." />
          ) : (
            <ul className="divide-y divide-hair">
              {mySkills.map((s) => {
                const b = sourceBadge(s.source);
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-900">{s.skill.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                        {s.skill.category}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono text-xs tabular-nums text-ink-500">
                        {s.proficiency}/5
                      </span>
                      <Badge color={b.color}>{b.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
