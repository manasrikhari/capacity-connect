"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { acceptInvite } from "@/lib/invite";

/**
 * Redeem an invitation for the signed-in user. Called from the invite page
 * once the signed-in email matches the one the invitation was sent to.
 */
export async function acceptInviteAction(
  token: string,
): Promise<{ ok: true; href: string } | { ok: false; reason: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, reason: "Sign in to accept this invitation." };

  const res = await acceptInvite(token, session.user.id, session.user.email);
  return res.ok ? { ok: true, href: res.href } : res;
}

/**
 * Signed-out acceptance: carry the token through the OAuth round trip in an
 * httpOnly cookie, the same mechanism `/join` already uses, and finish at
 * `/invite/complete`.
 */
export async function inviteGoogleSignInAction(formData: FormData) {
  const token = (formData.get("token") as string | null)?.trim();
  const store = await cookies();

  store.set("auth_intent", "student", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  if (token) {
    store.set("invite_token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    });
  }

  await signIn("google", { redirectTo: "/invite/complete" });
}

/**
 * Form-post wrapper for accepting an invitation. The invite page renders this
 * as an explicit button rather than accepting during render: redeeming is a
 * mutation, and a GET must never consume an invitation.
 */
export async function acceptInviteFormAction(formData: FormData) {
  const token = (formData.get("token") as string | null)?.trim();
  if (!token) redirect("/");

  const res = await acceptInviteAction(token);
  redirect(res.ok ? res.href : `/invite/${encodeURIComponent(token)}?error=wrong-account`);
}
