"use client";

import { useEffect, useRef } from "react";
import { trackViewAction } from "@/app/actions/content-view";

/**
 * Marks a piece of content as viewed, once, on mount.
 *
 * Renders nothing. Failures are deliberately silent — a trainee reading a note
 * must never see an error because a progress row could not be written.
 */
export function TrackView({
  itemType,
  itemId,
}: {
  itemType: "LIBRARY" | "NOTE";
  itemId: string;
}) {
  const sent = useRef(false);

  useEffect(() => {
    // React 18+ mounts twice in development; the ref keeps that to one write.
    if (sent.current) return;
    sent.current = true;
    void trackViewAction(itemType, itemId).catch(() => {});
  }, [itemType, itemId]);

  return null;
}
