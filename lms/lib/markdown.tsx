import type { ReactNode } from "react";
import { MathText } from "@/components/ui/MathText";
import { splitMath } from "@/lib/math-segments";

function renderProse(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-sunken px-1 py-0.5 font-mono text-[0.85em] text-plum-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/** Inline markdown (bold, code) with `$…$` math rendered by KaTeX. */
function renderInline(text: string): ReactNode {
  const nodes = splitMath(text).flatMap((seg, i): ReactNode[] =>
    seg.kind === "math"
      ? [<MathText key={`m-${i}`} text={seg.display ? `$$${seg.value}$$` : `$${seg.value}$`} />]
      : renderProse(seg.value, `t-${i}`)
  );
  return <>{nodes}</>;
}

/** Minimal markdown renderer supporting headings, bold, inline code, lists, and TeX math. */
export function renderMarkdown(content: string): ReactNode {
  // Keep multi-line `$$…$$` blocks on one logical line so the line splitter
  // below never cuts through a formula.
  const flattened = content.replace(/\$\$([\s\S]+?)\$\$/g, (_m, body: string) => `$$${body.replace(/\s*\n\s*/g, " ")}$$`);
  const lines = flattened.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (!listItems.length) return;
    if (listType === "ol") {
      blocks.push(
        <ol key={`list-${blocks.length}`} className="ml-5 list-decimal space-y-1">
          {listItems}
        </ol>
      );
    } else {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="ml-5 list-disc space-y-1">
          {listItems}
        </ul>
      );
    }
    listItems = [];
    listType = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      const text = renderInline(heading[2]);
      if (level === 1) {
        blocks.push(
          <h1 key={blocks.length} className="font-display text-xl text-ink-900">
            {text}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={blocks.length} className="font-display text-lg text-ink-900">
            {text}
          </h2>
        );
      } else {
        blocks.push(
          <h3 key={blocks.length} className="text-base font-semibold text-ink-900">
            {text}
          </h3>
        );
      }
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.*)$/);
    if (unordered) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(<li key={listItems.length}>{renderInline(unordered[1])}</li>);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/);
    if (ordered) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(<li key={listItems.length}>{renderInline(ordered[1])}</li>);
      continue;
    }

    flushList();
    blocks.push(
      <p key={blocks.length} className="leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }
  flushList();

  return <div className="space-y-3 text-sm text-ink-700">{blocks}</div>;
}
