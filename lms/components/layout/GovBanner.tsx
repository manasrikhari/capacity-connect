import { TextSizeControl } from "@/components/layout/TextSizeControl";

/**
 * The national identity masthead that sits above a government site's own
 * header, following the pattern used across gov.in and the Guidelines for
 * Indian Government Websites (GIGW).
 *
 * ── About the State Emblem ────────────────────────────────────────────────
 * No emblem image ships with this repo, deliberately. The State Emblem of
 * India is restricted by the State Emblem of India (Prohibition of Improper
 * Use) Act, 2005, and copying the file from moes.gov.in would both breach that
 * and hotlink someone else's asset. If your team is authorised to display it,
 * save the official SVG at `public/gov/emblem.svg` and set EMBLEM_SRC below;
 * the layout already reserves the space. Until then the masthead is
 * typographic, which is honest and carries no licensing risk.
 */
const EMBLEM_SRC: string | null = null;

export function GovBanner() {
  return (
    <div className="border-b border-hair bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {EMBLEM_SRC ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={EMBLEM_SRC}
              alt="State Emblem of India"
              className="h-10 w-auto shrink-0"
              width={40}
              height={40}
            />
          ) : (
            <span
              aria-hidden="true"
              className="hidden h-10 w-px shrink-0 bg-hair-strong sm:block"
            />
          )}
          <div className="min-w-0 leading-tight">
            <p lang="hi" className="truncate text-[13px] text-ink-500">
              भारत सरकार
            </p>
            <p className="truncate text-[13px] text-ink-500">Government of India</p>
            <p className="truncate text-[15px] font-semibold text-ink-900">
              Ministry of Earth Sciences
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <TextSizeControl />
          <span aria-hidden="true" className="h-5 w-px bg-hair" />
          <a
            href="#main"
            className="rounded-[6px] px-2 py-1 text-[12px] text-ink-500 transition-colors hover:bg-sunken hover:text-ink-900"
          >
            Skip to content
          </a>
        </div>
      </div>
    </div>
  );
}
