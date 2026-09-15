"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { requestEnrollmentAction } from "@/app/student/recommendations/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ExplainWhyBadges } from "@/components/recommendations/ExplainWhyBadges";

export type RecommendationView = {
  batchId: string;
  name: string;
  domain: string | null;
  level: string | null;
  wmoTier: string | null;
  trainerName: string | null;
  score: number;
  reasons: string[];
  enrollmentStatus: "PENDING" | "REJECTED" | null;
};

export function RecommendationCard({ rec }: { rec: RecommendationView }) {
  const [pending, startTransition] = useTransition();

  const requested = rec.enrollmentStatus === "PENDING";

  function request() {
    startTransition(async () => {
      const res = await requestEnrollmentAction(rec.batchId);
      if (res?.error) toast.error(res.error);
      else toast.success("Enrolment requested");
    });
  }

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-ink-900">{rec.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {rec.domain && <Badge color="violet">{rec.domain}</Badge>}
            {rec.level && <Badge color="slate">{rec.level}</Badge>}
            {rec.wmoTier && <Badge color="amber">WMO {rec.wmoTier}</Badge>}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-ink-300">fit</p>
          <p className="font-display text-2xl tabular-nums text-ink-900">
            {rec.score.toFixed(1)}
            <span className="text-base text-ink-300">×</span>
          </p>
        </div>
      </div>

      {rec.trainerName && (
        <p className="text-xs text-ink-500">Trainer: {rec.trainerName}</p>
      )}

      <ExplainWhyBadges reasons={rec.reasons} />

      <div className="mt-1 flex justify-end">
        {requested ? (
          <Button variant="outline" disabled>
            Requested
          </Button>
        ) : (
          <Button onClick={request} loading={pending}>
            Request to join
          </Button>
        )}
      </div>
    </Card>
  );
}
