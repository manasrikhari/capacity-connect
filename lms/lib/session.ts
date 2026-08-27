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
