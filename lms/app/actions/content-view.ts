"use server";

import { recordView } from "@/lib/course-week-db";
import { getSession } from "@/lib/session";

/**
 * Record that the signed-in trainee opened a piece of content.
 *
 * Called from the client on mount rather than during a page's render: writing
 * on a GET render is impure, and React's rules reject it (the same lint that
 * caught a clock read in the coordinator dashboard).
 */
export async function trackViewAction(
  itemType: "LIBRARY" | "NOTE",
  itemId: string,
): Promise<void> {
  const session = await getSession();
  // Only trainees have progress; a trainer previewing their own material must
  // not appear in anyone's completion figures.
  if (!session || session.user.role !== "STUDENT") return;
  await recordView(session.user.id, itemType, itemId);
}
