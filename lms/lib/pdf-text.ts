import "server-only";
import { normaliseWhitespace } from "@/lib/knowledge-extract";

/**
 * PDF text extraction via `unpdf`.
 *
 * `pdfjs-dist` is declared in the `live/` workspace and hoisted to the repo
 * root, but it is the browser build: it reaches for DOMMatrix, a canvas and a
 * worker URL. `unpdf` ships a pre-patched DOM-free pdfjs for exactly this
 * case, with no native dependencies.
 *
 * The import is lazy so this module stays cheap to import from a route that
 * may never touch a PDF.
 */
export async function extractPdfText(
  bytes: Uint8Array,
): Promise<{ text: string; pageCount: number }> {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  return {
    text: normaliseWhitespace(Array.isArray(text) ? text.join("\n\n") : text),
    pageCount: totalPages,
  };
}
