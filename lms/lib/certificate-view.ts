import "server-only";
import type { VerifyView } from "@/components/certificates/VerifyResult";
import type { verifyCertificate } from "@/lib/certificate-db";
import { formatDate } from "@/lib/utils";

/**
 * Map a raw `verifyCertificate` result into the client-safe view shape.
 *
 * Shared so the public verifier and the in-dashboard one cannot drift apart:
 * a certificate must read identically wherever it is checked.
 */
export function toVerifyView(result: Awaited<ReturnType<typeof verifyCertificate>>): VerifyView {
  if (!result.found) return { found: false };
  const c = result.certificate;
  return {
    found: true,
    isValid: result.isValid,
    isTamperFree: result.isTamperFree,
    recipient: {
      name: result.trainee.name ?? "Trainee",
      designation: result.trainee.designation,
      department: result.trainee.department,
    },
    course: {
      name: result.batch.name,
      subject: result.batch.subject,
      wmoTier: result.batch.wmoTier,
    },
    grade: c.grade,
    scorePercent: c.scorePercent,
    issueDateLabel: formatDate(c.issueDate),
    certificateNumber: c.certificateNumber,
    verificationHash: c.verificationHash,
    status: c.status,
  };
}
