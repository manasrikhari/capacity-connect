"use client";

import { Bell, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions/notifications";

export type NotificationView = {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string; // ISO
};

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

export function NotificationBellClient({
  items,
  unread,
}: {
  items: NotificationView[];
  unread: number;
}) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
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

      {open && (
        <div className="absolute right-0 z-80 mt-2 w-80 overflow-hidden rounded-xl border border-hair bg-paper shadow-lg">
          <div className="flex items-center justify-between border-b border-hair px-3 py-2">
            <p className="text-sm font-medium text-ink-900">Notifications</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-plum-600 hover:underline"
              >
                <Check className="size-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
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
                          <p className="text-sm font-medium text-ink-900">{n.title}</p>
                          {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{n.body}</p>}
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
      )}
    </div>
  );
}
