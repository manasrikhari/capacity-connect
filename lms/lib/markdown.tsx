import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-violet-50 px-1 py-0.5 text-[0.85em] text-violet-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/** Minimal markdown renderer supporting headings, bold, inline code, and lists. */
export function renderMarkdown(content: string): ReactNode {
  const lines = content.split("\n");
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
          <h1 key={blocks.length} className="text-xl font-semibold text-slate-800">
            {text}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={blocks.length} className="text-lg font-semibold text-slate-800">
            {text}
          </h2>
        );
      } else {
        blocks.push(
          <h3 key={blocks.length} className="text-base font-semibold text-slate-800">
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

  return <div className="space-y-3 text-sm text-slate-700">{blocks}</div>;
}
