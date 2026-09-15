import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { saveUpload, UploadError } from "@/lib/storage";

export const runtime = "nodejs";

/**
 * POST /api/upload — multipart form { file, batchId }.
 * Trainer-only. Verifies the trainer owns the batch, then stores the file.
 * Returns { fileUrl, mimeType, fileSizeBytes } for the client to feed into the
 * create-library-item action as hidden fields.
 */
export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const batchId = formData.get("batchId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (typeof batchId !== "string" || batchId.length === 0) {
    return NextResponse.json({ error: "Missing batchId" }, { status: 400 });
  }

  // Ownership: the batch must belong to this trainer.
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, teacherId: session.user.id },
    select: { id: true },
  });
  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 400 });
  }

  try {
    const saved = await saveUpload(batch.id, file);
    return NextResponse.json({
      fileUrl: saved.fileUrl,
      mimeType: saved.mimeType,
      fileSizeBytes: saved.sizeBytes,
    });
  } catch (err) {
    if (err instanceof UploadError) {
      const status = err.code === "TOO_LARGE" ? 413 : err.code === "BAD_MIME" ? 415 : 400;
      return NextResponse.json({ error: err.message }, { status });
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
