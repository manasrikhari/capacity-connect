"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensurePublicSlug } from "@/lib/public-profile";
import { getSession } from "@/lib/session";

export type PublicProfileState = {
  error?: string;
  /** The handle, so the caller can show the live URL immediately. */
  slug?: string;
  isPublic?: boolean;
} | null;

/**
 * Publish or unpublish the signed-in user's profile page.
 *
 * The handle is minted once and kept, so unpublishing for an afternoon does not
 * rot a link someone has already shared.
 */
export async function setProfileVisibilityAction(isPublic: boolean): Promise<PublicProfileState> {
  const session = await getSession();
  if (!session) return { error: "You must be signed in." };

  const existing = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!existing) {
    // A profile row is created lazily by updateProfileAction; publishing an
    // empty page would be a blank page with a name on it.
    return { error: "Add your designation and organisation before publishing." };
  }

  const slug = await ensurePublicSlug(session.user.id, session.user.name ?? null);
  await prisma.profile.update({ where: { userId: session.user.id }, data: { isPublic } });

  revalidatePath("/student/profile");
  revalidatePath("/admin/profile");
  revalidatePath(`/p/${slug}`);
  return { slug, isPublic };
}

/** Toggle the "open to mentoring" flag — the signal the SPOC model reads. */
export async function setOpenToMentoringAction(open: boolean): Promise<PublicProfileState> {
  const session = await getSession();
  if (!session) return { error: "You must be signed in." };

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, openToMentoring: open },
    update: { openToMentoring: open },
  });

  revalidatePath("/student/profile");
  revalidatePath("/admin/profile");
  return {};
}
