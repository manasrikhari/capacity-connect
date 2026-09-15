import Link from "next/link";

/**
 * Server-rendered pagination. Preserves existing query params and only swaps
 * `page`. Built once here; reused by /platform/people and the course catalogue.
 */
export function Pagination({
  page,
  pageCount,
  params,
  basePath,
}: {
  page: number;
  pageCount: number;
  /** Current query params to preserve (page is overwritten). */
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  if (pageCount <= 1) return null;

  function href(p: number) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== "page") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const prev = Math.max(1, page - 1);
  const next = Math.min(pageCount, page + 1);
  const linkCls =
    "rounded-lg border border-hair px-3 py-1.5 text-sm text-ink-700 transition-colors hover:border-plum-300 hover:bg-plum-50";
  const disabledCls = "pointer-events-none rounded-lg border border-hair px-3 py-1.5 text-sm text-ink-300";

  return (
    <nav className="mt-4 flex items-center justify-between gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(prev)} className={linkCls} rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className={disabledCls}>← Previous</span>
      )}
      <span className="font-mono text-xs text-ink-500">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(next)} className={linkCls} rel="next">
          Next →
        </Link>
      ) : (
        <span className={disabledCls}>Next →</span>
      )}
    </nav>
  );
}
