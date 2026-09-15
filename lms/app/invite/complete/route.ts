import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { acceptInvite } from "@/lib/invite";

/**
 * Landing point after a nominee signs in from an invitation link. Mirrors
 * `/join/complete` and `/courses/complete`: read the intent cookie, finish the
 * work, clear the cookies whichever way it goes.
 */
export async function GET(request: Request) {
  const session = await auth();
  const store = await cookies();
  const token = store.get("invite_token")?.value;

  const go = (path: string) => {
    const res = NextResponse.redirect(new URL(path, request.url));
    res.cookies.delete("invite_token");
    res.cookies.delete("auth_intent");
    return res;
  };

  if (!session?.user?.email) return go("/");
  if (!token) return go("/student");

  const res = await acceptInvite(token, session.user.id, session.user.email);
  if (!res.ok) {
    // Send them back to the invitation so they can read why it failed — most
    // often because they signed in with a different Google account.
    return go(`/invite/${encodeURIComponent(token)}?error=wrong-account`);
  }

  return go(res.href);
}
