"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { submitForecast } from "@/lib/weather-case-db";

export type SubmitForecastResult =
  | { ok: false; error: string }
  | { ok: true; correct: boolean; csi: number; attemptedCount: number };

/** Record a trainee's colour-coded forecast for one case and return the outcome. */
export async function submitForecastAction(caseId: string, colour: string): Promise<SubmitForecastResult> {
  const session = await getSession();
  if (!session || session.user.role !== "STUDENT") {
    return { ok: false, error: "Sign in as a trainee to take the drill." };
  }

  const result = await submitForecast(session.user.id, caseId, colour);
  if (!result.ok) return result;

  revalidatePath("/student/drill");
  revalidatePath("/student/passport");
  return { ok: true, correct: result.correct, csi: result.scores.csi, attemptedCount: result.attemptedCount };
}
