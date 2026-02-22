import { z } from "zod";

export const absenceReportSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  date: z.string().min(1, "Date is required"),
  reason: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
});

export type AbsenceReportFormValues = z.input<typeof absenceReportSchema>;
