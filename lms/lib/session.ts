import { cache } from "react";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

export const getSession = cache(() => auth());

export const requireAdmin = cache(async (): Promise<Session> => {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: admin access required");
  }
  return session;
});

export const requireSuperAdmin = cache(async (): Promise<Session> => {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: super-admin access required");
  }
  return session;
});

/**
 * Either staff role. `requireAdmin` deliberately rejects SUPER_ADMIN and
 * `requireSuperAdmin` rejects ADMIN, so a route serving both (knowledge
 * ingestion, where a trainer curates their course and the ministry curates
 * the national graph) needs this third helper rather than either of those.
 */
export const requireStaff = cache(async (): Promise<Session> => {
  const session = await getSession();
  const role = session?.user.role;
  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized: staff access required");
  }
  return session;
});
