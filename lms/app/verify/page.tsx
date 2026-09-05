import { Search, ShieldCheck } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { VerifyResult, type VerifyView } from "@/components/certificates/VerifyResult";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { fieldClasses } from "@/components/ui/Field";
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

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let view: VerifyView | null = null;
  let throttled = false;

  if (query) {
    const ip = clientIp(await headers());
    if (rateLimit(`verify:${ip}`)) {
      view = toView(await verifyCertificate(query));
    } else {
      throttled = true;
    }
  }

  return (
    <>
      <PublicHeader
        right={
          <Link href="/announcements" className="text-sm text-plum-700 hover:underline">
            Announcements
          </Link>
        }
      />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12 sm:py-16">
        <header className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-plum-50 text-plum-600">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="font-display text-3xl text-ink-900">Verify a certificate</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            Enter a certificate number or its verification signature to confirm it is genuine.
          </p>
        </header>

        <form method="get" className="mt-8 flex gap-2">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
            />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="IMD-CC-2026-000100"
              autoComplete="off"
              className={`${fieldClasses} pl-9`}
              aria-label="Certificate number or signature"
            />
          </div>
          <button
            type="submit"
            className="inline-flex cursor-pointer items-center justify-center rounded-[10px] bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700"
          >
            Verify
          </button>
        </form>

        <div className="mt-8">
          {throttled ? (
            <div className="rounded-2xl border border-hair-strong bg-sunken/40 p-5 text-center text-sm text-ink-500">
              Too many checks in a short time. Please wait a moment and try again.
            </div>
          ) : view ? (
            <VerifyResult view={view} />
          ) : (
            <p className="text-center text-xs text-ink-300">
              Verification is public — no sign-in required.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
