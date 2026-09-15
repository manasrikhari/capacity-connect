"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validations/auth";
import type { ActionState } from "@/lib/action-state";

export async function googleSignInAction() {
  await signIn("google", { redirectTo: "/welcome" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/**
 * Email + password sign-in for staff (teachers, owners) and — since seeded
 * students carry a dev password — anyone with credentials. Google remains the
 * primary path for students; this is the fallback / staff entry point.
 */
export async function credentialsSignInAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = adminLoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (!key) continue;
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { fieldErrors };
  }

  try {
    // redirect:false — the form does a full-page navigation to "/" on
    // success instead. Letting Auth.js redirect inside the action rendered
    // the landing page in the same request that *sets* the session cookie,
    // so the user saw the signed-out page and assumed the login failed.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Wrong email or password." };
    }
    throw error;
  }
  return { success: true };
}
