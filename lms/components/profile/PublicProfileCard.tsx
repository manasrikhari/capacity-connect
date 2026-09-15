"use client";

import { Check, Copy, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  setOpenToMentoringAction,
  setProfileVisibilityAction,
} from "@/app/actions/public-profile";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";

/**
 * Publish control for the shareable profile at `/p/<slug>`.
 *
 * Default is unlisted. The copy is explicit about what becomes visible,
 * because the same row also stores a phone number and a government ID that the
 * public page deliberately never reads.
 */
export function PublicProfileCard({
  initialIsPublic,
  initialSlug,
  initialOpenToMentoring,
}: {
  initialIsPublic: boolean;
  initialSlug: string | null;
  initialOpenToMentoring: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [slug, setSlug] = useState(initialSlug);
  const [mentoring, setMentoring] = useState(initialOpenToMentoring);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const url = slug ? `/p/${slug}` : null;

  function togglePublic() {
    startTransition(async () => {
      const res = await setProfileVisibilityAction(!isPublic);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setIsPublic(!isPublic);
      if (res?.slug) setSlug(res.slug);
      toast.success(!isPublic ? "Your profile is public" : "Your profile is unlisted");
    });
  }

  function toggleMentoring() {
    startTransition(async () => {
      const res = await setOpenToMentoringAction(!mentoring);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setMentoring(!mentoring);
    });
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — select the link and copy it manually.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Globe className="size-5 text-ink-300" />
            Public profile
          </span>
        </CardTitle>
      </CardHeader>

      <p className="text-sm text-ink-500">
        Share a read-only page with your work history, qualifications and{" "}
        <strong className="font-medium text-ink-700">verified certificates</strong> — each one checkable
        against its certificate number. Your phone number, government ID and CV are never shown.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={togglePublic}
          disabled={pending}
          aria-pressed={isPublic}
          className={
            isPublic
              ? "rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-plum-700 disabled:opacity-50"
              : "rounded-lg border border-hair px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-plum-300 disabled:opacity-50"
          }
        >
          {isPublic ? "Public" : "Unlisted"}
        </button>

        {isPublic && url && (
          <>
            <Link href={url} className="text-sm text-plum-600 hover:underline">
              View page
            </Link>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-hair px-3 py-2 text-sm text-ink-500 transition-colors hover:border-plum-300 hover:text-ink-900"
            >
              {copied ? <Check className="size-3.5 text-sage-600" /> : <Copy className="size-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </>
        )}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2.5 border-t border-hair pt-4">
        <input
          type="checkbox"
          checked={mentoring}
          onChange={toggleMentoring}
          disabled={pending}
          className="mt-0.5 size-4 accent-plum-600"
        />
        <span className="text-sm">
          <span className="flex items-center gap-1.5 font-medium text-ink-900">
            <Sparkles className="size-3.5 text-ink-300" />
            Open to mentoring
          </span>
          <span className="text-ink-500">
            Departments looking for a mentor for their cohort can find you.
          </span>
        </span>
      </label>
    </Card>
  );
}
