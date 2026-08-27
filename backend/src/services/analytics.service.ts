import { db } from '../config/db';
import { Role } from '@prisma/client';

export class AnalyticsService {
  /**
   * Aggregate high-level platform KPI metrics for Admin / Super Admin dashboard
   */
  static async getPlatformSummary() {
    const [
      totalUsers,
      totalTrainers,
      totalTrainees,
      totalPrograms,
      totalEnrollments,
      totalCertificates,
      activeSessions,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: Role.TRAINER } }),
      db.user.count({ where: { role: Role.TRAINEE } }),
      db.program.count(),
      db.enrollment.count(),
      db.certificate.count({ where: { status: 'VALID' } }),
      db.liveSession.count({ where: { status: 'LIVE' } }),
    ]);

    // Average attendance rate across all active/completed enrollments
    const enrollments = await db.enrollment.findMany({
      select: { attendancePercentage: true, progressPercentage: true, status: true },
    });

    const totalTracked = enrollments.length || 1;
    const avgAttendance =
      enrollments.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / totalTracked;
    const avgProgress =
      enrollments.reduce((acc, curr) => acc + curr.progressPercentage, 0) / totalTracked;
    const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const completionRate = Math.round((completedCount / totalTracked) * 100);

    return {
      kpi: {
        totalUsers,
        totalTrainers,
        totalTrainees,
        totalPrograms,
        totalEnrollments,
        totalCertificates,
        activeSessions,
        avgAttendance: Math.round(avgAttendance * 10) / 10,
        avgProgress: Math.round(avgProgress * 10) / 10,
        completionRate,
      },
    };
  }

  /**
   * Department-wise capacity building metrics
   */
  static async getDepartmentDistribution() {
    const programs = await db.program.findMany({
      include: {
        _count: {
          select: { enrollments: true, certificates: true },
        },
      },
    });

    const deptMap: Record<string, { programs: number; trainees: number; certificates: number }> = {};

    programs.forEach((p) => {
      const dept = p.department || 'General';
      if (!deptMap[dept]) {
        deptMap[dept] = { programs: 0, trainees: 0, certificates: 0 };
      }
      deptMap[dept].programs += 1;
      deptMap[dept].trainees += p._count.enrollments;
      deptMap[dept].certificates += p._count.certificates;
    });

    return Object.entries(deptMap).map(([department, stats]) => ({
      department,
      ...stats,
    }));
  }

  /**
   * Top in-demand competency skills mapped in the system
   */
  static async getCompetencySkillMetrics() {
    const skills = await db.skill.findMany({
      include: {
        _count: {
          select: { trainerSkills: true, traineeSkills: true, programRequirements: true },
        },
      },
      orderBy: {
        programRequirements: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return skills.map((s) => ({
      skillId: s.id,
      name: s.name,
      category: s.category,
      programDemandCount: s._count.programRequirements,
      availableTrainers: s._count.trainerSkills,
      upskilledTrainees: s._count.traineeSkills,
    }));
  }
}
