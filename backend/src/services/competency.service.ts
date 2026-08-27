import { db } from '../config/db';
import { Role } from '@prisma/client';

export class CompetencyService {
  /**
   * Get all skills organized by category
   */
  static async getAllSkills() {
    return db.skill.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Create a new skill in taxonomy
   */
  static async createSkill(data: { name: string; category: string; description?: string }) {
    return db.skill.create({
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        description: data.description,
      },
    });
  }

  /**
   * Define or update required skills for a training program
   */
  static async setProgramSkillRequirements(
    programId: string,
    requirements: Array<{
      skillId: string;
      minProficiency: number;
      weight?: number;
      isMandatory?: boolean;
    }>
  ) {
    // Delete existing requirements and insert new
    await db.programSkillRequirement.deleteMany({
      where: { programId },
    });

    return db.programSkillRequirement.createMany({
      data: requirements.map((req) => ({
        programId,
        skillId: req.skillId,
        minProficiency: req.minProficiency,
        weight: req.weight ?? 1.0,
        isMandatory: req.isMandatory ?? true,
      })),
    });
  }

  /**
   * Intelligent Trainer-to-Program Competency Matching & Ranking Algorithm
   * 
   * Match Score Formulation:
   * Score = ( Sum(w_i * min(1.0, TrainerProficiency_i / RequiredProficiency_i)) / Sum(w_i) ) * 100
   * Multipliers applied:
   * + Verified Trainer Bonus: +5%
   * + Experience Multiplier: up to +5% for 5+ years experience
   * Mandatory penalty: If trainer lacks a mandatory skill, match capped at 40% with flag.
   */
  static async rankTrainersForProgram(programId: string) {
    const program = await db.program.findUnique({
      where: { id: programId },
      include: {
        skillRequirements: {
          include: { skill: true },
        },
      },
    });

    if (!program) {
      throw new Error('Program not found');
    }

    const requirements = program.skillRequirements;
    if (requirements.length === 0) {
      return {
        programId,
        programTitle: program.title,
        message: 'No skill requirements defined for this program yet.',
        rankedTrainers: [],
      };
    }

    // Fetch all active trainers and their verified skills
    const trainers = await db.user.findMany({
      where: {
        role: Role.TRAINER,
        status: 'APPROVED',
      },
      include: {
        profile: true,
        trainerSkills: {
          include: { skill: true },
        },
      },
    });

    const totalWeight = requirements.reduce((acc, req) => acc + (req.weight || 1.0), 0);

    const scoredTrainers = trainers.map((trainer) => {
      let accumulatedScore = 0;
      let missingMandatoryCount = 0;
      const skillBreakdown: Array<{
        skillName: string;
        requiredLevel: number;
        trainerLevel: number;
        status: 'MET' | 'PARTIAL' | 'MISSING';
        weight: number;
      }> = [];

      requirements.forEach((req) => {
        const trainerSkill = trainer.trainerSkills.find((ts) => ts.skillId === req.skillId);
        const trainerLevel = trainerSkill ? trainerSkill.proficiency : 0;
        const requiredLevel = req.minProficiency;
        const weight = req.weight || 1.0;

        let status: 'MET' | 'PARTIAL' | 'MISSING' = 'MISSING';
        if (trainerLevel >= requiredLevel) {
          status = 'MET';
        } else if (trainerLevel > 0) {
          status = 'PARTIAL';
        }

        if (req.isMandatory && trainerLevel < requiredLevel) {
          missingMandatoryCount++;
        }

        const skillScore = Math.min(1.0, trainerLevel / requiredLevel) * weight;
        accumulatedScore += skillScore;

        skillBreakdown.push({
          skillName: req.skill.name,
          requiredLevel,
          trainerLevel,
          status,
          weight,
        });
      });

      let rawPercentage = (accumulatedScore / totalWeight) * 100;

      // Bonus for experience & verified skills
      const hasVerifiedSkills = trainer.trainerSkills.some((ts) => ts.isVerified);
      if (hasVerifiedSkills) rawPercentage += 5;

      const yearsExp = trainer.profile?.yearsExperience || 0;
      if (yearsExp >= 5) rawPercentage += 5;
      else if (yearsExp >= 2) rawPercentage += 2.5;

      // Cap at 100
      let finalScore = Math.min(100, Math.round(rawPercentage * 10) / 10);

      // Penalty if missing mandatory competencies
      const isQualified = missingMandatoryCount === 0 && finalScore >= 60;
      if (missingMandatoryCount > 0 && finalScore > 45) {
        finalScore = 45; // cap score for mandatory gaps
      }

      return {
        trainerId: trainer.id,
        fullName: trainer.fullName,
        email: trainer.email,
        department: trainer.department,
        designation: trainer.designation,
        avatarUrl: trainer.avatarUrl,
        yearsExperience: yearsExp,
        matchScore: finalScore,
        isQualified,
        missingMandatoryCount,
        skillBreakdown,
      };
    });

    // Sort descending by match score
    scoredTrainers.sort((a, b) => b.matchScore - a.matchScore);

    return {
      programId: program.id,
      programTitle: program.title,
      programCode: program.code,
      totalRequirements: requirements.length,
      rankedTrainers: scoredTrainers,
    };
  }

  /**
   * Assign a trainer to a program based on recommendation
   */
  static async assignTrainerToProgram(programId: string, trainerId: string, matchScore: number) {
    return db.trainerAssignment.upsert({
      where: {
        programId_trainerId: {
          programId,
          trainerId,
        },
      },
      update: {
        matchScore,
        status: 'ASSIGNED',
      },
      create: {
        programId,
        trainerId,
        matchScore,
        status: 'ASSIGNED',
      },
      include: {
        trainer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
          },
        },
        program: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });
  }
}
