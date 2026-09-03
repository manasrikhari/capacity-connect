import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CertificateSheet } from "@/components/certificates/CertificateSheet";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

/** Build the absolute verify URL for the QR code from the incoming request. */
async function absoluteVerifyUrl(hash: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/verify/${hash}`;
}

export default async function CertificateSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      batch: { select: { name: true, subject: true, wmoTier: true } },
      trainee: { select: { name: true, profile: { select: { designation: true } } } },
    },
  });

  // 404 unless the signed-in trainee owns this certificate.
  if (!cert || cert.traineeId !== session.user.id) notFound();

  const verifyUrl = await absoluteVerifyUrl(cert.verificationHash);

  return (
    <div className="py-2">
      <CertificateSheet
        data={{
          recipientName: cert.trainee.name ?? "Trainee",
          designation: cert.trainee.profile?.designation ?? null,
          courseName: cert.batch.name,
          domain: cert.batch.subject,
          wmoTier: cert.batch.wmoTier,
          grade: cert.grade,
          scorePercent: cert.scorePercent,
          issueDateLabel: formatDate(cert.issueDate),
          certificateNumber: cert.certificateNumber,
          verificationHash: cert.verificationHash,
          verifyPath: `/verify/${cert.verificationHash}`,
          verifyUrl,
        }}
      />
    </div>
  );
}
