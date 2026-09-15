"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";
import { assignTrainerToBatch, verifyTrainerSkillAction } from "@/app/platform/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkillBreakdown } from "@/components/competency/SkillBreakdown";
import { cn } from "@/lib/utils";

export type RankedTrainerView = {
  trainerId: string;
  name: string | null;
  email: string;
  designation: string | null;
  department: string | null;
  matchScore: number;
  isQualified: boolean;
  missingMandatoryCount: number;
  isCurrentTrainer: boolean;
  skillBreakdown: {
    skillName: string;
    requiredLevel: number;
    trainerLevel: number;
    status: "MET" | "PARTIAL" | "MISSING";
    weight: number;
  }[];
};

export function TrainerRankingTable({
  batchId,
  ranked,
}: {
  batchId: string;
  ranked: RankedTrainerView[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function assign(trainerId: string) {
    startTransition(async () => {
      const res = await assignTrainerToBatch(batchId, trainerId);
      if (res?.error) toast.error(res.error);
      else toast.success("Course reassigned");
    });
  }

  if (ranked.length === 0) {
    return <p className="text-sm text-ink-500">No approved trainers to rank.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {ranked.map((t, i) => {
        const isOpen = open === t.trainerId;
        return (
          <div key={t.trainerId} className="rounded-2xl border border-hair bg-paper">
            <div className="flex items-center gap-4 p-4">
              <span className="w-6 shrink-0 font-mono text-sm tabular-nums text-ink-300">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {t.name ?? t.email}
                  </p>
                  {t.isCurrentTrainer && (
                    <Badge color="violet">Assigned</Badge>
                  )}
                </div>
                <p className="truncate text-xs text-ink-500">
                  {[t.designation, t.department].filter(Boolean).join(" · ") || t.email}
                </p>
              </div>

              {/* Match score figure + meter */}
              <div className="w-28 shrink-0">
                <p className="text-right font-display text-2xl tabular-nums text-ink-900">
                  {t.matchScore.toFixed(1)}
                </p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full bg-plum-600"
                    style={{ width: `${Math.min(100, t.matchScore)}%` }}
                  />
                </div>
              </div>

              <div className="w-24 shrink-0 text-right">
                {t.isQualified ? (
                  <Badge color="green">Qualified</Badge>
                ) : (
                  <Badge color="red">Mandatory gap</Badge>
                )}
              </div>

              <button
                onClick={() => setOpen(isOpen ? null : t.trainerId)}
                className="shrink-0 rounded-full p-1.5 text-ink-300 transition-colors hover:bg-sunken hover:text-ink-700"
                aria-label={isOpen ? "Collapse" : "Expand"}
              >
                {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
            </div>

            {isOpen && (
              <div className="border-t border-hair px-4 py-3">
                <SkillBreakdown rows={t.skillBreakdown} />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-ink-500">
                    {t.missingMandatoryCount > 0
                      ? `${t.missingMandatoryCount} mandatory skill${t.missingMandatoryCount > 1 ? "s" : ""} missing`
                      : "All mandatory skills met"}
                  </p>
                  <Button
                    variant={t.isCurrentTrainer ? "outline" : "primary"}
                    disabled={pending || t.isCurrentTrainer}
                    onClick={() => assign(t.trainerId)}
                  >
                    {t.isCurrentTrainer ? "Assigned" : "Assign to course"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Small verify toggle used on the trainer skill rows. */
export function VerifySkillToggle({
  trainerSkillId,
  isVerified,
}: {
  trainerSkillId: string;
  isVerified: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await verifyTrainerSkillAction(trainerSkillId, !isVerified);
          if (res?.error) toast.error(res.error);
        })
      }
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
        isVerified ? "text-sage-700" : "text-ink-300 hover:text-ink-700",
      )}
    >
      {isVerified ? "✓ Verified" : "Verify"}
    </button>
  );
}
