"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      style={{ boxShadow: "var(--shadow-lg)" }}
      className={cn(
        "m-auto w-full max-w-lg rounded-2xl border border-hair bg-paper p-0",
        "backdrop:bg-ink-900/30 backdrop:backdrop-blur-sm",
        "reduce-transparency:backdrop:bg-ink-900/50 reduce-transparency:backdrop:backdrop-blur-none",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-hair px-5 py-4">
        <h2 id={titleId} className="text-lg font-medium text-ink-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-ink-300 transition-colors hover:bg-sunken hover:text-ink-700"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
    </dialog>
  );
}
