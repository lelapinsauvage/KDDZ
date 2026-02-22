import { z } from "zod";

export const quickPaymentSchema = z.object({
  childId: z.string().uuid("Please select a child"),
  amount: z.number().positive("Amount must be greater than 0"),
  method: z.enum(["CASH", "CHECK", "TRANSFER", "CREDIT_CARD"]),
  category: z.enum(["MONTHLY", "REGISTRATION", "BUS", "FOOD", "XTRA_TIME", "OTHER"]),
  notes: z.string().optional(),
});

export type QuickPaymentInput = z.infer<typeof quickPaymentSchema>;
