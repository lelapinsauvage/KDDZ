import { z } from "zod";

export const absenceReportSchema = z.object({
  childId: z.string().min(1, "Please select a child"),
  classId: z.string().optional(),
  teacherId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  reason: z.string().optional(),
  absentFrom: z.string().optional(),
  absentTo: z.string().optional(),
  hospitalized: z.boolean().default(false),
  hospitalizedChoice: z.enum(["", "Yes", "No"]).optional(),
  hospitalName: z.string().optional(),
  doctorName: z.string().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).default("PENDING"),
});

export type AbsenceReportFormValues = z.input<typeof absenceReportSchema>;
