import "server-only";
import { prisma } from "@/lib/prisma";
import {
  scoreTrainer,
  summariseByCategory,
  type CategoryProfile,
  type Req,
  type TS,
  type TrainerMatch,
} from "@/lib/competency";

export type RankedTrainer = TrainerMatch & {
  trainerId: string;
  name: string | null;
  email: string;
  designation: string | null;
  department: string | null;
  yearsExperience: number;
};

export async function batchRequirements(batchId: string): Promise<Req[]> {
  const rows = await prisma.batchSkillRequirement.findMany({
    where: { batchId },
    include: { skill: true },
  });
  return rows.map((r) => ({
    skillId: r.skillId,
    skillName: r.skill.name,
    minProficiency: r.minProficiency,
    weight: r.weight,
    isMandatory: r.isMandatory,
  }));
}

export async function rankTrainersForBatch(batchId: string) {
  const [batch, requirements, trainers] = await Promise.all([
    prisma.batch.findUnique({ where: { id: batchId }, select: { id: true, name: true } }),
    batchRequirements(batchId),
    prisma.user.findMany({
      where: { role: "ADMIN", status: "APPROVED" },
      include: { profile: true, trainerSkills: true },
    }),
  ]);

  const ranked: RankedTrainer[] = trainers
    .map((t) => {
      const skills: TS[] = t.trainerSkills.map((s) => ({
        skillId: s.skillId,
        proficiency: s.proficiency,
        isVerified: s.isVerified,
      }));
      const years = t.profile?.yearsExperience ?? 0;
      const match = scoreTrainer(requirements, skills, years);
      return {
        ...match,
        trainerId: t.id,
        name: t.name,
        email: t.email,
        designation: t.profile?.designation ?? null,
        department: t.profile?.department ?? null,
        yearsExperience: years,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return { batch, requirements, ranked };
}

export async function traineeCompetencyProfile(traineeId: string): Promise<CategoryProfile[]> {
  const rows = await prisma.traineeSkill.findMany({
    where: { traineeId },
    include: { skill: true },
  });
  return summariseByCategory(
    rows.map((r) => ({ category: r.skill.category, proficiency: r.proficiency })),
  );
}

export async function setBatchRequirements(
  batchId: string,
  reqs: { skillId: string; minProficiency: number; weight: number; isMandatory: boolean }[],
) {
  await prisma.$transaction([
    prisma.batchSkillRequirement.deleteMany({ where: { batchId } }),
    prisma.batchSkillRequirement.createMany({
      data: reqs.map((r) => ({ batchId, ...r })),
      skipDuplicates: true,
    }),
  ]);
}
