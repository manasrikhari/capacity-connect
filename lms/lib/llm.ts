// Pure, import-safe LLM helpers. No DB/env access at import time.

export function hasLlmKey(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

/**
 * Remove ```json / ``` code fences and any surrounding prose from a model
 * response. If a '{' exists, returns the substring from the first '{' to the
 * last '}' inclusive; otherwise returns the trimmed input.
 */
export function stripJsonFences(raw: string): string {
  const withoutFences = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = withoutFences.indexOf("{");
  if (firstBrace === -1) {
    return withoutFences;
  }
  const lastBrace = withoutFences.lastIndexOf("}");
  if (lastBrace <= firstBrace) {
    return withoutFences;
  }
  return withoutFences.slice(firstBrace, lastBrace + 1);
}

/**
 * Non-streaming text completion. Lazily imports the server-side AI provider so
 * this module stays importable in tests without loading server deps.
 */
export async function completeText(args: {
  system: string;
  user: string;
  enableThinking?: boolean;
}): Promise<string> {
  const { requestAI } = await import("@/lib/ai-provider");

  const response = await requestAI({
    messages: [{ role: "user", content: args.user }],
    systemInstruction: args.system,
    enableThinking: args.enableThinking ?? false,
  });

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM response missing choices[0].message.content");
  }
  return content;
}
