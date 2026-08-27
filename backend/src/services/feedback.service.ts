import { db } from '../config/db';

export class FeedbackService {
  /**
   * Submit course and trainer feedback
   */
  static async submitFeedback(data: {
    programId: string;
    traineeId: string;
    trainerId?: string;
    overallRating: number;
    contentRating?: number;
    trainerRating?: number;
    infrastructureRating?: number;
    comments?: string;
    suggestions?: string;
  }) {
    return db.feedback.upsert({
      where: {
        programId_traineeId: {
          programId: data.programId,
          traineeId: data.traineeId,
        },
      },
      update: {
        trainerId: data.trainerId,
        overallRating: data.overallRating,
        contentRating: data.contentRating,
        trainerRating: data.trainerRating,
        infrastructureRating: data.infrastructureRating,
        comments: data.comments,
        suggestions: data.suggestions,
      },
      create: {
        programId: data.programId,
        traineeId: data.traineeId,
        trainerId: data.trainerId,
        overallRating: data.overallRating,
        contentRating: data.contentRating,
        trainerRating: data.trainerRating,
        infrastructureRating: data.infrastructureRating,
        comments: data.comments,
        suggestions: data.suggestions,
      },
    });
  }

  /**
   * Get feedback summary for a program
   */
  static async getProgramFeedbackSummary(programId: string) {
    const feedbacks = await db.feedback.findMany({
      where: { programId },
      include: {
        trainee: {
          select: {
            fullName: true,
            organization: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const count = feedbacks.length;
    if (count === 0) {
      return {
        totalResponses: 0,
        averageOverall: 0,
        averageContent: 0,
        averageTrainer: 0,
        averageInfrastructure: 0,
        feedbacks: [],
      };
    }

    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((n): n is number => typeof n === 'number');
      return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : 0;
    };

    return {
      totalResponses: count,
      averageOverall: avg(feedbacks.map((f) => f.overallRating)),
      averageContent: avg(feedbacks.map((f) => f.contentRating)),
      averageTrainer: avg(feedbacks.map((f) => f.trainerRating)),
      averageInfrastructure: avg(feedbacks.map((f) => f.infrastructureRating)),
      feedbacks,
    };
  }
}
