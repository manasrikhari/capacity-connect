import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import {
  createReadStream,
  mimeForStoredName,
  resolveStoredFile,
  statStoredFile,
} from "@/lib/storage";

export const runtime = "nodejs";

/**
 * GET /api/files/<batchId>/<storedName>
 *
 * Streams a stored library file. Access = the course trainer OR a student with
 * an APPROVED enrollment in that batch. Supports HTTP Range for seekable media
 * (206 partial responses); serves inline with the Content-Type inferred from the
 * stored extension (never from client input).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (!Array.isArray(segments) || segments.length !== 2) {
    return new NextResponse("Not found", { status: 404 });
  }
  const [batchId, storedName] = segments;

  const abs = resolveStoredFile(batchId, storedName);
  if (!abs) {
    return new NextResponse("Not found", { status: 404 });
  }

  // A resource published to the homepage is servable to anyone, signed in or
  // not. Otherwise fall back to session-gated batch access.
  const isPublic = await prisma.libraryItem.findFirst({
    where: { batchId, isPublic: true, fileUrl: `/api/files/${batchId}/${storedName}` },
    select: { id: true },
  });

  if (!isPublic) {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Authorization: trainer who owns the batch, or an APPROVED student.
    const authorized = await hasBatchAccess(session.user.id, session.user.role, batchId);
    if (!authorized) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const info = await statStoredFile(abs);
  if (!info || !info.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const size = info.size;
  const contentType = mimeForStoredName(storedName);
  const baseHeaders: Record<string, string> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    "Cache-Control": "private, max-age=0, must-revalidate",
  };

  const rangeHeader = request.headers.get("range");
  if (rangeHeader) {
    const parsed = parseRange(rangeHeader, size);
    if (!parsed) {
      return new NextResponse("Range Not Satisfiable", {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }
    const { start, end } = parsed;
    const stream = createReadStream(abs, { start, end });
    return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${size}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  const stream = createReadStream(abs);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: { ...baseHeaders, "Content-Length": String(size) },
  });
}

async function hasBatchAccess(
  userId: string,
  role: string,
  batchId: string
): Promise<boolean> {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { teacherId: true },
  });
  if (!batch) return false;
  if (batch.teacherId === userId) return true;

  const enrollment = await prisma.enrollment.findUnique({
    where: { studentId_batchId: { studentId: userId, batchId } },
    select: { status: true },
  });
  return enrollment?.status === "APPROVED";
}

/** Parse a single-range `Range: bytes=start-end` header. Returns null if invalid. */
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  let start: number;
  let end: number;

  if (rawStart === "" && rawEnd === "") return null;

  if (rawStart === "") {
    // Suffix range: last N bytes.
    const suffix = Number(rawEnd);
    if (!Number.isFinite(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Number(rawEnd);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start > end || start < 0 || start >= size) return null;
  if (end >= size) end = size - 1;

  return { start, end };
}
