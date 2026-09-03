import { Award, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRosterEligibility, issueCertificateAction, revokeCertificateAction } from "./actions";
import { EligibilityHint } from "@/components/certificates/EligibilityHint";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getActiveBatch } from "@/lib/batch";
import { getSession } from "@/lib/session";

// Void-returning wrappers so the roster forms type-check as server actions.
// The imported actions revalidate this route, so the roster refreshes in place.
async function issueForm(traineeId: string) {
  "use server";
  await issueCertificateAction(traineeId);
}
async function revokeForm(id: string) {
  "use server";
  await revokeCertificateAction(id);
}

const GRADE_COLOR: Record<string, "green" | "amber" | "slate"> = {
  Distinction: "green",
  Merit: "green",
  Pass: "amber",
};

export default async function AdminCertificatesPage() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") redirect("/");
  const batch = await getActiveBatch(session);
  if (!batch) redirect("/admin");

  const roster = await getRosterEligibility(batch.id);
  const issuedCount = roster.filter((r) => r.certificate && r.certificate.status === "VALID").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-ink-900">Certificates</h1>
        <p className="mt-1 text-sm text-ink-500">
          Issue verifiable certificates to eligible trainees in {batch.name}.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-hair-strong pt-3 text-sm text-ink-500">
        <span>
          <span className="font-display text-xl text-ink-900 tabular-nums">{roster.length}</span>{" "}
          approved {roster.length === 1 ? "trainee" : "trainees"}
        </span>
        <span>
          <span className="font-display text-xl text-ink-900 tabular-nums">{issuedCount}</span>{" "}
          issued
        </span>
      </div>

      {roster.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No approved trainees yet"
          description="Once trainees are approved into this course, their eligibility appears here."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-hair bg-paper">
          {/* Header row (wide screens) */}
          <div className="hidden gap-4 border-b border-hair bg-sunken/30 px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-300 md:grid md:grid-cols-[1.6fr_0.7fr_0.7fr_1.4fr]">
            <span>Trainee</span>
            <span className="text-right">Best</span>
            <span className="text-right">Attendance</span>
            <span className="text-right">Certificate</span>
          </div>

          <ul className="divide-y divide-hair">
            {roster.map((row) => {
              const el = row.eligibility;
              const cert = row.certificate;
              const bestPct = el.ok ? `${el.bestPercent}%` : "—";
              const attPct = el.ok
                ? el.attendancePercent === null
                  ? "—"
                  : `${el.attendancePercent}%`
                : "—";

              return (
                <li
                  key={row.trainee.id}
                  className="grid grid-cols-1 gap-3 px-4 py-3.5 md:grid-cols-[1.6fr_0.7fr_0.7fr_1.4fr] md:items-center md:gap-4"
                >
                  {/* Trainee */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-900">{row.trainee.name}</p>
                    {row.trainee.designation && (
                      <p className="truncate text-xs text-ink-500">{row.trainee.designation}</p>
                    )}
                  </div>

                  {/* Best % */}
                  <p className="font-mono text-sm text-ink-700 tabular-nums md:text-right">
                    <span className="text-ink-300 md:hidden">Best </span>
                    {bestPct}
                  </p>

                  {/* Attendance % */}
                  <p className="font-mono text-sm text-ink-700 tabular-nums md:text-right">
                    <span className="text-ink-300 md:hidden">Attendance </span>
                    {attPct}
                  </p>

                  {/* Certificate / action */}
                  <div className="md:flex md:items-center md:justify-end md:text-right">
                    {cert ? (
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <span className="font-mono text-xs text-ink-700 tabular-nums">
                          {cert.certificateNumber}
                        </span>
                        {cert.status === "REVOKED" ? (
                          <Badge color="red">Revoked</Badge>
                        ) : (
                          <Badge color={GRADE_COLOR[cert.grade ?? "Pass"] ?? "slate"}>
                            {cert.grade ?? "Issued"}
                          </Badge>
                        )}
                        {cert.status !== "REVOKED" && (
                          <form action={revokeForm.bind(null, cert.id)}>
                            <Button type="submit" variant="danger" size="sm">
                              Revoke
                            </Button>
                          </form>
                        )}
                      </div>
                    ) : el.ok ? (
                      <form action={issueForm.bind(null, row.trainee.id)} className="md:text-right">
                        <Button type="submit" variant="primary" size="sm">
                          <Award className="size-4" />
                          Issue
                        </Button>
                      </form>
                    ) : (
                      <div className="md:max-w-xs md:justify-self-end">
                        <EligibilityHint reason={el.reason} />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-ink-300">
        <ShieldCheck className="size-3.5" />
        Every certificate is signed with HMAC-SHA256 and verifiable at{" "}
        <Link href="/verify" className="text-plum-700 hover:underline">
          /verify
        </Link>
        .
      </p>
    </div>
  );
}
