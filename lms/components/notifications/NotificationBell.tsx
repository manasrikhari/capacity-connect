import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { NotificationBellClient, type NotificationView } from "./NotificationBellClient";

/**
 * Server component: reads the signed-in user's notifications directly (works with
 * no external service) and hands them to the client bell. Rendered in the app
 * shell for all three roles.
 */
export async function NotificationBell() {
  const session = await getSession();
  if (!session) return null;

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);

  const views: NotificationView[] = items.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    read: n.readAt != null,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NotificationBellClient items={views} unread={unread} />;
}
