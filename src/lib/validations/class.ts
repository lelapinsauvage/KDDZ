import { z } from "zod";

export const AGE_UNITS = ["YEARS", "MONTHS"] as const;

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  branchId: z.string().uuid("Invalid branch"),
  language: z.string().max(50).nullable().optional(),
  ageFrom: z.coerce.number().int().min(0).nullable().optional(),
  ageTo: z.coerce.number().int().min(0).nullable().optional(),
  ageFromUnit: z.enum(AGE_UNITS).nullable().optional(),
  ageToUnit: z.enum(AGE_UNITS).nullable().optional(),
  cameraNumber: z.coerce.number().int().min(0).nullable().optional(),
  maxStudents: z.coerce.number().int().min(0).default(0),
  imageUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
});

export type ClassFormValues = z.infer<typeof classSchema>;
