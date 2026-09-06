"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { togglePublishAssignmentAction } from "@/app/admin/assignments/actions";

/** Publish/unpublish toggle — an assignment is a draft until the trainer says so. */
export function PublishAssignmentButton({
  id,
  isPublished,
}: {
  id: string;
  isPublished: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await togglePublishAssignmentAction(id);
          if (res?.error) toast.error(res.error);
          else toast.success(isPublished ? "Unpublished" : "Published to trainees");
        })
      }
      className="inline-flex items-center gap-1.5 rounded-lg border border-hair px-3 py-1.5 text-xs text-ink-500 transition-colors hover:border-plum-300 hover:text-ink-900 disabled:opacity-50"
    >
      {isPublished ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      {isPublished ? "Unpublish" : "Publish"}
    </button>
  );
}
