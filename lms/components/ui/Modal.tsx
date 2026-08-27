"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
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
      className={cn(
        "m-auto w-full max-w-lg rounded-2xl border border-violet-100 bg-white p-0 shadow-xl backdrop:bg-slate-900/30 backdrop:backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
    </dialog>
  );
}
