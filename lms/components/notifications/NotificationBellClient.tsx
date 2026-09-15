"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";

export type NotificationView = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string; // ISO
};

/** Preferred panel width; shrinks on viewports too narrow to hold it. */
const PANEL_WIDTH = 320;
/** Breathing room kept between the panel and every viewport edge. */
const EDGE_GAP = 8;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

type PanelBox = { top: number; left: number; width: number; maxHeight: number };

export function NotificationBellClient({
  items,
  unread,
}: {
  items: NotificationView[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState<PanelBox | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // The bell renders both in the 256px-wide desktop sidebar (a clipping
  // `overflow-y-auto` box) and in the mobile header (a `backdrop-blur` element,
  // which is a containing block for fixed children). Neither can hold the panel,
  // so it portals to <body> and is placed against the viewport by hand.
  const place = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - EDGE_GAP * 2);
    const top = rect.bottom + EDGE_GAP;
    setBox({
      top,
      // Right-align with the bell, then clamp so neither edge leaves the viewport.
      left: Math.max(EDGE_GAP, Math.min(rect.right - width, window.innerWidth - width - EDGE_GAP)),
      width,
      maxHeight: Math.max(180, window.innerHeight - top - EDGE_GAP),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    // Capture phase: the sidebar and page are separate scroll containers.
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      // The panel is portalled, so it is not a DOM descendant of the trigger.
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  function openItem(item: NotificationView) {
    setOpen(false);
    if (!item.read) {
      startTransition(async () => {
        await markNotificationRead(item.id);
        router.refresh();
      });
    }
  }

  const panel = box && (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }}
      className="fixed z-90 flex flex-col overflow-hidden rounded-xl border border-hair bg-paper shadow-lg"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-hair px-3 py-2">
        <p className="text-sm font-medium text-ink-900">Notifications</p>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAll}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-plum-600 hover:underline"
          >
            <Check className="size-3" /> Mark all read
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-ink-300">You&apos;re all caught up.</p>
        ) : (
          <ul className="divide-y divide-hair">
            {items.map((n) => {
              const content = (
                <div className={`px-3 py-2.5 ${n.read ? "" : "bg-plum-50/50"}`}>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-plum-600" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium break-words text-ink-900">{n.title}</p>
                      {n.body && <p className="mt-0.5 line-clamp-2 break-words text-xs text-ink-500">{n.body}</p>}
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href} onClick={() => openItem(n)} className="block hover:bg-sunken">
                      {content}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => openItem(n)} className="block w-full text-left hover:bg-sunken">
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-8 items-center justify-center rounded-[8px] text-ink-500 transition-colors hover:bg-plum-50 hover:text-ink-900"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-status-unpaid px-1 text-[9px] font-semibold leading-4 text-paper">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && panel && createPortal(panel, document.body)}
    </div>
  );
}
