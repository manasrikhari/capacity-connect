import { BookOpen, Clock, FileText, HardDrive, Presentation, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import type { BadgeColor } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { LibraryItemType } from "@/app/generated/prisma/enums";
import { cn } from "@/lib/utils";

/** The flattened shape both dashboards pass to the card. */
export type LibraryItemView = {
  id: string;
  title: string;
  description: string | null;
  type: LibraryItemType;
  subject: string | null;
  skillId: string | null;
  skillName: string | null;
  fileUrl: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  durationMins: number | null;
};

export const TYPE_META: Record<
  LibraryItemType,
  { label: string; icon: LucideIcon; color: BadgeColor }
> = {
  RECORDED_LECTURE: { label: "Lecture", icon: Video, color: "violet" },
  PRESENTATION: { label: "Slides", icon: Presentation, color: "amber" },
  DOCUMENT: { label: "Document", icon: FileText, color: "blue" },
  MANUAL: { label: "Manual", icon: BookOpen, color: "green" },
};

/** Human-readable byte size, e.g. "4.2 MB". Machine data → rendered in font-mono. */
export function formatBytes(bytes: number | null | undefined): string | null {
  if (bytes == null || bytes <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 100 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

/** "1h 05m" / "45m" from a minute count. */
export function formatDuration(mins: number | null | undefined): string | null {
  if (mins == null || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export function LibraryItemCard({
  item,
  href,
  footer,
}: {
  item: LibraryItemView;
  href?: string;
  footer?: ReactNode;
}) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const size = formatBytes(item.fileSizeBytes);
  const duration = formatDuration(item.durationMins);

  const inner = (
    <Card
      className={cn(
        "flex h-full flex-col",
        href && "cursor-pointer transition-colors hover:border-hair-strong"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-hair bg-sunken text-ink-500">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <h3 className="min-w-0 truncate font-medium text-ink-900" title={item.title}>
            {item.title}
          </h3>
        </div>
        <Badge color={meta.color}>{meta.label}</Badge>
      </div>

      {item.description && (
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-ink-500">{item.description}</p>
      )}
      {!item.description && <div className="flex-1" />}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {item.subject && (
          <span className="truncate text-xs text-ink-500" title={item.subject}>
            {item.subject}
          </span>
        )}
        {item.skillName && <Badge color="slate">{item.skillName}</Badge>}
        {duration && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            <Clock aria-hidden="true" className="size-3" />
            {duration}
          </span>
        )}
        {size && (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-300">
            <HardDrive aria-hidden="true" className="size-3" />
            {size}
          </span>
        )}
      </div>

      {footer && <div className="mt-4 flex gap-2">{footer}</div>}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}
