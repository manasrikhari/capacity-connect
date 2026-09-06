/**
 * Turn a class transcript into meeting minutes (Phase 4, the `/summary` half of
 * the pipeline). Graceful degradation is the house style: with a Groq key we
 * ask a model for structured minutes; without one — or if the call fails — we
 * fall back to a deterministic extractive summary so the trainer still gets
 * usable notes rather than an error.
 *
 * The pure helpers (clampTranscript, extractiveMinutes, buildMinutesSystemPrompt)
 * carry no server-only dependency so they can be unit-tested directly; the Groq
 * client is imported lazily inside generateMinutes, which only runs server-side.
 */

const MAX_TRANSCRIPT_CHARS = 24_000; // keep the prompt within a sane token budget

export function buildMinutesSystemPrompt(): string {
  return [
    "You are a meteorology training assistant writing the official minutes of a live class.",
    "Given a raw transcript, produce concise, faithful minutes in Markdown with these sections:",
    "## Summary (2-3 sentences), ## Key points (bullets), ## Decisions & action items (bullets, omit if none), ## Follow-up questions (bullets, omit if none).",
    "Never invent facts or figures that are not in the transcript. If the transcript is too thin to summarise, say so plainly.",
  ].join(" ");
}

/** Trim an over-long transcript from the middle, keeping the open and close. */
export function clampTranscript(transcript: string, max = MAX_TRANSCRIPT_CHARS): string {
  const t = transcript.trim();
  if (t.length <= max) return t;
  const head = Math.floor(max * 0.6);
  const tail = max - head;
  return `${t.slice(0, head)}\n\n…[transcript trimmed]…\n\n${t.slice(t.length - tail)}`;
}

/**
 * Deterministic fallback: pick the longest, most substantive lines as a bullet
 * digest. No model, no network — always available.
 */
export function extractiveMinutes(transcript: string): string {
  const sentences = transcript
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 40);

  const ranked = [...new Set(sentences)]
    .sort((a, b) => b.length - a.length)
    .slice(0, 8)
    .sort((a, b) => transcript.indexOf(a) - transcript.indexOf(b));

  if (ranked.length === 0) {
    return "## Summary\n\nThe transcript was too short to summarise automatically.";
  }
  const bullets = ranked.map((s) => `- ${s}`).join("\n");
  return `## Summary\n\nAuto-generated digest of the class transcript.\n\n## Key points\n\n${bullets}`;
}

/** Generate minutes from a transcript, using Groq when available. Never throws. */
export async function generateMinutes(transcript: string): Promise<string> {
  const clean = transcript.trim();
  if (!clean) return "## Summary\n\nNo transcript was captured for this class.";

  const { groqComplete, hasGroqKey } = await import("@/lib/groq");
  if (!hasGroqKey()) return extractiveMinutes(clean);

  try {
    const content = await groqComplete({
      system: buildMinutesSystemPrompt(),
      user: clampTranscript(clean),
      maxTokens: 1200,
    });
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : extractiveMinutes(clean);
  } catch (err) {
    console.error("[minutes] generation failed, using extractive fallback", err);
    return extractiveMinutes(clean);
  }
}
