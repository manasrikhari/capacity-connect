import { cn } from "@/lib/utils";

type BreakdownRow = {
  skillName: string;
  requiredLevel: number;
  trainerLevel: number;
  status: "MET" | "PARTIAL" | "MISSING";
  weight: number;
};

const STATUS_STYLE: Record<BreakdownRow["status"], { dot: string; text: string; label: string }> = {
  MET: { dot: "bg-sage-600", text: "text-sage-700", label: "Met" },
  PARTIAL: { dot: "bg-status-partial", text: "text-status-partial", label: "Partial" },
  MISSING: { dot: "bg-status-unpaid", text: "text-status-unpaid", label: "Missing" },
};

/** Per-skill required-vs-held breakdown for one trainer against one course. */
export function SkillBreakdown({ rows }: { rows: BreakdownRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-500">This course has no skill requirements yet.</p>;
  }
  return (
    <div className="divide-y divide-hair">
      {rows.map((r) => {
        const s = STATUS_STYLE[r.status];
        return (
          <div key={r.skillName} className="flex items-center justify-between gap-4 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", s.dot)} aria-hidden="true" />
              <span className="truncate text-sm text-ink-700">{r.skillName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-mono text-xs tabular-nums text-ink-500">
                {r.trainerLevel}/{r.requiredLevel}
              </span>
              <span className={cn("w-14 text-right text-xs font-medium", s.text)}>{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
