import { redirect } from "next/navigation";
import { BadgeCheck, ShieldCheck, CloudLightning, Award } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrintButton } from "@/components/passport/PrintButton";
import { getSession } from "@/lib/session";
import { getPassportData } from "@/lib/passport-db";
import { formatDate } from "@/lib/utils";

export default async function PassportPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const passport = await getPassportData(session.user.id);
  const { summary, certificates, forecast } = passport;
  const hasContent = summary.totalCount > 0 || certificates.length > 0 || forecast;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl text-ink-900">
            <BadgeCheck className="size-6 text-plum-600" />
            Competency Passport
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            A signed, verifiable record of what you can operate — competencies, credentials and
            forecast skill.
          </p>
        </div>
        <PrintButton />
      </header>

      {/* Identity + signature block */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-lg text-ink-900">{passport.trainee.name ?? "Trainee"}</p>
            <p className="text-sm text-ink-500">
              {[passport.trainee.cadre, passport.trainee.organisation].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-ink-300">Passport no.</p>
            <p className="font-mono text-sm text-ink-900">{passport.passportNumber}</p>
            <p className="mt-1 font-mono text-[10px] text-ink-300">Issued {formatDate(passport.issuedAt)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-hair bg-sunken/40 px-3 py-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-sage-600" />
          <div className="min-w-0">
            <p className="text-xs text-ink-500">
              HMAC-SHA256 signature — {summary.verifiedCount} of {summary.totalCount} competencies examiner-verified.
            </p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-ink-400">{passport.signature}</p>
          </div>
        </div>
      </Card>

      {!hasContent ? (
        <EmptyState
          icon={BadgeCheck}
          title="Your passport is empty for now"
          description="Complete courses, earn certificates, and take the forecast drill to build verifiable competency evidence."
        />
      ) : (
        <div className="space-y-6">
          {/* Competencies */}
          <Card>
            <CardHeader>
              <CardTitle>Competencies</CardTitle>
            </CardHeader>
            {summary.competencies.length === 0 ? (
              <p className="text-sm text-ink-500">No competency evidence yet.</p>
            ) : (
              <ul className="divide-y divide-hair">
                {summary.competencies.map((c) => (
                  <li key={c.competencyId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-900">{c.name}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                        {c.category}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.verified ? (
                        <Badge color="green">Verified</Badge>
                      ) : (
                        <Badge color="slate">Declared</Badge>
                      )}
                      <span className="w-24 text-right font-mono text-xs text-ink-700">{c.levelName}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Forecast skill */}
          {forecast && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <CloudLightning className="size-5 text-ink-300" />
                    Forecast operations skill
                  </span>
                </CardTitle>
              </CardHeader>
              <p className="mb-3 text-xs text-ink-500">
                Over {forecast.attemptedCount} drill {forecast.attemptedCount === 1 ? "case" : "cases"}, verified
                against IMD colour-coded warnings.
              </p>
              <dl className="grid grid-cols-4 gap-3 text-center">
                {[
                  { k: "POD", v: forecast.scores.pod, hint: "detection" },
                  { k: "FAR", v: forecast.scores.far, hint: "false alarms" },
                  { k: "CSI", v: forecast.scores.csi, hint: "warn / no-warn" },
                  { k: "Colour", v: forecast.scores.colourAccuracy, hint: "exact colour" },
                ].map((m) => (
                  <div key={m.k} className="rounded-xl border border-hair bg-paper p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{m.k}</dt>
                    <dd className="mt-1 font-display text-2xl tabular-nums text-ink-900">{m.v.toFixed(2)}</dd>
                    <p className="text-[10px] text-ink-400">{m.hint}</p>
                  </div>
                ))}
              </dl>

              {/*
                POD/FAR/CSI only ask whether a warning was issued at all, so an
                ORANGE call on a RED event still counts as a hit. Spell out the
                colour-level result so a perfect CSI can never read as a perfect
                run.
              */}
              <p className="mt-3 text-xs text-ink-500">
                {forecast.scores.exact} of {forecast.attemptedCount} issued at the exact colour
                {forecast.scores.underWarned > 0 && (
                  <>
                    {" · "}
                    <span className="text-status-unpaid">
                      {forecast.scores.underWarned} under-warned
                    </span>
                  </>
                )}
                {forecast.scores.overWarned > 0 && (
                  <>
                    {" · "}
                    <span className="text-status-partial">{forecast.scores.overWarned} over-warned</span>
                  </>
                )}
                .
              </p>
            </Card>
          )}

          {/* Certificates */}
          {certificates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Award className="size-5 text-ink-300" />
                    Verified credentials
                  </span>
                </CardTitle>
              </CardHeader>
              <ul className="divide-y divide-hair">
                {certificates.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-900">{c.courseName}</p>
                      <p className="font-mono text-[10px] text-ink-300">{c.certificateNumber}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {c.grade && <Badge color="violet">{c.grade}</Badge>}
                      <span className="font-mono text-[10px] text-ink-400">{formatDate(c.issueDate)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
