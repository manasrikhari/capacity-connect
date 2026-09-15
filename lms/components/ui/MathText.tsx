import { Fragment } from "react";
import katex from "katex";
import { splitMath } from "@/lib/math-segments";
import { cn } from "@/lib/utils";

/**
 * Renders a string that mixes prose with TeX math (`$…$`, `$$…$$`, `\(…\)`,
 * `\[…\]`) using KaTeX. No hooks, so it works in server and client
 * components alike; the KaTeX stylesheet is loaded globally in `app/layout.tsx`.
 * Invalid TeX renders in place (throwOnError: false) instead of crashing.
 */
export function MathText({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return null;
  const segments = splitMath(text);
  if (segments.every((s) => s.kind === "text")) return <span className={className}>{text}</span>;

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <Fragment key={i}>{seg.value}</Fragment>
        ) : (
          <span
            key={i}
            className={cn(seg.display ? "my-2 block overflow-x-auto" : "inline")}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(seg.value, {
                displayMode: seg.display,
                throwOnError: false,
                strict: "ignore",
              }),
            }}
          />
        )
      )}
    </span>
  );
}
