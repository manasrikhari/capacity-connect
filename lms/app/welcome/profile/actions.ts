"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/action-state";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { DEPARTMENTS, SKILL_CATEGORIES } from "@/lib/taxonomy";
import { optionalFormString } from "@/lib/validations/form";

/**
 * Onboarding profile.
 *
 * Every field here is one the platform actually reads, which is the test a
 * question has to pass to earn a place on this screen:
 *
 *  - `organisation` → `Profile.department`, compared exactly against
 *    `Batch.department` by the recommender's department score, and the field
 *    `/platform` aggregates national figures by.
 *  - `postingLocation` → keyword-matched against a course's domain.
 *  - `interests` → the domains the trainee works in; the only ranking signal a
 *    day-one joiner can give, since they have no skills or quiz history yet.
 *  - `designation`, `cadre`, `yearsExperience` → the course eligibility rules
 *    drawn from IMD's SOP.
 *
 * Nothing is required. A trainee who skips lands on the catalogue instead of
 * recommendations, which is the honest outcome: with no signal, ranking courses
 * would be pretending.
 */
const onboardingSchema = z.object({
  organisation: z.string().optional(),
  postingLocation: optionalFormString(160),
  designation: optionalFormString(120),
  cadre: optionalFormString(60),
  yearsExperience: z.coerce.number().min(0).max(50).catch(0),
});

export async function saveOnboardingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: "You must be signed in." };

  const parsed = onboardingSchema.safeParse({
    organisation: formData.get("organisation"),
    postingLocation: formData.get("postingLocation"),
    designation: formData.get("designation"),
    cadre: formData.get("cadre"),
    yearsExperience: formData.get("yearsExperience"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  // Only accept domains from the taxonomy: this feeds a scorer, so a free-text
  // value would silently never match anything.
  const interests = formData
    .getAll("interests")
    .map(String)
    .filter((v) => (SKILL_CATEGORIES as readonly string[]).includes(v));

  const organisation = (DEPARTMENTS as readonly string[]).includes(parsed.data.organisation ?? "")
    ? parsed.data.organisation!
    : null;

  const data = {
    department: organisation,
    organisation,
    postingLocation: parsed.data.postingLocation ?? null,
    designation: parsed.data.designation ?? null,
    cadre: parsed.data.cadre ?? null,
    yearsExperience: parsed.data.yearsExperience,
    interests,
  };

  await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboarded: true },
  });

  // Somewhere useful, and different depending on whether they gave us anything
  // to work with.
  redirect(interests.length > 0 || organisation ? "/student/recommendations" : "/courses");
}

/** Skip the questions. Still marks onboarding done so they are not asked twice. */
export async function skipOnboardingAction() {
  const session = await getSession();
  if (!session) redirect("/");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboarded: true },
  });
  redirect("/courses");
}
