import { Award, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { claimCertificateAction, getTraineeCourseEligibility } from "./actions";
import { CertificateCard, type CertificateCardData } from "@/components/certificates/CertificateCard";
import { EligibilityHint } from "@/components/certificates/EligibilityHint";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getSession } from "@/lib/session";

// Void-returning wrapper so the claim form type-checks as a server action.
async function claimForm(batchId: string) {
  "use server";
  await claimCertificateAction(batchId);
}

export default async function StudentCertificatesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const rows = await getTraineeCourseEligibility(session.user.id);

  const earned: CertificateCardData[] = rows
    .filter((r) => r.certificate)
    .map((r) => ({
      id: r.certificate!.id,
      certificateNumber: r.certificate!.certificateNumber,
      courseName: r.batch.name,
      grade: r.certificate!.grade,
      scorePercent: r.certificate!.scorePercent,
      issueDate: r.certificate!.issueDate,
      verificationHash: r.certificate!.verificationHash,
      status: r.certificate!.status,
    }));

  const claimable = rows.filter((r) => !r.certificate);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl text-ink-900">My certificates</h1>
        <p className="mt-1 text-sm text-ink-500">
          Earned credentials, each verifiable by anyone at /verify.
        </p>
      </div>

      {/* Earned */}
      <section className="space-y-3">
        <h2 className="border-b border-hair-strong pb-2 text-sm font-semibold text-ink-900">
          Earned ({earned.length})
        </h2>
        {earned.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Finish a course's assessments and attendance, then claim your certificate below."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {earned.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} />
            ))}
          </div>
        )}
      </section>

      {/* Claimable / pending eligibility */}
      {claimable.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b border-hair-strong pb-2 text-sm font-semibold text-ink-900">
            Your courses
          </h2>
          <ul className="divide-y divide-hair overflow-hidden rounded-2xl border border-hair bg-paper">
            {claimable.map((row) => (
              <li
                key={row.batch.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{row.batch.name}</p>
                  {row.batch.subject && (
                    <p className="truncate text-xs text-ink-500">{row.batch.subject}</p>
                  )}
                </div>
                <div className="sm:shrink-0">
                  {row.eligibility.ok ? (
                    <form action={claimForm.bind(null, row.batch.id)}>
                      <Button type="submit" variant="primary" size="sm">
                        <Award className="size-4" />
                        Claim certificate
                      </Button>
                    </form>
                  ) : (
                    <div className="sm:max-w-sm">
                      <EligibilityHint reason={row.eligibility.reason} />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="flex items-center gap-1.5 text-xs text-ink-300">
        <ShieldCheck className="size-3.5" />
        Certificates are signed with HMAC-SHA256 and can be verified without signing in.
      </p>
    </div>
  );
}
