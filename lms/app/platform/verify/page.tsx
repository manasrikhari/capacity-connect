import { Search } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { VerifyResult, type VerifyView } from "@/components/certificates/VerifyResult";
import { Card } from "@/components/ui/Card";
import { fieldClasses } from "@/components/ui/Field";
import { verifyCertificate } from "@/lib/certificate-db";
import { toVerifyView } from "@/lib/certificate-view";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Certificate verification inside the ministry shell.
 *
 * The public verifier at /verify is a standalone page by design — it is meant
 * to be reachable from a QR code with no account. An admin already signed in
 * should not be thrown out of the dashboard to check a number, so this is the
 * same lookup rendered in place, with the sidebar kept.
 */
export default async function PlatformVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let view: VerifyView | null = null;
  let throttled = false;

  if (query) {
    const ip = clientIp(await headers());
    if (rateLimit(`verify:${ip}`)) {
      view = toVerifyView(await verifyCertificate(query));
    } else {
      throttled = true;
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-normal text-ink-900">Verify a certificate</h1>
        <p className="mt-1 text-sm text-ink-500">
          Check a certificate number or its verification signature. The same check is available
          publicly at <span className="font-mono text-ink-700">/verify</span> for anyone without an
          account.
        </p>
      </div>

      <Card>
        <form method="get" className="flex gap-2">
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
      </Card>

      {throttled ? (
        <div className="rounded-2xl border border-hair-strong bg-sunken/40 p-5 text-center text-sm text-ink-500">
          Too many checks in a short time. Please wait a moment and try again.
        </div>
      ) : view ? (
        <VerifyResult view={view} />
      ) : null}
    </div>
  );
}
