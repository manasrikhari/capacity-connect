import Link from "next/link";
import { headers } from "next/headers";
import { VerifyResult, type VerifyView } from "@/components/certificates/VerifyResult";
import { buttonClasses } from "@/components/ui/Button";
import { verifyCertificate } from "@/lib/certificate-db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Map the raw verifyCertificate result into the client-safe view shape. */
function toView(result: Awaited<ReturnType<typeof verifyCertificate>>): VerifyView {
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
    course: { name: result.batch.name, subject: result.batch.subject, wmoTier: result.batch.wmoTier },
    grade: c.grade,
    scorePercent: c.scorePercent,
    issueDateLabel: formatDate(c.issueDate),
    certificateNumber: c.certificateNumber,
    verificationHash: c.verificationHash,
    status: c.status,
  };
}

export default async function VerifyByQueryPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = await params;
  const decoded = decodeURIComponent(query).trim();

  const ip = clientIp(await headers());
  const allowed = rateLimit(`verify:${ip}`);
  const view: VerifyView | null = allowed ? toView(await verifyCertificate(decoded)) : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl px-4 py-12 sm:py-16">
      <header className="text-center">
        <h1 className="font-display text-3xl text-ink-900">Certificate verification</h1>
        <p className="mt-2 font-mono text-xs break-all text-ink-500">{decoded}</p>
      </header>

      <div className="mt-8">
        {allowed && view ? (
          <VerifyResult view={view} />
        ) : (
          <div className="rounded-2xl border border-hair-strong bg-sunken/40 p-5 text-center text-sm text-ink-500">
            Too many checks in a short time. Please wait a moment and try again.
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link href="/verify" className={buttonClasses("secondary", "sm")}>
          Verify another certificate
        </Link>
      </div>
    </main>
  );
}
