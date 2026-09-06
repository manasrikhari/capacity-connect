import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public Capacity Connect surfaces — certificate verifier and the
  // announcements CMS — reachable by anyone, signed in or not.
  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/verify") ||
    pathname.startsWith("/announcements");

  if (!session) {
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/", req.url));
  }

  // The post-login choice screen — reachable by any signed-in user,
  // regardless of role/status. The page itself reads the `onboarded` flag
  // from the DB and bounces away if there's nothing left to choose.
  if (pathname === "/welcome") return NextResponse.next();

  // Public pages stay reachable for authenticated users too.
  if (pathname.startsWith("/verify") || pathname.startsWith("/announcements")) {
    return NextResponse.next();
  }

  const { role, status } = session.user;

  if (role === "SUPER_ADMIN") {
    if (pathname.startsWith("/platform")) return NextResponse.next();
    return NextResponse.redirect(new URL("/platform", req.url));
  }

  if (role === "ADMIN") {
    if (status !== "APPROVED") {
      if (pathname === "/blocked") return NextResponse.next();
      return NextResponse.redirect(new URL("/blocked", req.url));
    }
    // Fees are not part of the MoES portal — bounce the old routes.
    if (pathname.startsWith("/admin/fees")) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }
    if (pathname.startsWith("/admin")) return NextResponse.next();
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (pathname.startsWith("/student/fees")) {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }
  // /blocked must be reachable so a suspended trainee can read why, rather than
  // bouncing /blocked → /student → /blocked forever (the redirect-loop bug).
  if (pathname === "/blocked") return NextResponse.next();
  if (pathname === "/" || pathname.startsWith("/student") || pathname.startsWith("/join")) return NextResponse.next();
  return NextResponse.redirect(new URL("/student", req.url));
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
