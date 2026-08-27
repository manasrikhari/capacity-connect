import { db } from '../config/db';

export class ProfileService {
  static async getProfileByUserId(userId: string) {
    const profile = await db.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            organization: true,
            department: true,
            designation: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) {
      // Auto-create empty profile if none exists
      return db.profile.create({
        data: {
          userId,
          interests: [],
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              organization: true,
              department: true,
              designation: true,
              phone: true,
              avatarUrl: true,
            },
          },
        },
      });
    }

    return profile;
  }

  static async updateProfile(
    userId: string,
    data: {
      bio?: string;
      qualifications?: string;
      yearsExperience?: number;
      resumeUrl?: string;
      linkedinUrl?: string;
      address?: string;
      interests?: string[];
      fullName?: string;
      organization?: string;
      department?: string;
      designation?: string;
      phone?: string;
      avatarUrl?: string;
    }
  ) {
    const { fullName, organization, department, designation, phone, avatarUrl, ...profileData } = data;

    // Update User table details if provided
    if (fullName || organization || department || designation || phone || avatarUrl) {
      await db.user.update({
        where: { id: userId },
        data: {
          ...(fullName && { fullName }),
          ...(organization && { organization }),
          ...(department && { department }),
          ...(designation && { designation }),
          ...(phone && { phone }),
          ...(avatarUrl && { avatarUrl }),
        },
      });
    }

    // Upsert Profile
    return db.profile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData,
        interests: profileData.interests || [],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            organization: true,
            department: true,
            designation: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  static async addTrainerSkill(
    trainerId: string,
    data: {
      skillName: string;
      category: string;
      proficiency: number;
      yearsExperience: number;
    }
  ) {
    // Find or create skill in taxonomy
    const skill = await db.skill.upsert({
      where: { name: data.skillName.trim() },
      update: {},
      create: {
        name: data.skillName.trim(),
        category: data.category || 'General',
      },
    });

    // Upsert TrainerSkill
    return db.trainerSkill.upsert({
      where: {
        trainerId_skillId: {
          trainerId,
          skillId: skill.id,
        },
      },
      update: {
        proficiency: data.proficiency,
        yearsExperience: data.yearsExperience,
      },
      create: {
        trainerId,
        skillId: skill.id,
        proficiency: data.proficiency,
        yearsExperience: data.yearsExperience,
      },
      include: {
        skill: true,
      },
    });
  }

  static async getTrainerSkills(trainerId: string) {
    return db.trainerSkill.findMany({
      where: { trainerId },
      include: { skill: true },
      orderBy: { proficiency: 'desc' },
    });
  }
}
