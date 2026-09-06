"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { nominate, type NominationOutcome } from "@/lib/invite";
import { prisma } from "@/lib/prisma";
import { getSpocContext } from "@/lib/spoc";
import { nominationSchema, parseNominationList } from "@/lib/validations/nomination";

export type NominateState =
  | (NonNullable<ActionState> & { outcomes?: NominationOutcome[]; rejected?: string[] })
  | null;

/**
 * Nominate a list of staff onto a course, the way IMD actually onboards:
 * an office sends its people, rather than each person finding the course and
 * waiting for an approval nobody is told about.
 */
export async function nominateAction(
  _prev: NominateState,
  formData: FormData,
): Promise<NominateState> {
  const ctx = await getSpocContext();
  if (!ctx) return { error: "You are not registered as a training coordinator." };

  const parsed = nominationSchema.safeParse({
    batchId: formData.get("batchId"),
    list: formData.get("list"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // The department must be one this SPOC actually holds, not whatever the form
  // posted — otherwise a coordinator could enrol staff against another office.
  // The select is only rendered when a coordinator holds more than one office,
  // so an absent value means "my only office" rather than an invalid form.
  const posted = formData.get("departmentId");
  const departmentId = typeof posted === "string" && posted ? posted : ctx.departments[0].id;
  if (!ctx.departments.some((d) => d.id === departmentId)) {
    return { error: "You are not the coordinator for that office." };
  }

  const batch = await prisma.batch.findFirst({
    where: { id: parsed.data.batchId, status: "ACTIVE", teacher: { status: { not: "SUSPENDED" } } },
    select: { id: true },
  });
  if (!batch) return { error: "That course is not accepting trainees." };

  const { rows, rejected } = parseNominationList(parsed.data.list);
  if (rows.length === 0) {
    return { error: "No valid email addresses found in that list.", rejected };
  }

  const outcomes = await nominate({
    people: rows,
    batchId: batch.id,
    departmentId,
    invitedById: ctx.userId,
  });

  revalidatePath("/spoc");
  return { success: true, outcomes, rejected };
}
