import "server-only";

/**
 * A thin OpenAI-compatible client for Groq, used by knowledge ingestion.
 *
 * Why not `requestAI` from `lib/ai-provider.ts`:
 *  1. It always sets `enable_thinking` (and `reasoning_effort` when on), which
 *     Groq rejects as an unknown parameter on several models.
 *  2. It collapses failures into `new Error("... (status): body")`, discarding
 *     the status code. A 429 IS the tokens-per-minute limit we have to detect
 *     and back off from, and it cannot be recovered from a string.
 *
 * `requestAI` is left untouched and keeps serving MeghDoot chat.
 */

const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
/** 70K TPM on the free tier; leave headroom for the response. */
const DEFAULT_TPM_BUDGET = 60_000;

export class GroqRateLimitError extends Error {
  constructor(public readonly retryAfterMs: number) {
    super("Groq rate limit reached");
    this.name = "GroqRateLimitError";
  }
}

export class GroqError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "GroqError";
  }
}

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

function baseUrl(): string {
  return (process.env.GROQ_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function extractionModel(): string {
  // compound-mini carries 70K TPM against gpt-oss-120b's 8K, which is what
  // makes multi-chunk documents finish in one minute instead of three.
  return process.env.GROQ_EXTRACTION_MODEL || "groq/compound-mini";
}

/**
 * Model for reasoning tasks — reading national figures and recommending what to
 * commission.
 *
 * Deliberately separate from the extraction model. Extraction pulls concepts
 * out of a document and runs against a tight tokens-per-minute budget, so a
 * small fast model is right; analysis has to weigh several series against each
 * other and justify a recommendation, which a small model does poorly.
 *
 * Note for callers: reasoning models spend part of the completion budget on
 * their own reasoning before emitting content, so `maxTokens` must be generous
 * or the reply comes back empty.
 */
export function analystModel(): string {
  return process.env.GROQ_ANALYST_MODEL || "openai/gpt-oss-120b";
}

/** Rough but adequate: ~4 characters per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ── Rolling one-minute token budget ────────────────────────────────────────
// Module-level, so it is per server process. Calls are made sequentially by
// design; parallelising them is what trips a TPM limit in the first place.
let spend: { at: number; tokens: number }[] = [];

function spentInLastMinute(): number {
  const cutoff = Date.now() - 60_000;
  spend = spend.filter((s) => s.at > cutoff);
  return spend.reduce((sum, s) => sum + s.tokens, 0);
}

async function waitForBudget(estimate: number): Promise<void> {
  const budget = Number(process.env.GROQ_TPM_BUDGET ?? DEFAULT_TPM_BUDGET);
  const spent = spentInLastMinute();
  if (spent + estimate <= budget || spend.length === 0) return;
  // Sleep until the oldest recorded spend falls out of the window.
  const oldest = spend[0]!.at;
  const waitMs = Math.max(0, oldest + 60_000 - Date.now()) + 250;
  await new Promise((r) => setTimeout(r, waitMs));
}

/**
 * One non-streaming completion. Throws {@link GroqRateLimitError} on 429 so
 * the caller can back off, and {@link GroqError} with the real status
 * otherwise.
 */
export async function groqComplete(args: {
  system: string;
  user: string;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new GroqError(0, "GROQ_API_KEY is not set");

  const maxTokens = args.maxTokens ?? 2000;
  const estimate = estimateTokens(args.system) + estimateTokens(args.user) + maxTokens;
  await waitForBudget(estimate);

  const res = await fetch(`${baseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: args.model ?? extractionModel(),
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
      // Nudge toward parseable output. Harmless on models that ignore it.
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get("retry-after") ?? "5");
    throw new GroqRateLimitError(Number.isFinite(retryAfter) ? retryAfter * 1000 : 5000);
  }
  if (!res.ok) {
    throw new GroqError(res.status, (await res.text()).slice(0, 500));
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: { total_tokens?: number };
  };
  spend.push({ at: Date.now(), tokens: data.usage?.total_tokens ?? estimate });

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new GroqError(res.status, "Groq returned no content");
  return content;
}
