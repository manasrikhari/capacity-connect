"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Megaphone, Pencil, Plus, Star, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  deleteAnnouncementAction,
  toggleFeaturedAction,
  togglePublishAction,
} from "@/app/platform/announcements/actions";
import { cn, formatDate } from "@/lib/utils";

export type AnnouncementRow = {
  id: string;
  title: string;
  category: string;
  isPublished: boolean;
  isFeatured: boolean;
  viewCount: number;
  updatedAt: Date;
};

const TABLE_HEAD = "font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300";

export function AnnouncementTable({ announcements }: { announcements: AnnouncementRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newOpen, setNewOpen] = useState(false);

  function run(fn: () => Promise<{ success?: boolean; error?: string }>, ok: string) {
    startTransition(async () => {
      const res = await fn();
      if (res?.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setNewOpen(true)}>
          <Plus className="size-4" />
          New announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements yet"
          description="Publish a training-calendar note, ministry advisory, or achievement to feature it on the public homepage."
          action={<Button onClick={() => setNewOpen(true)}>New announcement</Button>}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={cn("border-b border-hair-strong", TABLE_HEAD)}>
                <th className="py-2 pr-4 font-normal">Title</th>
                <th className="py-2 pr-4 font-normal">Category</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 text-right font-normal">Views</th>
                <th className="py-2 pr-4 font-normal">Updated</th>
                <th className="py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {announcements.map((a) => (
                <tr key={a.id}>
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-1.5">
                      {a.isFeatured && (
                        <Star aria-label="Featured" className="size-3.5 shrink-0 fill-plum-600 text-plum-600" />
                      )}
                      <span className="font-medium text-ink-900">{a.title}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge color="violet">{a.category}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge color={a.isPublished ? "green" : "slate"}>
                      {a.isPublished ? "published" : "draft"}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums text-ink-700">{a.viewCount}</td>
                  <td className="py-3 pr-4 font-mono text-ink-500">{formatDate(a.updatedAt)}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant={a.isPublished ? "outline" : "primary"}
                        disabled={pending}
                        onClick={() => run(() => togglePublishAction(a.id), a.isPublished ? "Unpublished" : "Published")}
                      >
                        {a.isPublished ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        aria-label={a.isFeatured ? "Unfeature" : "Feature"}
                        title={a.isFeatured ? "Unfeature" : "Feature"}
                        onClick={() => run(() => toggleFeaturedAction(a.id), a.isFeatured ? "Unfeatured" : "Featured")}
                      >
                        <Star className={cn("size-4", a.isFeatured && "fill-plum-600 text-plum-600")} />
                      </Button>
                      <Link
                        href={`/platform/announcements/${a.id}`}
                        className="inline-flex items-center gap-1 rounded-[8px] px-2 py-1 text-xs text-ink-500 hover:bg-plum-50 hover:text-ink-900"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        aria-label="Delete"
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete "${a.title}"? This cannot be undone.`)) {
                            run(() => deleteAnnouncementAction(a.id), "Deleted");
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-status-unpaid" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="New announcement" className="max-w-2xl">
        <AnnouncementForm
          onSuccess={() => {
            setNewOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </div>
  );
}
