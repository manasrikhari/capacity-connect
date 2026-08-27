import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MeetingStatus } from "@/app/generated/prisma/enums";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Convert a rupee amount (decimal) to integer paise. */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Compact rupee string for badges: ₹2.5L, ₹50K, ₹500. */
export function formatPaiseCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 1_00_000) return `₹${+(rupees / 1_00_000).toFixed(1)}L`;
  if (rupees >= 1_000) return `₹${+(rupees / 1_000).toFixed(1)}K`;
  return `₹${Math.round(rupees)}`;
}

/** Format an integer paise amount as a rupee string, e.g. "₹1,234.50". */
export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type FeeStatus = "PAID" | "PARTIAL" | "UNPAID";

/** Fee status is always derived from sum(payments) vs totalAmount - never stored. */
export function getFeeStatus(totalAmount: number, paidAmount: number): FeeStatus {
  if (totalAmount <= 0 || paidAmount >= totalAmount) return "PAID";
  if (paidAmount > 0) return "PARTIAL";
  return "UNPAID";
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format a Date as the value expected by an <input type="datetime-local"> in local time. */
export function toDatetimeLocalValue(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

/**
 * A LIVE/UPCOMING meeting is treated as ENDED in the UI once its scheduled
 * time is more than 3 hours in the past, even if an admin never pressed
 * "End Meeting".
 */
export function getEffectiveMeetingStatus(meeting: {
  status: MeetingStatus;
  date: Date | string;
}): MeetingStatus {
  if (meeting.status === "ENDED") return "ENDED";

  const date = typeof meeting.date === "string" ? new Date(meeting.date) : meeting.date;
  if (Date.now() - date.getTime() > THREE_HOURS_MS) return "ENDED";

  return meeting.status;
}
