"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { notify } from "@/lib/notify";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { optionalFormId } from "@/lib/validations/form";

const threadSchema = z.object({
  batchId: z.string().min(1),
  // The week picker is only rendered on a course that has weeks, so this must
  // tolerate a missing control — see lib/validations/form.ts.
  weekId: optionalFormId(),
  title: z.string().min(4, "Give the question a title").max(200),
  body: z.string().min(1, "Say a little more").max(8000),
});

const postSchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1, "Write a reply").max(8000),
});

/**
 * Who may read and write in a course's forum: the trainer who owns it, any
 * approved trainee, and platform staff. Returns null when the caller has no
 * business in this course at all.
 */
async function forumAccess(batchId: string) {
  const session = await getSession();
  if (!session) return null;

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { id: true, teacherId: true, name: true },
  });
  if (!batch) return null;

  if (session.user.role === "SUPER_ADMIN") {
    return { session, batch, isStaff: true };
  }
  if (batch.teacherId === session.user.id) {
    return { session, batch, isStaff: true };
  }

  const enrolment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: session.user.id, batchId } },
    select: { status: true },
  });
  if (enrolment?.status !== "APPROVED") return null;

  return { session, batch, isStaff: false };
}

export async function createThreadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = threadSchema.safeParse({
    batchId: formData.get("batchId"),
    weekId: formData.get("weekId"),
    title: formData.get("title"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const access = await forumAccess(parsed.data.batchId);
  if (!access) return { error: "You do not have access to this course's forum." };

  const thread = await prisma.discussionThread.create({
    data: {
      batchId: parsed.data.batchId,
      weekId: parsed.data.weekId,
      authorId: access.session.user.id,
      title: parsed.data.title,
      body: parsed.data.body,
    },
    select: { id: true },
  });

  // The trainer is the one expected to answer, so tell them rather than hoping
  // they refresh the forum.
  if (!access.isStaff) {
    await notify({
      userId: access.batch.teacherId,
      kind: "discussion.thread",
      title: `New question in ${access.batch.name}`,
      body: parsed.data.title,
      href: `/admin/discussion/${thread.id}`,
      email: false,
    });
  }

  revalidatePath("/student/discussion");
  revalidatePath("/admin/discussion");
  return { success: true };
}

export async function replyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = postSchema.safeParse({
    threadId: formData.get("threadId"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const thread = await prisma.discussionThread.findUnique({
    where: { id: parsed.data.threadId },
    select: { id: true, batchId: true, authorId: true, title: true },
  });
  if (!thread) return { error: "That thread no longer exists." };

  const access = await forumAccess(thread.batchId);
  if (!access) return { error: "You do not have access to this course's forum." };

  await prisma.discussionPost.create({
    data: {
      threadId: thread.id,
      authorId: access.session.user.id,
      body: parsed.data.body,
    },
  });

  if (thread.authorId !== access.session.user.id) {
    await notify({
      userId: thread.authorId,
      kind: "discussion.reply",
      title: `New reply: ${thread.title}`,
      href: `/student/discussion/${thread.id}`,
      email: false,
    });
  }

  revalidatePath(`/student/discussion/${thread.id}`);
  revalidatePath(`/admin/discussion/${thread.id}`);
  return { success: true };
}

/**
 * Mark a reply as the accepted answer — the way SWAYAM's forum resolves a doubt
 * rather than leaving the thread to trail off. Trainer-only, and exactly one
 * answer per thread.
 */
export async function markAnswerAction(postId: string): Promise<{ error?: string }> {
  const post = await prisma.discussionPost.findUnique({
    where: { id: postId },
    select: { id: true, threadId: true, thread: { select: { batchId: true } } },
  });
  if (!post) return { error: "That reply no longer exists." };

  const access = await forumAccess(post.thread.batchId);
  if (!access?.isStaff) return { error: "Only the trainer can mark an answer." };

  await prisma.$transaction([
    prisma.discussionPost.updateMany({
      where: { threadId: post.threadId },
      data: { isAnswer: false },
    }),
    prisma.discussionPost.update({ where: { id: post.id }, data: { isAnswer: true } }),
    prisma.discussionThread.update({
      where: { id: post.threadId },
      data: { isResolved: true },
    }),
  ]);

  revalidatePath(`/student/discussion/${post.threadId}`);
  revalidatePath(`/admin/discussion/${post.threadId}`);
  return {};
}

/** Pin or unpin a thread. Trainer-only. */
export async function togglePinAction(threadId: string): Promise<{ error?: string }> {
  const thread = await prisma.discussionThread.findUnique({
    where: { id: threadId },
    select: { batchId: true, isPinned: true },
  });
  if (!thread) return { error: "That thread no longer exists." };

  const access = await forumAccess(thread.batchId);
  if (!access?.isStaff) return { error: "Only the trainer can pin a thread." };

  await prisma.discussionThread.update({
    where: { id: threadId },
    data: { isPinned: !thread.isPinned },
  });

  revalidatePath("/student/discussion");
  revalidatePath("/admin/discussion");
  return {};
}
