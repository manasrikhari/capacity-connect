"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/app/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { profileSchema } from "@/lib/validations/profile";

/**
 * Update the signed-in user's professional profile. Shared verbatim by the
 * trainee (/student/profile) and trainer (/admin/profile) pages — the profile
 * shape is identical for both, only the surrounding read-only sections differ.
 */
export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "You must be signed in to update your profile." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    designation: formData.get("designation"),
    cadre: formData.get("cadre"),
    department: formData.get("department"),
    organisation: formData.get("organisation"),
    postingLocation: formData.get("postingLocation"),
    phone: formData.get("phone"),
    bio: formData.get("bio"),
    qualifications: formData.get("qualifications"),
    experience: formData.get("experience"),
    yearsExperience: formData.get("yearsExperience"),
    interests: formData.get("interests"),
    governmentIdType: formData.get("governmentIdType"),
    governmentIdNum: formData.get("governmentIdNum"),
    resumeUrl: formData.get("resumeUrl"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const d = parsed.data;

  // Json column: write the parsed array, or clear with DbNull (never null).
  const qualifications: Prisma.InputJsonValue | typeof Prisma.DbNull =
    d.qualifications.length > 0
      ? (d.qualifications as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull;

  const experience: Prisma.InputJsonValue | typeof Prisma.DbNull =
    d.experience.length > 0
      ? (d.experience as unknown as Prisma.InputJsonValue)
      : Prisma.DbNull;

  const data = {
    designation: d.designation || null,
    cadre: d.cadre || null,
    department: d.department || null,
    organisation: d.organisation || null,
    postingLocation: d.postingLocation || null,
    phone: d.phone || null,
    bio: d.bio || null,
    yearsExperience: d.yearsExperience,
    interests: d.interests,
    governmentIdType: d.governmentIdType || null,
    governmentIdNum: d.governmentIdNum || null,
    resumeUrl: d.resumeUrl || null,
    qualifications,
    experience,
  };

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: d.name },
  });

  revalidatePath("/student/profile");
  revalidatePath("/admin/profile");
  return { success: true };
}
