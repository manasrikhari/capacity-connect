import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

/** Minimum length for a new password. Long enough to matter, short enough to type. */
export const MIN_PASSWORD = 8;

/**
 * Self-registration for trainees.
 *
 * Role is deliberately absent: a registration form must never let the caller
 * choose what they become. Everyone who signs up is a STUDENT, and becoming a
 * trainer stays a request that a ministry admin approves — the same hole that
 * `app/welcome/actions.ts` used to have.
 */
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(120),
    email: z
      .string()
      .trim()
      .max(200)
      .transform((v) => v.toLowerCase())
      .pipe(z.email("Enter a valid email address")),
    password: z.string().min(MIN_PASSWORD, `At least ${MIN_PASSWORD} characters`).max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
