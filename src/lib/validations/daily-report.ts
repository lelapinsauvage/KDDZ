import { z } from "zod";

export const feverEntrySchema = z.object({
  temperature: z.string().min(1, "Required"),
  time: z.string().min(1, "Required"),
});

export const milkEntrySchema = z.object({
  amountCc: z.string().min(1, "Required"),
  time: z.string().min(1, "Required"),
});

export const dailyReportSchema = z.object({
  // Child selection
  childId: z.string().min(1, "Please select a child"),
  reportDate: z.string().min(1, "Date is required"),

  // Breakfast
  breakfastFoodId: z.string().optional(),
  breakfastPortion: z.enum(["NONE", "LITTLE", "HALF", "MOST", "ALL"]).optional(),
  breakfastTime: z.string().optional(),

  // Lunch
  lunchFoodId: z.string().optional(),
  lunchPortion: z.enum(["NONE", "LITTLE", "HALF", "MOST", "ALL"]).optional(),
  lunchTime: z.string().optional(),

  // Dessert
  dessert: z.string().optional(),
  dessertPortion: z.enum(["NONE", "LITTLE", "HALF", "MOST", "ALL"]).optional(),
  dessertTime: z.string().optional(),

  // Sleep
  isSleep: z.boolean().default(false),
  sleepFrom: z.string().optional(),
  sleepTo: z.string().optional(),

  // Health indicators
  diarrhea: z.boolean().default(false),
  urinePotty: z.coerce.number().int().min(0).default(0),
  stoolPotty: z.coerce.number().int().min(0).default(0),
  urineDiaper: z.coerce.number().int().min(0).default(0),
  stoolDiaper: z.coerce.number().int().min(0).default(0),

  // Symptoms
  mood: z.enum(["HAPPY", "CALM", "FUSSY", "CRYING", "SLEEPY"]).optional(),
  cough: z.boolean().default(false),
  runnyNose: z.boolean().default(false),
  vomit: z.boolean().default(false),

  // Dynamic entries
  feverEntries: z.array(feverEntrySchema).default([]),
  milkEntries: z.array(milkEntrySchema).default([]),

  // Batch action
  applyFoodForAll: z.boolean().default(false),

  // Remarks
  remarks: z.string().optional(),
});

export type DailyReportFormValues = z.input<typeof dailyReportSchema>;
