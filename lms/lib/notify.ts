import "server-only";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

/**
 * Create an in-app notification (the bell reads these directly, so this works
 * with no external service) and, best-effort, mirror it to email. Never throws:
 * a failed notification must not break the action that triggered it.
 */
export async function notify(input: {
  userId: string;
  kind: string;
  title: string;
  body?: string;
  href?: string;
  /** Set false to skip the email mirror (in-app only). */
  email?: boolean;
}): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
      },
    });
  } catch (err) {
    console.error("[notify] failed to create notification", input.kind, err);
    return;
  }

  if (input.email === false) return;
  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true },
    });
    if (user?.email) {
      await sendMail({
        to: user.email,
        subject: input.title,
        text: `${input.body ?? input.title}${input.href ? `\n\n${absoluteUrl(input.href)}` : ""}`,
      });
    }
  } catch (err) {
    console.error("[notify] email mirror failed", err);
  }
}

/** Notify many users with the same payload (e.g. all SPOCs). */
export async function notifyMany(
  userIds: string[],
  payload: Omit<Parameters<typeof notify>[0], "userId">,
): Promise<void> {
  await Promise.all(userIds.map((userId) => notify({ ...payload, userId })));
}

function absoluteUrl(path: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return path.startsWith("http") ? path : `${base.replace(/\/$/, "")}${path}`;
}
