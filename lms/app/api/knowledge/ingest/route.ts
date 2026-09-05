import { NextResponse } from "next/server";
import { ScrapeError, hasFirecrawlKey, scrapeUrl } from "@/lib/firecrawl";
import { looksScanned } from "@/lib/knowledge-extract";
import { proposeKnowledge } from "@/lib/knowledge-ingest";
import { extractPdfText } from "@/lib/pdf-text";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";

/**
 * Turn a PDF, a link, or pasted text into proposed knowledge-graph nodes and
 * relations for review. Nothing is written to the database here.
 *
 * This is a route handler rather than a server action for two reasons: server
 * actions are capped at Next's 1 MB default body size (which is why
 * /api/upload is also a route), and doing the extraction here means the full
 * document text never crosses the wire at all — only the small proposal JSON
 * comes back.
 */
export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_PDF_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  let session;
  try {
    session = await requireStaff();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  let text = "";
  let sourceLabel = "";
  let method: "pdf" | "link" | "text" = "text";
  let batchId: string | null = null;
  let domainHint: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file was provided." }, { status: 400 });
      }
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "Only PDF files are supported." }, { status: 415 });
      }
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json(
          { error: "That PDF is too large. Split it, or paste the text instead." },
          { status: 413 },
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const extracted = await extractPdfText(bytes);
      if (looksScanned(extracted.text, extracted.pageCount)) {
        return NextResponse.json(
          {
            error:
              "This PDF has no selectable text — it looks like scanned images. Paste the text instead.",
          },
          { status: 422 },
        );
      }
      text = extracted.text;
      sourceLabel = form.get("sourceLabel")?.toString().trim() || file.name;
      method = "pdf";
    } else {
      const body = (await request.json()) as { url?: string; text?: string; sourceLabel?: string };
      if (body.url) {
        if (!hasFirecrawlKey()) {
          return NextResponse.json(
            { error: "Link scraping is not configured. Upload the PDF or paste the text." },
            { status: 503 },
          );
        }
        const scraped = await scrapeUrl(body.url);
        text = scraped.markdown;
        sourceLabel = scraped.title;
        method = "link";
      } else if (body.text?.trim()) {
        text = body.text;
        sourceLabel = body.sourceLabel?.trim() || "Pasted text";
        method = "text";
      } else {
        return NextResponse.json({ error: "Provide a file, a link, or some text." }, { status: 400 });
      }
    }
  } catch (err) {
    if (err instanceof ScrapeError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "That document could not be read. Try pasting the text instead." },
      { status: 422 },
    );
  }

  if (text.trim().length < 200) {
    return NextResponse.json(
      { error: "There was not enough readable text to work with." },
      { status: 422 },
    );
  }

  // Scope: a trainer curates their active course, the ministry curates
  // nationally. Resolved server-side; the client cannot ask for a wider scope.
  if (!isSuperAdmin) {
    const batch = await prisma.batch.findFirst({
      where: { teacherId: session.user.id, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true, subject: true },
    });
    if (!batch) {
      return NextResponse.json({ error: "You have no active course." }, { status: 400 });
    }
    batchId = batch.id;
    domainHint = batch.subject;
  }

  // Give the model the names it may link to, so it reuses existing concepts
  // instead of coining synonyms.
  const existing = await prisma.knowledgeNode.findMany({
    where: batchId ? { OR: [{ batchId: null }, { batchId }] } : { batchId: null },
    select: { name: true },
    take: 150,
  });

  const outcome = await proposeKnowledge({
    text,
    sourceLabel,
    existingNames: existing.map((n) => n.name),
    domainHint,
  });

  return NextResponse.json({
    ...outcome,
    sourceLabel,
    method,
    scope: isSuperAdmin ? "national" : "course",
  });
}
