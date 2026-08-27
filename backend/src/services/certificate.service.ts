import crypto from 'crypto';
import { db } from '../config/db';
import { ENV } from '../config/env';

export class CertificateService {
  /**
   * Generate a tamper-proof SHA-256 HMAC cryptographic verification hash
   */
  static generateVerificationHash(
    certificateNumber: string,
    traineeId: string,
    programId: string,
    issueDate: Date
  ): string {
    const rawData = `${certificateNumber}:${traineeId}:${programId}:${issueDate.toISOString()}`;
    return crypto
      .createHmac('sha256', ENV.CERTIFICATE_SECRET)
      .update(rawData)
      .digest('hex');
  }

  /**
   * Issue a certificate to a trainee upon program completion
   */
  static async issueCertificate(data: {
    programId: string;
    traineeId: string;
    pdfUrl?: string;
    metadata?: any;
  }) {
    // Check if enrollment exists and is completed
    const enrollment = await db.enrollment.findUnique({
      where: {
        programId_traineeId: {
          programId: data.programId,
          traineeId: data.traineeId,
        },
      },
      include: {
        program: true,
        trainee: true,
      },
    });

    if (!enrollment) {
      throw new Error('Trainee is not enrolled in this program');
    }

    // Check if certificate already issued
    const existing = await db.certificate.findFirst({
      where: {
        programId: data.programId,
        traineeId: data.traineeId,
      },
    });

    if (existing) {
      return existing;
    }

    const issueDate = new Date();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const certificateNumber = `CC-2026-${randomSuffix}`;
    const verificationHash = this.generateVerificationHash(
      certificateNumber,
      data.traineeId,
      data.programId,
      issueDate
    );

    // Update enrollment status to COMPLETED if not already
    await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'COMPLETED',
        completedAt: issueDate,
        progressPercentage: 100,
      },
    });

    return db.certificate.create({
      data: {
        certificateNumber,
        verificationHash,
        programId: data.programId,
        traineeId: data.traineeId,
        issueDate,
        pdfUrl: data.pdfUrl,
        metadata: data.metadata || {
          programTitle: enrollment.program.title,
          recipientName: enrollment.trainee.fullName,
          completionDate: issueDate.toISOString(),
        },
      },
      include: {
        program: {
          select: {
            title: true,
            code: true,
            department: true,
          },
        },
        trainee: {
          select: {
            fullName: true,
            email: true,
            organization: true,
          },
        },
      },
    });
  }

  /**
   * Public Verification Route
   * Verifies certificate authenticity via certificate number OR hash
   */
  static async verifyCertificate(query: string) {
    const certificate = await db.certificate.findFirst({
      where: {
        OR: [
          { certificateNumber: query.trim() },
          { verificationHash: query.trim() },
        ],
      },
      include: {
        program: {
          select: {
            title: true,
            code: true,
            department: true,
            startDate: true,
            endDate: true,
          },
        },
        trainee: {
          select: {
            fullName: true,
            organization: true,
            department: true,
          },
        },
      },
    });

    if (!certificate) {
      return {
        isValid: false,
        message: 'No certificate found matching the provided identifier.',
      };
    }

    // Verify cryptographic integrity
    const expectedHash = this.generateVerificationHash(
      certificate.certificateNumber,
      certificate.traineeId,
      certificate.programId,
      certificate.issueDate
    );

    const isTamperFree = expectedHash === certificate.verificationHash;

    return {
      isValid: certificate.status === 'VALID' && isTamperFree,
      status: certificate.status,
      certificateNumber: certificate.certificateNumber,
      recipient: certificate.trainee.fullName,
      organization: certificate.trainee.organization,
      programTitle: certificate.program.title,
      programCode: certificate.program.code,
      department: certificate.program.department,
      issueDate: certificate.issueDate,
      verificationHash: certificate.verificationHash,
      isCryptographicallyVerified: isTamperFree,
    };
  }

  /**
   * Get all certificates for a user
   */
  static async getUserCertificates(traineeId: string) {
    return db.certificate.findMany({
      where: { traineeId },
      include: {
        program: {
          select: {
            title: true,
            code: true,
            department: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
  }
}
