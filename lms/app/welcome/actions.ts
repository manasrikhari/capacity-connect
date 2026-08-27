"use server";

import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createBatchIntentAction() {
  const session = await auth();
  if (!session) redirect("/");

  if (session.user.role === "STUDENT") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: "ADMIN", status: "APPROVED", plan: "FREE", onboarded: true },
    });

    // Force the JWT to re-sync from the DB now — otherwise the token still
    // says STUDENT and the /admin guard bounces the freshly-promoted user
    // until the 60s lastSync window in the jwt callback expires.
    await unstable_update({});
  }

  redirect("/admin");
}

export async function joinBatchIntentAction() {
  const session = await auth();
  if (!session) redirect("/");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboarded: true },
  });

  redirect("/student");
}
