import "server-only";
import { prisma } from "@/lib/prisma";

export type ThreadSummary = {
  id: string;
  title: string;
  authorName: string;
  authorIsStaff: boolean;
  weekLabel: string | null;
  replies: number;
  isPinned: boolean;
  isResolved: boolean;
  lastActivity: Date;
  createdAt: Date;
};

export type ThreadDetail = {
  id: string;
  batchId: string;
  title: string;
  body: string;
  authorName: string;
  authorIsStaff: boolean;
  weekLabel: string | null;
  isPinned: boolean;
  isResolved: boolean;
  createdAt: Date;
  posts: {
    id: string;
    body: string;
    authorName: string;
    authorIsStaff: boolean;
    isAnswer: boolean;
    createdAt: Date;
  }[];
};

/**
 * Threads for a course, pinned first, then most recently active.
 *
 * "Recently active" means the newest reply rather than the thread's own
 * creation date — a question asked last week that someone answered this
 * morning belongs at the top, which is the whole point of a forum.
 */
export async function listThreads(batchId: string): Promise<ThreadSummary[]> {
  const [batch, threads] = await Promise.all([
    prisma.batch.findUnique({ where: { id: batchId }, select: { teacherId: true } }),
    prisma.discussionThread.findMany({
    where: { batchId },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      isPinned: true,
      isResolved: true,
      createdAt: true,
      author: { select: { id: true, name: true, role: true } },
      week: { select: { index: true, title: true } },
      posts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      _count: { select: { posts: true } },
    },
    }),
  ]);

  const teacherId = batch?.teacherId ?? "";

  return threads
    .map((t) => ({
      id: t.id,
      title: t.title,
      authorName: t.author.name ?? "Member",
      authorIsStaff: t.author.role !== "STUDENT" || t.author.id === teacherId,
      weekLabel: t.week ? `Week ${t.week.index}` : null,
      replies: t._count.posts,
      isPinned: t.isPinned,
      isResolved: t.isResolved,
      lastActivity: t.posts[0]?.createdAt ?? t.createdAt,
      createdAt: t.createdAt,
    }))
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });
}

export async function getThread(threadId: string): Promise<ThreadDetail | null> {
  const t = await prisma.discussionThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      batchId: true,
      title: true,
      body: true,
      isPinned: true,
      isResolved: true,
      createdAt: true,
      batch: { select: { teacherId: true } },
      author: { select: { id: true, name: true, role: true } },
      week: { select: { index: true, title: true } },
      posts: {
        orderBy: [{ isAnswer: "desc" }, { createdAt: "asc" }],
        select: {
          id: true,
          body: true,
          isAnswer: true,
          createdAt: true,
          author: { select: { id: true, name: true, role: true } },
        },
      },
    },
  });
  if (!t) return null;

  const teacherId = t.batch.teacherId;
  const isStaff = (u: { id: string; role: string }) => u.role !== "STUDENT" || u.id === teacherId;

  return {
    id: t.id,
    batchId: t.batchId,
    title: t.title,
    body: t.body,
    authorName: t.author.name ?? "Member",
    authorIsStaff: isStaff(t.author),
    weekLabel: t.week ? `Week ${t.week.index} · ${t.week.title}` : null,
    isPinned: t.isPinned,
    isResolved: t.isResolved,
    createdAt: t.createdAt,
    posts: t.posts.map((p) => ({
      id: p.id,
      body: p.body,
      authorName: p.author.name ?? "Member",
      authorIsStaff: isStaff(p.author),
      isAnswer: p.isAnswer,
      createdAt: p.createdAt,
    })),
  };
}

/** Weeks a thread can be filed under, for the "ask" form. */
export async function weekOptions(batchId: string) {
  return prisma.courseWeek.findMany({
    where: { batchId },
    orderBy: { index: "asc" },
    select: { id: true, index: true, title: true },
  });
}
