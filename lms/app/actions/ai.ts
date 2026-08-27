"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { requestAI } from "@/lib/ai-provider";

/**
 * Fetch all AI conversations for a user in a specific batch
 */
export async function getConversationsAction(batchId: string) {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in first.");
  }

  return prisma.aiConversation.findMany({
    where: {
      userId: session.user.id,
      batchId: batchId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

/**
 * Create a new AI conversation and insert the first user message
 */
export async function createConversationAction(batchId: string, firstMessage: string) {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in first.");
  }

  // Extract text query if firstMessage is JSON
  let queryText = firstMessage;
  try {
    if (firstMessage.startsWith("{")) {
      const parsed = JSON.parse(firstMessage);
      queryText = typeof parsed.text === "string" ? parsed.text : firstMessage;
    }
  } catch (e) {}

  // Generate a short 3-4 word title using unified AI provider (will route to DeepSeek text-only)
  let title = "New Chat";
  try {
    const res = await requestAI({
      contents: [
        {
          parts: [
            {
              text: `Summarize the following student/teacher query into a short, descriptive 3 to 4 word title for a chat sidebar. Return ONLY the title text, with no quotes, no markdown, and no extra text. Query: "${queryText || "Image Attachment"}"`,
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 10,
      },
    });

    if (res.ok) {
      const data = await res.json() as any;
      const cleanText = data.choices?.[0]?.message?.content?.trim();
      if (cleanText) {
        title = cleanText.replace(/['"]+/g, ""); // strip quotes
      }
    }
  } catch (e) {
    console.error("[AI Action] Failed to generate chat title:", e);
  }

  // Create the conversation and insert the user's first message
  const conversation = await prisma.aiConversation.create({
    data: {
      userId: session.user.id,
      batchId: batchId,
      title: title,
      messages: {
        create: {
          role: "user",
          content: firstMessage,
        },
      },
    },
  });

  return conversation.id;
}

/**
 * Retrieve all messages for a specific conversation
 */
export async function getMessagesAction(conversationId: string) {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in first.");
  }

  const conv = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conv) {
    throw new Error("Conversation not found.");
  }

  if (conv.userId !== session.user.id) {
    throw new Error("Unauthorized access to this conversation.");
  }

  return conv.messages;
}

/**
 * Delete a conversation
 */
export async function deleteConversationAction(conversationId: string) {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error("Unauthorized: Please log in first.");
  }

  const conv = await prisma.aiConversation.findUnique({
    where: { id: conversationId },
  });

  if (!conv) {
    throw new Error("Conversation not found.");
  }

  if (conv.userId !== session.user.id) {
    throw new Error("Unauthorized deletion request.");
  }

  await prisma.aiConversation.delete({
    where: { id: conversationId },
  });

  return { success: true };
}
