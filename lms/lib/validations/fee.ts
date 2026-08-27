import { z } from "zod";

// Amounts are entered in rupees (decimal) and converted to paise (integer) before storage.
export const feeAmountSchema = z.object({
  studentId: z.string().min(1),
  totalAmount: z.coerce
    .number()
    .nonnegative("Amount must be 0 or more")
    .max(10_000_000, "Amount is too large"),
});

export const paymentMethods = ["Cash", "UPI", "Bank Transfer", "Card", "Other"] as const;

export const paymentSchema = z.object({
  studentId: z.string().min(1),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .max(10_000_000, "Amount is too large"),
  date: z.string().min(1, "Date is required"),
  method: z.enum(paymentMethods),
  note: z.string().max(500).optional().or(z.literal("")),
});

export type FeeAmountInput = z.infer<typeof feeAmountSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
