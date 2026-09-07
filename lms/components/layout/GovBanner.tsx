import { TextSizeControl } from "@/components/layout/TextSizeControl";

import { GOV_EMBLEM_SRC } from "@/lib/gov-emblem";

/**
 * The national identity masthead that sits above a government site's own
 * header, following the pattern used across gov.in and the Guidelines for
 * Indian Government Websites (GIGW).
 *
 * The State Emblem is opt-in by presence: drop the official artwork at
 * `public/gov/emblem.svg` (or .png) and it appears. No file, no broken image —
 * the masthead just stays typographic. Nothing is bundled with the repo
 * because the emblem is restricted by the State Emblem of India (Prohibition
 * of Improper Use) Act, 2005, so displaying it is the deploying team's call to
 * make, not this component's.
 */
/**
 * `container` should match the width of the site header rendered directly
 * below, so the two rows line up. The landing page centres a 1180px column;
 * PublicHeader uses a narrower one, which is the default here.
 */
export function GovBanner({
  container = "mx-auto w-full max-w-4xl px-4 md:px-6",
}: {
  container?: string;
} = {}) {
  return (
    // Transparent rather than a fixed surface colour: the landing page paints a
    // cream body while the app shell paints a cool grey, and a masthead that
    // picks either one reads as a mismatched strip on the other.
    <div className="border-b border-hair/70 bg-transparent">
      <div className={`${container} flex items-center justify-between gap-4 py-2.5`}>
        <div className="flex min-w-0 items-center gap-3">
          {GOV_EMBLEM_SRC ? (
            // Plain <img>: the file is a fixed-size local asset, so the
            // optimiser would add a request for nothing.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={GOV_EMBLEM_SRC}
              alt="State Emblem of India"
              className="h-11 w-auto shrink-0"
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
            href="#main-content"
            className="rounded-[6px] px-2 py-1 text-[12px] text-ink-500 transition-colors hover:bg-sunken hover:text-ink-900"
          >
            Skip to content
          </a>
        </div>
      </div>
    </div>
  );
}
