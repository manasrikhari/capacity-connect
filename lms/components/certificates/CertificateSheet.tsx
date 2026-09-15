"use client";

import { Printer } from "lucide-react";
import { qrSvg } from "@/lib/qr";

export type CertificateSheetData = {
  recipientName: string;
  designation: string | null;
  courseName: string;
  domain: string | null;
  wmoTier: string | null;
  grade: string | null;
  scorePercent: number | null;
  issueDateLabel: string;
  certificateNumber: string;
  verificationHash: string;
  /** Path shown as text, e.g. "/verify/<hash>". */
  verifyPath: string;
  /** Absolute URL encoded into the QR code. */
  verifyUrl: string;
};

// Text-only wordmarks — deliberately NO emblem/logo (must not imitate the
// State Emblem of India).
const WORDMARKS = [
  "भारत सरकार / Government of India",
  "Ministry of Earth Sciences",
  "India Meteorological Department",
];

export function CertificateSheet({ data }: { data: CertificateSheetData }) {
  const qr = qrSvg(data.verifyUrl, { size: 128, margin: 2 });

  return (
    <div className="space-y-4">
      {/* Screen-only toolbar */}
      <div className="no-print flex items-center justify-between gap-3">
        <p className="text-sm text-ink-500">Print this certificate or save it as a PDF.</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700"
        >
          <Printer className="size-4" />
          Print / Save as PDF
        </button>
      </div>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body * { visibility: hidden !important; }
          #cert-sheet, #cert-sheet * { visibility: visible !important; }
          #cert-sheet {
            position: fixed; inset: 0; margin: 0 !important;
            width: 100%; height: 100%; border: none !important; box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* The sheet: A4 landscape aspect on screen, fills the page in print */}
      <div
        id="cert-sheet"
        className="mx-auto aspect-[297/210] w-full max-w-[1000px] overflow-hidden rounded-2xl border-2 border-hair-strong bg-paper"
      >
        <div className="flex h-full flex-col p-[5%]">
          {/* Header wordmarks */}
          <header className="text-center">
            {WORDMARKS.map((line, i) => (
              <p
                key={line}
                className={
                  i === 0
                    ? "text-sm text-ink-700"
                    : i === 2
                      ? "font-display text-xl text-ink-900"
                      : "text-base text-ink-700"
                }
              >
                {line}
              </p>
            ))}
            <div className="mx-auto mt-3 h-px w-24 bg-hair-strong" />
          </header>

          {/* Body */}
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-500">
              This is to certify that
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink-900">{data.recipientName}</h1>
            {data.designation && <p className="mt-1 text-sm text-ink-500">{data.designation}</p>}

            <p className="mt-5 max-w-2xl text-sm text-ink-700">
              has successfully completed the course of training
            </p>
            <h2 className="mt-2 max-w-3xl font-display text-2xl text-ink-900">{data.courseName}</h2>

            <p className="mt-4 font-display text-xl text-ink-900">Certificate of Completion</p>

            {/* Meta grid */}
            <dl className="mt-5 flex flex-wrap items-start justify-center gap-x-10 gap-y-3 text-left">
              {data.domain && (
                <MetaItem label="Domain" value={data.domain} />
              )}
              {data.wmoTier && <MetaItem label="WMO tier" value={data.wmoTier} mono />}
              {data.grade && (
                <MetaItem
                  label="Grade"
                  value={
                    data.scorePercent !== null ? `${data.grade} · ${data.scorePercent}%` : data.grade
                  }
                />
              )}
              <MetaItem label="Issued" value={data.issueDateLabel} mono />
            </dl>
          </div>

          {/* Footer: number + verification + QR */}
          <footer className="flex items-end justify-between gap-6 border-t border-hair pt-4">
            <div className="min-w-0 space-y-1 text-left">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Certificate no.
              </p>
              <p className="font-mono text-sm text-ink-900 tabular-nums">{data.certificateNumber}</p>
              <p className="pt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
                Verify at
              </p>
              <p className="font-mono text-xs break-all text-ink-700">{data.verifyPath}</p>
            </div>
            <div className="shrink-0 text-center">
              <div
                className="size-[128px]"
                aria-hidden="false"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-300">
                Scan to verify
              </p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">{label}</dt>
      <dd className={mono ? "font-mono text-sm text-ink-900 tabular-nums" : "text-sm text-ink-900"}>
        {value}
      </dd>
    </div>
  );
}
