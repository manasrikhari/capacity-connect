"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import type { ActionState } from "@/lib/action-state";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";

/**
 * Adds the submitted name and email back to the state so a rejected form can be
 * re-rendered with them still filled in. Passwords are deliberately never
 * echoed — a wiped password box is a small annoyance, a password round-tripping
 * through the server is not.
 */
export type RegisterState =
  | (NonNullable<ActionState> & { values?: { name: string; email: string } })
  | null;

/**
 * Self-registration for trainees.
 *
 * Two things this deliberately does not do:
 *
 *  - It never reads a role from the form. Everyone who registers is a STUDENT.
 *    Becoming a trainer remains a request an admin approves, which is the hole
 *    `app/welcome/actions.ts` used to have.
 *  - It never signs in an account it did not just create. A duplicate email is
 *    reported, not silently treated as a login.
 *
 * A new trainee is APPROVED at creation, matching the `events.createUser` hook
 * that does the same for Google sign-ups: account approval is for staff, and
 * enrolment approval is where a trainee is actually gated.
 */
export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`register:${ip}`, 5, 60_000)) {
    return { error: "Too many attempts. Wait a minute and try again." };
  }

  const submitted = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
  };

  const parsed = registerSchema.safeParse({
    ...submitted,
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!key) continue;
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { fieldErrors, values: submitted };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return {
      fieldErrors: { email: ["An account already exists for this address. Sign in instead."] },
      values: submitted,
    };
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        role: "STUDENT",
        status: "APPROVED",
      },
    });
  } catch {
    // Unique constraint lost a race with a concurrent signup.
    return {
      fieldErrors: { email: ["An account already exists for this address. Sign in instead."] },
      values: submitted,
    };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/welcome" });
  } catch (error) {
    if (error instanceof AuthError) {
      // The account exists; only the automatic sign-in failed.
      return { error: "Account created, but sign-in failed. Try signing in." };
    }
    throw error; // NEXT_REDIRECT
  }

  return null;
}
