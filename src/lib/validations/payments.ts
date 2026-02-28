import { z } from "zod";

export const quickPaymentSchema = z.object({
  childId: z.string().uuid("Please select a child"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.enum(["USD", "LBP"]),
  method: z.enum(["CASH", "CHECK", "TRANSFER", "CREDIT_CARD"]),
  category: z.enum(["MONTHLY", "REGISTRATION", "BUS", "FOOD", "XTRA_TIME", "OTHER"]),
  notes: z.string().optional(),
  date: z.string().optional(),
  coverageFromMonth: z.number().min(1).max(12).optional(),
  coverageToMonth: z.number().min(1).max(12).optional(),
});

export type QuickPaymentInput = z.infer<typeof quickPaymentSchema>;
