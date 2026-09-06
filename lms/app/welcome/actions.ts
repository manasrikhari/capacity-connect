"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const trainerRequestSchema = z.object({
  organisation: z.string().trim().min(1, "Organisation is required").max(160),
  designation: z.string().trim().min(1, "Designation is required").max(160),
  department: z.string().trim().max(160).optional().or(z.literal("")),
  intent: z
    .string()
    .trim()
    .min(1, "Tell us what you intend to teach")
    .max(600, "Keep it under 600 characters"),
});

/**
 * A trainee's request to become a trainer. Unlike the old self-promotion (which
 * wrote role=ADMIN, status=APPROVED and walked straight past the pending queue),
 * this leaves the caller a STUDENT and files a governed TrainerRequest that the
 * MoES admin approves on /platform. onboarded is set so /welcome stops showing.
 */
export async function createTrainerRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session) redirect("/");

  const parsed = trainerRequestSchema.safeParse({
    organisation: formData.get("organisation"),
    designation: formData.get("designation"),
    department: formData.get("department") ?? "",
    intent: formData.get("intent"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const { organisation, designation, department, intent } = parsed.data;

  await prisma.$transaction([
    prisma.trainerRequest.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        organisation,
        designation,
        department: department || null,
        intent,
        status: "PENDING",
      },
      // Re-requesting overwrites a prior (e.g. rejected) request and re-queues it.
      update: {
        organisation,
        designation,
        department: department || null,
        intent,
        status: "PENDING",
        reviewedById: null,
        reviewedAt: null,
      },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { onboarded: true },
    }),
  ]);

  redirect("/student?trainerRequest=submitted");
}

export async function joinBatchIntentAction() {
  const session = await auth();
  if (!session) redirect("/");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboarded: true },
  });

  redirect("/student");
}
