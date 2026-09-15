"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import MarkdownRenderer from "@/components/ai/MarkdownRenderer";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Label, Select, Textarea } from "@/components/ui/Field";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/app/platform/announcements/actions";
import { initialActionState } from "@/lib/action-state";
import { ANNOUNCEMENT_CATEGORIES } from "@/lib/taxonomy";

export type EditableAnnouncement = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  category: string;
  bannerUrl: string | null;
  isFeatured: boolean;
  isPublished: boolean;
};

export function AnnouncementForm({
  announcement,
  onSuccess,
  redirectTo,
}: {
  announcement?: EditableAnnouncement | null;
  onSuccess?: () => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(announcement);
  const action = announcement
    ? updateAnnouncementAction.bind(null, announcement.id)
    : createAnnouncementAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);

  const [content, setContent] = useState(announcement?.content ?? "");
  const [tab, setTab] = useState<"write" | "preview">("write");

  useEffect(() => {
    if (state?.success) {
      toast.success(isEdit ? "Announcement saved" : "Announcement created");
      if (!isEdit) {
        formRef.current?.reset();
        setContent("");
      }
      onSuccess?.();
      if (redirectTo) router.push(redirectTo);
    } else if (state?.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const tabBtn = (active: boolean) =>
    `rounded-[8px] px-3 py-1 text-xs font-medium transition-colors ${
      active ? "bg-plum-600 text-paper" : "text-ink-500 hover:bg-plum-50"
    }`;

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <FormField label="Title" htmlFor="title" error={state?.fieldErrors?.title?.[0]}>
        <Input
          id="title"
          name="title"
          defaultValue={announcement?.title}
          placeholder="e.g. WMO BIP-M refresher — October cohort"
          required
        />
      </FormField>

      <FormField label="Summary (optional)" htmlFor="summary" error={state?.fieldErrors?.summary?.[0]}>
        <Input
          id="summary"
          name="summary"
          defaultValue={announcement?.summary ?? ""}
          placeholder="One-line teaser shown on cards and the homepage"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Category" htmlFor="category" error={state?.fieldErrors?.category?.[0]}>
          <Select id="category" name="category" defaultValue={announcement?.category ?? ANNOUNCEMENT_CATEGORIES[0]}>
            {ANNOUNCEMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Banner URL (optional)" htmlFor="bannerUrl" error={state?.fieldErrors?.bannerUrl?.[0]}>
          <Input
            id="bannerUrl"
            name="bannerUrl"
            type="url"
            defaultValue={announcement?.bannerUrl ?? ""}
            placeholder="https://..."
          />
        </FormField>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="content">Content (markdown)</Label>
          <div className="flex gap-1 rounded-[10px] border border-hair bg-paper p-0.5">
            <button type="button" className={tabBtn(tab === "write")} onClick={() => setTab("write")}>
              Write
            </button>
            <button type="button" className={tabBtn(tab === "preview")} onClick={() => setTab("preview")}>
              Preview
            </button>
          </div>
        </div>
        {tab === "write" ? (
          <Textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the announcement in markdown…"
            className="min-h-64"
          />
        ) : (
          <>
            {/* Keep the value submitted even while previewing. */}
            <input type="hidden" name="content" value={content} />
            <div className="min-h-64 rounded-[10px] border border-hair bg-paper px-4 py-3">
              {content.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <p className="text-sm text-ink-300">Nothing to preview yet.</p>
              )}
            </div>
          </>
        )}
        {state?.fieldErrors?.content?.[0] && (
          <p className="mt-1 text-xs text-status-unpaid">{state.fieldErrors.content[0]}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={announcement?.isFeatured ?? false}
            className="size-4 accent-plum-600"
          />
          Feature on homepage
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={announcement?.isPublished ?? false}
            className="size-4 accent-plum-600"
          />
          Published (visible publicly)
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-status-unpaid" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {redirectTo && (
          <Button type="button" variant="outline" onClick={() => router.push(redirectTo)}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={pending}>
          {isEdit ? "Save changes" : "Create announcement"}
        </Button>
      </div>
    </form>
  );
}
