import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requestAI } from "@/lib/ai-provider";
import { getKnowledgeContext } from "@/lib/graphrag-db";
import { renderFallbackAnswer, encodeCitations, splitCitations } from "@/lib/graphrag";
import { hasLlmKey } from "@/lib/llm";
import { meghdootSystemPrompt } from "@/lib/meghdoot-prompt";
import { SSE_HEADERS, pipeDeepSeekSse, textToStream } from "@/lib/ai-stream";

export const runtime = "nodejs";

// Hard cap on graph traversal depth, per the GraphRAG contract.
const MAX_HOPS = 2;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, enableThinking } = body;
    // Accept either `message` (the classroom JSON-payload convention) or `text`.
    const rawMessage: string | undefined = body.message ?? body.text;
    if (!conversationId || !rawMessage) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. Verify ownership of the conversation thread.
    const conv = await prisma.aiConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || conv.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = conv.batchId;

    // 1b. Verify the caller may use this batch: its teacher, or an APPROVED
    // enrollment. (Mirrors app/api/ai/chat/route.ts.)
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      select: { teacherId: true },
    });
    let hasBatchAccess = batch?.teacherId === session.user.id;
    if (batch && !hasBatchAccess) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_batchId: { studentId: session.user.id, batchId } },
        select: { status: true },
      });
      hasBatchAccess = enrollment?.status === "APPROVED";
    }
    if (!hasBatchAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Extract the plain query text (payload may be a JSON envelope like chat).
    let queryText = rawMessage;
    try {
      if (typeof rawMessage === "string" && rawMessage.startsWith("{")) {
        const parsed = JSON.parse(rawMessage);
        if (typeof parsed.text === "string") queryText = parsed.text;
      }
    } catch {
      // fall back to the raw message
    }

    // 2. GraphRAG retrieval (hard-cap maxHops ≤ 3; we use 2).
    const kg = await getKnowledgeContext(queryText, {
      maxHops: Math.min(MAX_HOPS, 3),
      maxPaths: 12,
    });

    // 3. Build history from prior messages; strip citation sentinels from prior
    // model replies so the model never sees the encoded block.
    const history = await prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const messages = history.map((m) => {
      if (m.role === "user") {
        let text = m.content;
        try {
          if (m.content.startsWith("{")) {
            const parsed = JSON.parse(m.content);
            if (typeof parsed.text === "string") text = parsed.text;
          }
        } catch {
          /* keep raw */
        }
        return { role: "user" as const, content: text };
      }
      const { text } = splitCitations(m.content);
      return { role: "assistant" as const, content: text };
    });

    // Append the current query if it is not already the last stored user turn.
    const lastMsg = history[history.length - 1];
    const isLastMsgSame =
      lastMsg && lastMsg.role === "user" && lastMsg.content === rawMessage;
    if (!isLastMsgSame) {
      messages.push({ role: "user", content: queryText });
    }

    // Persistence: save the user turn (if new) and the model reply, then touch
    // the conversation. Mirrors the chat route's post-stream write.
    const persist = async (fullText: string) => {
      try {
        const shouldSaveUserMsg = !history.some(
          (m) => m.role === "user" && m.content === rawMessage,
        );
        if (shouldSaveUserMsg) {
          await prisma.aiMessage.create({
            data: { conversationId, role: "user", content: rawMessage },
          });
        }
        await prisma.aiMessage.create({
          data: { conversationId, role: "model", content: fullText },
        });
        await prisma.aiConversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      } catch (persistErr) {
        console.error("[MeghDoot API] Persistence error:", persistErr);
      }
    };

    const graphHeader = { "X-Graph-Took-Ms": String(kg.tookMs) };

    // 4. Offline path — no model configured: stream the grounded graph answer.
    if (!hasLlmKey()) {
      const offline =
        renderFallbackAnswer(queryText, kg.paths, kg.citations) +
        encodeCitations(kg.citations);
      return new Response(textToStream(offline, persist), {
        headers: { ...SSE_HEADERS, ...graphHeader },
      });
    }

    // 5. LLM path — ground the model with the graph context and stream it.
    try {
      const upstream = await requestAI(
        {
          messages,
          systemInstruction: meghdootSystemPrompt(kg.contextText),
          enableThinking: enableThinking !== undefined ? enableThinking : true,
        },
        { stream: true },
      );

      if (!upstream.ok) {
        throw new Error(`Upstream AI returned ${upstream.status}`);
      }

      const stream = pipeDeepSeekSse(upstream, {
        trailer: () => encodeCitations(kg.citations),
        onDone: persist,
      });

      return new Response(stream, {
        headers: { ...SSE_HEADERS, ...graphHeader },
      });
    } catch (llmErr: any) {
      console.error("[MeghDoot API] LLM call failed, using offline graph answer:", llmErr?.message);
      const offline =
        renderFallbackAnswer(queryText, kg.paths, kg.citations) +
        encodeCitations(kg.citations);
      return new Response(textToStream(offline, persist), {
        headers: { ...SSE_HEADERS, ...graphHeader },
      });
    }
  } catch (err: any) {
    console.error("[MeghDoot Route] Internal error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
