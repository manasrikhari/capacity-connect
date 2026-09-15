import "server-only";

import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Local-disk storage adapter for library uploads.
 *
 * NOTE: Local disk is NOT persistent on serverless/edge hosts (Vercel, etc.) —
 * each invocation gets a fresh, ephemeral filesystem. This module is the single
 * seam for storage: swap the body of saveUpload / resolveStoredFile /
 * deleteStoredFile for S3/R2 (presigned PUT + object GET) later WITHOUT touching
 * any caller. Callers only ever see { storedName, fileUrl, mimeType, sizeBytes }
 * and the /api/files/<batchId>/<storedName> URL shape.
 */

export const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

/** Max upload size: 200 MB. */
export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

/**
 * Allowed MIME types → canonical file extension. The extension is ALWAYS taken
 * from this map (derived from the validated MIME), NEVER from the client-supplied
 * filename, so a hostile name like "x.php" or "../../etc/passwd" can never shape
 * the stored path or extension.
 */
const MIME_EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "image/png": "png",
  "image/jpeg": "jpg",
};

export function isAllowedMime(mime: string): boolean {
  return Object.prototype.hasOwnProperty.call(MIME_EXT, mime);
}

/** Content-Type to serve for a stored file, inferred from its extension. */
const EXT_MIME: Record<string, string> = Object.fromEntries(
  Object.entries(MIME_EXT).map(([mime, ext]) => [ext, mime])
);

export function mimeForStoredName(storedName: string): string {
  const ext = path.extname(storedName).slice(1).toLowerCase();
  return EXT_MIME[ext] ?? "application/octet-stream";
}

export class UploadError extends Error {
  constructor(
    message: string,
    readonly code: "BAD_INPUT" | "TOO_LARGE" | "BAD_MIME"
  ) {
    super(message);
    this.name = "UploadError";
  }
}

export type SavedUpload = {
  storedName: string;
  fileUrl: string;
  mimeType: string;
  sizeBytes: number;
};

/**
 * Validate and persist an uploaded file under UPLOAD_ROOT/<batchId>/.
 * Throws UploadError with a code the route maps to 400/413/415.
 */
export async function saveUpload(batchId: string, file: File): Promise<SavedUpload> {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    throw new UploadError("No file provided", "BAD_INPUT");
  }

  const mimeType = file.type;
  if (!isAllowedMime(mimeType)) {
    throw new UploadError(`Unsupported file type: ${mimeType || "unknown"}`, "BAD_MIME");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("File exceeds the 200 MB limit", "TOO_LARGE");
  }

  // batchId comes from a DB-verified owned batch, but stay defensive: it must be
  // a single safe path segment so it can never escape UPLOAD_ROOT.
  if (!isSafeSegment(batchId)) {
    throw new UploadError("Invalid batch", "BAD_INPUT");
  }

  const ext = MIME_EXT[mimeType];
  const storedName = `${randomUUID()}.${ext}`;

  const dir = path.join(UPLOAD_ROOT, batchId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  // Re-check the real byte length after buffering (defends against a lying size).
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError("File exceeds the 200 MB limit", "TOO_LARGE");
  }
  await writeFile(path.join(dir, storedName), buffer);

  return {
    storedName,
    fileUrl: `/api/files/${batchId}/${storedName}`,
    mimeType,
    sizeBytes: buffer.byteLength,
  };
}

/** A single path segment with no traversal, separators, or NUL bytes. */
function isSafeSegment(segment: string): boolean {
  if (!segment || segment === "." || segment === "..") return false;
  if (segment.includes("..")) return false;
  if (segment.includes("/") || segment.includes("\\")) return false;
  if (segment.includes("\0")) return false;
  return true;
}

/**
 * Resolve <batchId>/<storedName> to an absolute path, rejecting any traversal.
 * Guards twice: (1) each segment is validated, and (2) the resolved absolute
 * path is confirmed to stay inside UPLOAD_ROOT. Returns null if unsafe.
 */
export function resolveStoredFile(batchId: string, storedName: string): string | null {
  if (!isSafeSegment(batchId) || !isSafeSegment(storedName)) return null;

  const abs = path.resolve(UPLOAD_ROOT, batchId, storedName);
  const root = UPLOAD_ROOT + path.sep;
  if (abs !== path.resolve(UPLOAD_ROOT, batchId, storedName)) return null;
  if (!abs.startsWith(root)) return null;

  return abs;
}

/** Best-effort delete of a stored file. Silently ignores a missing file. */
export async function deleteStoredFile(batchId: string, storedName: string): Promise<void> {
  const abs = resolveStoredFile(batchId, storedName);
  if (!abs) return;
  await rm(abs, { force: true });
}

/** fs.stat wrapper returning null when the file is absent. */
export async function statStoredFile(abs: string) {
  try {
    return await stat(abs);
  } catch {
    return null;
  }
}

export { createReadStream };
