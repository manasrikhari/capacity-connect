import { NextResponse } from "next/server";
import {
  ANALYST_SYSTEM,
  type AnalystAnswer,
  buildAnalystContext,
  offlineAnswer,
  parseAnalystReply,
  verifyGrounding,
} from "@/lib/analyst";
import { auth } from "@/lib/auth";
import { analystModel, groqComplete, GroqRateLimitError, hasGroqKey } from "@/lib/groq";
import { getCapacityMetrics } from "@/lib/metrics-db";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Ask a question of the national training data.
 *
 * The metrics are computed server-side and handed to the model as context; the
 * model chooses which chart answers the question and writes the interpretation.
 * It is never asked to compute anything, and the chart is rendered from the
 * same metrics rather than from its reply — so a wrong model cannot produce a
 * wrong figure, only a wrong emphasis.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  }

  const metrics = await getCapacityMetrics();
  const context = buildAnalystContext(metrics);

  // No key configured: answer deterministically from the same figures rather
  // than failing. Same house norm as lib/question-bank.ts.
  if (!hasGroqKey()) {
    return NextResponse.json({ ...offlineAnswer(question, metrics), metrics });
  }

  try {
    const raw = await groqComplete({
      system: ANALYST_SYSTEM,
      user: `FIGURES\n${context}\n\nQUESTION\n${question}`,
      model: analystModel(),
      // Reasoning models spend budget thinking before they emit content;
      // too small a cap returns an empty string rather than an answer.
      maxTokens: 1600,
    });
    const parsed = parseAnalystReply(raw);

    // Enforcement rather than trust: the system prompt forbids inventing
    // numbers, but a prompt is a request. Every figure in the prose must occur
    // in the data we supplied; anything that does not is reported to the reader.
    const { unverified } = verifyGrounding(parsed.answer, context);

    const answer: AnalystAnswer = { ...parsed, offline: false };
    return NextResponse.json({ ...answer, unverified, metrics });
  } catch (err) {
    if (err instanceof GroqRateLimitError) {
      // Degrade rather than fail: the deterministic answer uses the same data.
      return NextResponse.json({ ...offlineAnswer(question, metrics), metrics });
    }
    console.error("[analyst] failed", err);
    return NextResponse.json({ ...offlineAnswer(question, metrics), metrics });
  }
}
