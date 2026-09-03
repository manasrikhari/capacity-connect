import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export type CertificateCardData = {
  id: string;
  certificateNumber: string;
  courseName: string;
  grade: string | null;
  scorePercent: number | null;
  issueDate: Date | string;
  verificationHash: string;
  status: string;
};

const GRADE_COLOR: Record<string, "green" | "amber"> = {
  Distinction: "green",
  Merit: "green",
  Pass: "amber",
};

/** A single earned certificate: number, course, grade, date + sheet/verify links. */
export function CertificateCard({ cert }: { cert: CertificateCardData }) {
  const revoked = cert.status === "REVOKED";
  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-hair bg-paper p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
          {cert.certificateNumber}
        </p>
        {revoked ? (
          <Badge color="red">Revoked</Badge>
        ) : (
          <Badge color={GRADE_COLOR[cert.grade ?? "Pass"] ?? "slate"}>{cert.grade ?? "Issued"}</Badge>
        )}
      </div>

      <h3 className="mt-2 text-lg font-medium text-ink-900">{cert.courseName}</h3>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-500">
        {cert.scorePercent !== null && (
          <div className="flex items-baseline gap-1.5">
            <dt className="text-ink-300">Score</dt>
            <dd className="font-mono text-ink-700 tabular-nums">{cert.scorePercent}%</dd>
          </div>
        )}
        <div className="flex items-baseline gap-1.5">
          <dt className="text-ink-300">Issued</dt>
          <dd className="font-mono text-ink-700 tabular-nums">{formatDate(cert.issueDate)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hair pt-4">
        <Link href={`/student/certificates/${cert.id}`} className={buttonClasses("secondary", "sm")}>
          View certificate
        </Link>
        <Link
          href={`/verify/${cert.verificationHash}`}
          className={buttonClasses("ghost", "sm")}
          target="_blank"
        >
          <ShieldCheck className="size-4" />
          Verify
          <ExternalLink className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
