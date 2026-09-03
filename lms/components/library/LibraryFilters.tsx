"use client";

import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { TYPE_META } from "@/components/library/LibraryItemCard";
import { Select } from "@/components/ui/Field";
import { LIBRARY_ITEM_TYPES } from "@/lib/validations/library";
import type { LibraryItemType } from "@/app/generated/prisma/enums";

const TYPES = LIBRARY_ITEM_TYPES as readonly LibraryItemType[];

export function LibraryFilters({
  subjects,
  skills,
  active,
}: {
  subjects: string[];
  skills: { id: string; name: string }[];
  active: { type?: string; subject?: string; skill?: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const hasFilters = !!(active.type || active.subject || active.skill);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-40 flex-1">
        <span className="mb-1.5 block text-xs font-medium text-ink-500">Type</span>
        <Select value={active.type ?? ""} onChange={(e) => setParam("type", e.target.value)}>
          <option value="">All types</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_META[t].label}
            </option>
          ))}
        </Select>
      </label>

      {subjects.length > 0 && (
        <label className="min-w-40 flex-1">
          <span className="mb-1.5 block text-xs font-medium text-ink-500">Subject</span>
          <Select value={active.subject ?? ""} onChange={(e) => setParam("subject", e.target.value)}>
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </label>
      )}

      {skills.length > 0 && (
        <label className="min-w-40 flex-1">
          <span className="mb-1.5 block text-xs font-medium text-ink-500">Skill</span>
          <Select value={active.skill ?? ""} onChange={(e) => setParam("skill", e.target.value)}>
            <option value="">All skills</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.replace(pathname, { scroll: false })}
          className="inline-flex items-center gap-1 rounded-[10px] border border-hair px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-plum-50 hover:text-ink-900"
        >
          <X className="size-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
