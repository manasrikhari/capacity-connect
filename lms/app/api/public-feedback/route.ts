import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Public feedback / grievance sink for the unauthenticated /feedback page — a
 * GIGW citizen-facing feedback channel. No auth by design; kept minimal and
 * length-capped. Stores one PublicFeedback row.
 */
const schema = z.object({
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  category: z.enum(["general", "suggestion", "accessibility", "grievance"]).default("general"),
  message: z.string().trim().min(3, "Please enter a message.").max(4000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid submission.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const { name, email, category, message } = parsed.data;
  try {
    await prisma.publicFeedback.create({
      data: {
        name: name || null,
        email: email || null,
        category,
        message,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not save feedback. Please try again." }, { status: 500 });
  }
}
