import { z } from "zod";

export const adminLoginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email or username"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
