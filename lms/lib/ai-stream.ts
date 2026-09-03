// Reusable Server-Sent-Events plumbing for the streaming AI routes.
//
// Extracted from app/api/ai/chat/route.ts so both the classroom companion and
// the MeghDoot copilot share ONE SSE contract: unwrap the DeepSeek `data:`
// frames, surface reasoning as a <think>…</think> block, accumulate the full
// answer, optionally append a trailer (e.g. an encoded citations block), and
// hand the assembled text to a persistence callback exactly once at the end.

/** Headers for a text/event-stream response (no caching, keep the socket open). */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

/**
 * Pipe a DeepSeek/SiliconFlow OpenAI-compatible SSE upstream into a browser
 * ReadableStream. Emits `<think>…</think>\n\n` around any reasoning_content, then
 * the content deltas verbatim. Accumulates the visible answer, appends
 * `trailer()` (if provided) as the final chunk, and calls `onDone(full)` with the
 * complete text (answer + trailer) once the upstream closes.
 */
export function pipeDeepSeekSse(
  upstream: Response,
  {
    trailer,
    onDone,
  }: { trailer?: () => string; onDone: (fullText: string) => void | Promise<void> },
): ReadableStream {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = upstream.body?.getReader();
      let fullAnswer = "";
      let isThinking = false;

      // Parse a single "data: {...}" SSE line, enqueue its deltas, and grow the
      // accumulated answer. Reasoning is wrapped in a <think> block; the block is
      // closed as soon as the first real content delta arrives.
      const handleLine = (line: string) => {
        if (!line.startsWith("data: ")) return;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") return;
        try {
          const parsed = JSON.parse(jsonStr);
          const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;
          const content = parsed.choices?.[0]?.delta?.content;

          if (reasoning) {
            if (!isThinking) {
              isThinking = true;
              controller.enqueue(encoder.encode("<think>"));
            }
            controller.enqueue(encoder.encode(reasoning));
          }
          if (content) {
            if (isThinking) {
              isThinking = false;
              controller.enqueue(encoder.encode("</think>\n\n"));
            }
            fullAnswer += content;
            controller.enqueue(encoder.encode(content));
          }
        } catch {
          // Ignore partial / malformed JSON frames.
        }
      };

      if (!reader) {
        // No body — persist whatever we have (likely empty) and close.
        try {
          const tail = trailer ? trailer() : "";
          if (tail) controller.enqueue(encoder.encode(tail));
          await onDone(fullAnswer + tail);
        } finally {
          controller.close();
        }
        return;
      }

      let buffer = "";
      let done = false;
      try {
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // keep the last partial line
            for (const line of lines) handleLine(line);
          }
        }

        // Flush any trailing buffered frame.
        if (buffer) handleLine(buffer);

        // Close a dangling <think> block if content never arrived.
        if (isThinking) {
          controller.enqueue(encoder.encode("</think>"));
        }

        const tail = trailer ? trailer() : "";
        if (tail) controller.enqueue(encoder.encode(tail));

        await onDone(fullAnswer + tail);
      } catch (streamErr) {
        controller.error(streamErr);
      } finally {
        controller.close();
      }
    },
  });
}

/**
 * Enqueue a whole pre-computed string as a single SSE payload, then persist it.
 * Used by the no-LLM offline path (fallback graph answer + citations trailer).
 */
export function textToStream(
  text: string,
  onDone: (t: string) => void | Promise<void>,
): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encoder.encode(text));
        await onDone(text);
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}
