/**
 * Pure helpers for text that mixes prose with TeX math (`$…$` inline,
 * `$$…$$` display, plus `\(…\)` / `\[…\]`). No DOM, no KaTeX — safe for
 * vitest and for both server and client components. Rendering lives in
 * `components/ui/MathText.tsx`.
 */

export type MathSegment =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string; display: boolean };

/** Normalise `\(…\)` and `\[…\]` to dollar delimiters so one regex handles all. */
export function normaliseMathDelimiters(text: string): string {
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, body: string) => `$$${body}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, body: string) => `$${body}$`);
}

// `$$…$$` first (may span lines); then `$…$` on a single line, with no
// whitespace hugging the delimiters so "$5 and $10" stays prose.
const MATH_RE = /\$\$([\s\S]+?)\$\$|\$(?!\s)((?:\\.|[^$\\\n])+?)(?<!\s)\$/g;

export function splitMath(input: string): MathSegment[] {
  const text = normaliseMathDelimiters(input ?? "");
  const out: MathSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(MATH_RE)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ kind: "text", value: text.slice(last, start) });
    if (m[1] !== undefined) out.push({ kind: "math", value: m[1].trim(), display: true });
    else out.push({ kind: "math", value: (m[2] ?? "").trim(), display: false });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

/** True when the text contains at least one math segment. */
export function hasMath(text: string): boolean {
  return splitMath(text).some((s) => s.kind === "math");
}

/** Strip Markdown syntax from a prose fragment (math is handled separately). */
function stripMarkdownProse(text: string): string {
  return text
    .replace(/```[a-z]*\n?/gi, " ") // fence markers
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "") // list markers
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1") // images → alt
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → text
    .replace(/(\*\*|__)(.+?)\1/g, "$2") // bold
    .replace(/(^|[^\w$\\])[*_](?!\s)(.+?)(?<!\s)[*_](?=[^\w]|$)/g, "$1$2") // italic
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/^\s*\|?\s*[-:| ]+\|\s*$/gm, "") // table rules
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ");
}

/**
 * A one-line plain-text excerpt of a Markdown note that keeps `$…$` math
 * intact (display math is demoted to inline) so `MathText` can render it in
 * a card. Truncates at `max` characters without cutting inside a formula.
 */
export function markdownExcerpt(content: string, max = 240): string {
  const segments = splitMath(content ?? "");
  let out = "";
  for (const seg of segments) {
    let piece = seg.kind === "text" ? stripMarkdownProse(seg.value) : `$${seg.value}$`;
    if (!piece) continue;
    // Keep a separator between pieces so two formulas never fuse into `$…$$…$`.
    if (out && !/\s$/.test(out) && !/^\s/.test(piece)) piece = ` ${piece}`;
    if (out.length + piece.length > max) {
      if (seg.kind === "text") {
        const room = max - out.length;
        const cut = piece.slice(0, room).replace(/\s+\S*$/, "");
        out += cut;
      }
      return `${out.trim()}…`;
    }
    out += piece;
  }
  return out.trim();
}
