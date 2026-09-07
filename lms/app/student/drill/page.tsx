import { redirect } from "next/navigation";
import Link from "next/link";
import { CloudLightning, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DrillCaseCard } from "@/components/drill/DrillCaseCard";
import { getSession } from "@/lib/session";
import { getDrillForTrainee, DRILL_EVIDENCE_MINIMUM } from "@/lib/weather-case-db";

export default async function DrillPage() {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") redirect("/");

  const { cases, scores, grade, attemptedCount } = await getDrillForTrainee(session.user.id);
  const earnsEvidence = attemptedCount >= DRILL_EVIDENCE_MINIMUM;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-2xl text-ink-900">
          <CloudLightning className="size-6 text-plum-600" />
          Forecast operations drill
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Issue IMD colour-coded warnings for each situation. Your calls are scored deterministically
          (POD / FAR / CSI); {DRILL_EVIDENCE_MINIMUM}+ cases earn Competency Passport evidence.
        </p>
      </header>

      {attemptedCount > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4">
              {[
                { k: "POD", v: scores.pod },
                { k: "FAR", v: scores.far },
                { k: "CSI", v: scores.csi },
              ].map((m) => (
                <div key={m.k}>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{m.k}</p>
                  <p className="font-display text-xl tabular-nums text-ink-900">{m.v.toFixed(2)}</p>
                </div>
              ))}
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">Grade</p>
                <p className="font-display text-xl text-ink-900">{grade}</p>
              </div>
            </div>
            {earnsEvidence && (
              <Link
                href="/student/passport"
                className="inline-flex items-center gap-1.5 text-sm text-plum-600 hover:underline"
              >
                <BadgeCheck className="size-4" />
                On your passport
              </Link>
            )}
          </div>
          {!earnsEvidence && (
            <p className="mt-2 font-mono text-[11px] text-ink-400">
              {DRILL_EVIDENCE_MINIMUM - attemptedCount} more{" "}
              {DRILL_EVIDENCE_MINIMUM - attemptedCount === 1 ? "case" : "cases"} to earn passport evidence.
            </p>
          )}
        </Card>
      )}

      {cases.length === 0 ? (
        <EmptyState
          icon={CloudLightning}
          title="No drill cases available yet"
          description="Your trainer publishes weather cases for your courses. Check back once a drill is set."
        />
      ) : (
        <div className="space-y-4">
          {cases.map((c) => (
            <DrillCaseCard key={c.id} initial={c} />
          ))}
        </div>
      )}
    </div>
  );
}
