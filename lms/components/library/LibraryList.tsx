"use client";

import { Globe, Library, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { deleteLibraryItemAction, toggleLibraryPublicAction } from "@/app/admin/library/actions";
import {
  LibraryItemCard,
  TYPE_META,
  type LibraryItemView,
} from "@/components/library/LibraryItemCard";
import { LibraryUploadForm } from "@/components/library/LibraryUploadForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LIBRARY_ITEM_TYPES } from "@/lib/validations/library";
import type { LibraryItemType } from "@/app/generated/prisma/enums";

const TYPE_ORDER = LIBRARY_ITEM_TYPES as readonly LibraryItemType[];

export function LibraryList({
  items,
  batchId,
  skills,
}: {
  items: LibraryItemView[];
  batchId: string;
  skills: { id: string; name: string }[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryItemView | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item: LibraryItemView) {
    setEditing(item);
    setModalOpen(true);
  }

  function handleTogglePublic(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const result = await toggleLibraryPublicAction(id);
      if (result?.error) toast.error(result.error);
      else toast.success(result?.isPublic ? "Published to homepage" : "Unpublished");
      setPendingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this item? Any uploaded file is removed too. This cannot be undone.")) {
      return;
    }
    setPendingId(id);
    startTransition(async () => {
      const result = await deleteLibraryItemAction(id);
      if (result?.error) toast.error(result.error);
      else toast.success("Item deleted");
      setPendingId(null);
    });
  }

  const groups = TYPE_ORDER.map((type) => ({
    type,
    meta: TYPE_META[type],
    items: items.filter((i) => i.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-ink-900">Library</h1>
          <p className="mt-1 text-sm text-ink-500">
            Recorded lectures, slides, documents and manuals for your course.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add item
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Library}
          title="Library is empty"
          description="Upload a recording or document, or link an external resource for your trainees."
          action={
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add item
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.type}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-sm font-medium text-ink-700">{group.meta.label}</h2>
                <Badge color="slate">{group.items.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <LibraryItemCard
                    key={item.id}
                    item={item}
                    footer={
                      <>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={item.isPublic ? "outline" : "ghost"}
                          loading={pending && pendingId === item.id}
                          onClick={() => handleTogglePublic(item.id)}
                          title={item.isPublic ? "Published on the public homepage" : "Publish to the public homepage"}
                        >
                          {item.isPublic ? <Globe className="size-3.5" /> : <Lock className="size-3.5" />}
                          {item.isPublic ? "Public" : "Publish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={pending && pendingId === item.id}
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="size-3.5" /> Delete
                        </Button>
                      </>
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <LibraryUploadForm
        key={editing?.id ?? "create"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editing}
        batchId={batchId}
        skills={skills}
      />
    </div>
  );
}
