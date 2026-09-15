"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";
import { announcementSchema } from "@/lib/validations/announcement";

function parseForm(formData: FormData) {
  return announcementSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") ?? "",
    content: formData.get("content"),
    category: formData.get("category"),
    bannerUrl: formData.get("bannerUrl") ?? "",
    // Unchecked checkboxes are absent; coerce presence → true.
    isFeatured: formData.get("isFeatured") != null,
    isPublished: formData.get("isPublished") != null,
  });
}

/** Revalidate every surface an announcement can appear on. */
function revalidateAll(slug?: string) {
  revalidatePath("/platform/announcements");
  revalidatePath("/");
  revalidatePath("/announcements");
  if (slug) revalidatePath(`/announcements/${slug}`);
}

async function slugFor(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  const rows = await prisma.announcement.findMany({
    where: excludeId ? { NOT: { id: excludeId } } : undefined,
    select: { slug: true },
  });
  return uniqueSlug(base, rows.map((r) => r.slug));
}

export async function createAnnouncementAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSuperAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { title, summary, content, category, bannerUrl, isFeatured, isPublished } = parsed.data;

  const slug = await slugFor(title);
  await prisma.announcement.create({
    data: {
      title,
      slug,
      summary: summary || null,
      content,
      category,
      bannerUrl: bannerUrl || null,
      isFeatured,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
      authorId: session.user.id,
    },
  });

  revalidateAll(slug);
  return { success: true };
}

export async function updateAnnouncementAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const { title, summary, content, category, bannerUrl, isFeatured, isPublished } = parsed.data;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return { error: "Announcement not found" };

  const slug = await slugFor(title, id);
  await prisma.announcement.update({
    where: { id },
    data: {
      title,
      slug,
      summary: summary || null,
      content,
      category,
      bannerUrl: bannerUrl || null,
      isFeatured,
      isPublished,
      // Stamp publishedAt on first publish; keep the original stamp thereafter.
      publishedAt: isPublished ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    },
  });

  revalidateAll(slug);
  return { success: true };
}

export async function deleteAnnouncementAction(id: string) {
  await requireSuperAdmin();
  const existing = await prisma.announcement.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return { error: "Announcement not found" };
  await prisma.announcement.delete({ where: { id } });
  revalidateAll(existing.slug);
  return { success: true as const };
}

export async function togglePublishAction(id: string) {
  await requireSuperAdmin();
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return { error: "Announcement not found" };
  const nextPublished = !existing.isPublished;
  await prisma.announcement.update({
    where: { id },
    data: {
      isPublished: nextPublished,
      // Set publishedAt the first time it goes live; keep it afterwards.
      publishedAt: nextPublished ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
    },
  });
  revalidateAll(existing.slug);
  return { success: true as const };
}

export async function toggleFeaturedAction(id: string) {
  await requireSuperAdmin();
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return { error: "Announcement not found" };
  await prisma.announcement.update({
    where: { id },
    data: { isFeatured: !existing.isFeatured },
  });
  revalidateAll(existing.slug);
  return { success: true as const };
}
