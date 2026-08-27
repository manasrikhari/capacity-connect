import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requestAI } from "@/lib/ai-provider";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, message, enableThinking } = await req.json();
    if (!conversationId || !message) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // 1. Verify ownership of the conversation thread
    const conv = await prisma.aiConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv || conv.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = conv.batchId;

    // Parse JSON message payload (Option A)
    let queryText = message;
    let attachments: any[] = [];
    let attachedImages: string[] = [];

    try {
      if (message.startsWith("{")) {
        const parsed = JSON.parse(message);
        queryText = typeof parsed.text === "string" ? parsed.text : message;
        attachments = parsed.attachments || [];
        attachedImages = parsed.images || (parsed.image ? [parsed.image] : []);
      }
    } catch (e) {}

    // 2. Fetch classroom context for the Gemini instruction prompt
    // A. Fetch Notes
    const notes = await prisma.note.findMany({
      where: { batchId },
      select: { title: true, subject: true, content: true },
    });
    const notesStr = notes
      .map((n) => `[Note Subject: ${n.subject}] Title: ${n.title}\nContent: ${n.content}`)
      .join("\n\n");

    // B. Fetch past Live Session Summaries (Minutes of Meeting)
    const sessions = await prisma.liveSession.findMany({
      where: { batchId },
      include: { meetingMinutes: true },
    });
    const summariesStr = sessions
      .map((s) => s.meetingMinutes?.content)
      .filter(Boolean)
      .join("\n\n");

    // C. Fetch user's own solved doubts in this batch
    const doubts = await prisma.doubt.findMany({
      where: {
        sessionId: { in: sessions.map((s) => s.roomId) },
        studentId: session.user.id,
      },
      select: { doubtText: true, answer: true },
    });
    const doubtsStr = doubts
      .map((d) => `Q: ${d.doubtText}\nA: ${d.answer}`)
      .join("\n\n");

    // D. Fetch past message history in this conversation thread
    const history = await prisma.aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Fetch details of specifically attached contexts
    let attachedContextStr = "";
    if (attachments.length > 0) {
      attachedContextStr = "\n\nDIRECT REFERENCES ATTACHED BY USER FOR THIS QUERY (Prioritize these documents):\n";
      for (const att of attachments) {
        if (att.type === "notes" || att.type === "note") {
          const noteObj = await prisma.note.findUnique({
            where: { id: att.id },
            select: { title: true, content: true, subject: true },
          });
          if (noteObj) {
            attachedContextStr += `[Attached Note: ${noteObj.title} (${noteObj.subject})]\n${noteObj.content}\n\n`;
          }
        } else if (att.type === "doubts" || att.type === "doubt") {
          const doubtObj = await prisma.doubt.findUnique({
            where: { id: att.id },
            select: { doubtText: true, answer: true },
          });
          if (doubtObj) {
            attachedContextStr += `[Attached Past Class Doubt]\nQuestion: ${doubtObj.doubtText}\nAnswer: ${doubtObj.answer}\n\n`;
          }
        } else if (att.type === "summaries" || att.type === "summary") {
          const minutesObj = await prisma.meetingMinutes.findUnique({
            where: { sessionId: att.id },
            select: { content: true },
          });
          if (minutesObj) {
            attachedContextStr += `[Attached Meeting Minutes Summary]\n${minutesObj.content}\n\n`;
          }
        }
      }
    }
    
    // Determine if the last message in DB history is already the current user query
    const lastMsg = history[history.length - 1];
    const isLastMsgSame = lastMsg && lastMsg.role === "user" && lastMsg.content === message;

    // Format message history for Gemini API contents parameter
    const contents = history.map((m) => {
      let contentText = m.content;
      try {
        if (m.role === "user" && m.content.startsWith("{")) {
          const parsed = JSON.parse(m.content);
          contentText = typeof parsed.text === "string" ? parsed.text : m.content;
        }
      } catch (e) {}

      return {
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: contentText }],
      };
    });
    
    // Append the user's latest query text if not already present in history
    if (!isLastMsgSame) {
      contents.push({
        role: "user",
        parts: [{ text: queryText }],
      });
    }

    // If there are images attached, convert and push to Gemini parts
    if (attachedImages && attachedImages.length > 0) {
      for (const attachedImage of attachedImages) {
        if (attachedImage.startsWith("data:")) {
          const commaIndex = attachedImage.indexOf(",");
          if (commaIndex !== -1) {
            const meta = attachedImage.substring(0, commaIndex);
            const mimeMatch = meta.match(/data:(.*?);/);
            const base64Data = attachedImage.substring(commaIndex + 1);
            if (mimeMatch && base64Data) {
              contents[contents.length - 1].parts.push({
                inlineData: {
                  mimeType: mimeMatch[1],
                  data: base64Data,
                },
              } as any);
            }
          }
        } else if (attachedImage.startsWith("http://") || attachedImage.startsWith("https://")) {
          try {
            const imgRes = await fetch(attachedImage);
            if (imgRes.ok) {
              const arrayBuffer = await imgRes.arrayBuffer();
              const base64Data = Buffer.from(arrayBuffer).toString("base64");
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";
              contents[contents.length - 1].parts.push({
                inlineData: {
                  mimeType: contentType,
                  data: base64Data,
                },
              } as any);
            } else {
              console.warn(`[AI Chat Route] Failed to fetch image from R2: Status ${imgRes.status}`);
            }
          } catch (fetchErr: any) {
            console.error("[AI Chat Route] Error fetching image from R2 URL:", fetchErr.message);
          }
        }
      }
    }

    // 3. Construct Unified System Prompt
    const systemInstruction = `You are "OpenGrapes AI", a premium, helpful, and encouraging AI study companion and academic mentor for a student in this classroom batch.
Your role is to guide and teach concepts, explain topics, and clear doubts.

CLASSROOM CONTEXT:
Use the following classroom materials to personalize and ground your answers:
---
[CLASSROOM NOTES]
${notesStr || "No notes uploaded by the teacher yet."}
---
[LIVE SESSION MINUTES & SUMMARIES]
${summariesStr || "No live sessions summarized yet."}
---
[STUDENT'S PAST SOLVED DOUBTS]
${doubtsStr || "No past resolved doubts in this batch."}
---${attachedContextStr}

INSTRUCTIONS:
1. Ground your answers using the classroom context (notes, summaries, past doubts) whenever possible to remain consistent with what the teacher is teaching.
2. If direct user attachments are provided above, focus heavily on them when answering.
3. If the user asks something not directly present in the context, synthesize the answer using your general knowledge, but prioritize the classroom content.
4. Be encouraging, clear, and structured. Use **bold** for key terms and bullet points for lists.
5. FORMAT MATH & BOXED ANSWERS: Format all equations, formulas, math symbols, variables, and expressions in standard LaTeX format. Use $...$ for inline math (e.g., $e = mc^2$) and $$...$$ for display/block equations. If you highlight a final numerical or variable answer, ALWAYS wrap it in \\boxed{...} inside $ or $$, e.g., $\\boxed{13}$ or $$\\boxed{x = \\frac{-b \\pm \\sqrt{d}}{2a}}$$. NEVER output raw \\boxed without $ or $$ wrappers.
6. FORMAT CHEMISTRY: Always wrap chemical formulas and equations in LaTeX math mode using \\ce{...} with curly braces inside $ or $$, e.g., $\\ce{2H2 + O2 -> 2H2O}$ or $\\ce{H2SO4}$. NEVER output raw \\ce without braces, and NEVER output raw \\ce without $ or $$ delimiters.
7. Avoid writing raw math or chemical symbols as plain text without $ or $$ wrappers.`;

    let response;
    try {
      response = await requestAI({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        enableThinking: enableThinking !== undefined ? enableThinking : true
      }, { stream: true });
    } catch (err: any) {
      console.error("[AI Chat API] AI call failed:", err.message);
      return NextResponse.json({ error: "Failed to connect to AI engine" }, { status: 502 });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AI Chat API] AI returned error:", errText);
      return NextResponse.json({ error: "Failed to connect to AI engine" }, { status: 502 });
    }

    // Return a Response Stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let buffer = "";
        let fullAnswer = "";
        let isThinking = false;

        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
              buffer += decoder.decode(value, { stream: !done });
              const lines = buffer.split("\n");
              // Keep the last partial line in buffer
              buffer = lines.pop() || "";

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const jsonStr = line.slice(6).trim();
                    if (jsonStr === "[DONE]") continue;
                    const parsed = JSON.parse(jsonStr);
                    const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;
                    const content = parsed.choices?.[0]?.delta?.content;

                    if (reasoning) {
                      if (!isThinking) {
                        isThinking = true;
                        controller.enqueue(new TextEncoder().encode("<think>"));
                      }
                      controller.enqueue(new TextEncoder().encode(reasoning));
                    }
                    if (content) {
                      if (isThinking) {
                        isThinking = false;
                        controller.enqueue(new TextEncoder().encode("</think>\n\n"));
                      }
                      fullAnswer += content;
                      controller.enqueue(new TextEncoder().encode(content));
                    }
                  } catch (parseErr) {
                    // Ignore partial JSON parsing errors
                  }
                }
              }
            }
          }

          // Handle final buffer content if any
          if (buffer.startsWith("data: ")) {
            try {
              const jsonStr = buffer.slice(6).trim();
              const parsed = JSON.parse(jsonStr);
              const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;
              const content = parsed.choices?.[0]?.delta?.content;

              if (reasoning) {
                if (!isThinking) {
                  isThinking = true;
                  controller.enqueue(new TextEncoder().encode("<think>"));
                }
                controller.enqueue(new TextEncoder().encode(reasoning));
              }
              if (content) {
                if (isThinking) {
                  isThinking = false;
                  controller.enqueue(new TextEncoder().encode("</think>\n\n"));
                }
                fullAnswer += content;
                controller.enqueue(new TextEncoder().encode(content));
              }
            } catch (e) {}
          }

          if (isThinking) {
            controller.enqueue(new TextEncoder().encode("</think>"));
          }

          // 4. Stream finished. Save the user query and the full model answer to database
          // Check if user query was already saved (to avoid duplicates for the first message)
          const shouldSaveUserMsg = !history.some((m) => m.role === "user" && m.content === message);

          if (shouldSaveUserMsg) {
            await prisma.aiMessage.create({
              data: {
                conversationId,
                role: "user",
                content: message,
              },
            });
          }

          // Save the assistant's response
          await prisma.aiMessage.create({
            data: {
              conversationId,
              role: "model",
              content: fullAnswer,
            },
          });

          // Touch conversation's updatedAt to reflect active time
          await prisma.aiConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

        } catch (streamErr) {
          console.error("[AI Chat API] Stream reading error:", streamErr);
          controller.error(streamErr);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });

  } catch (err: any) {
    console.error("[AI Chat Route] Internal error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
