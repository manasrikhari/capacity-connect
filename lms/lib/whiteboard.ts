/* Whiteboard sync worker (Cloudflare) — serves exported class-notes PDFs and
   R2 asset uploads. One place for the URL instead of hardcoded copies across
   pages. Reads NEXT_PUBLIC_SYNC_WORKER_URL (the same var the live app uses)
   with NEXT_PUBLIC_WHITEBOARD_WORKER_URL kept as a legacy alias. */

const WORKER_URL = (
  process.env.NEXT_PUBLIC_SYNC_WORKER_URL ||
  process.env.NEXT_PUBLIC_WHITEBOARD_WORKER_URL ||
  "https://opengrapes-whiteboard-sync.manasrikhari23.workers.dev"
).replace(/\/+$/, "");

/** Base origin of the whiteboard sync worker (no trailing slash). */
export function whiteboardWorkerBase(): string {
  return WORKER_URL;
}

/** URL of the handwritten whiteboard-notes PDF for a live-class room. */
export function whiteboardPdfUrl(roomId: string): string {
  return `${WORKER_URL}/api/pdf/${roomId}`;
}

/** Upload endpoint for an R2 asset (e.g. an AI doubt screenshot). */
export function whiteboardUploadUrl(uploadId: string): string {
  return `${WORKER_URL}/api/uploads/${uploadId}`;
}
