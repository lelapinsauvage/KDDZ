import { z } from "zod";

export const feverEntrySchema = z.object({
  temperature: z.string().min(1, "Required"),
  time: z.string().min(1, "Required"),
});

export const milkEntrySchema = z.object({
  milkType: z.string().optional(),
  amountCc: z.string().min(1, "Required"),
  scoops: z.string().optional(),
  time: z.string().min(1, "Required"),
});

export const attachmentEntrySchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const dailyReportSchema = z.object({
  // Attendance mode
  attendanceMode: z.enum(["PRESENT", "ABSENT"]).default("PRESENT"),

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
  earlyDinnerFoodId: z.string().optional(),
  earlyDinnerLegacyId: z.string().optional(),
  earlyDinnerPortion: z.enum(["well", "half", "little", "none"]).optional(),
  earlyDinnerTime: z.string().optional(),

  // Dessert
  dessert: z.string().optional(),
  dessertPortion: z.enum(["NONE", "LITTLE", "HALF", "MOST", "ALL"]).optional(),
  dessertTime: z.string().optional(),

  // Attendance times
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),

  // Sleep
  isSleep: z.boolean().default(false),
  sleepFrom: z.string().optional(),
  sleepTo: z.string().optional(),
  secondSleepFrom: z.string().optional(),
  secondSleepTo: z.string().optional(),
  thirdSleepFrom: z.string().optional(),
  thirdSleepTo: z.string().optional(),
  sleepQuality: z.enum(["GOOD", "FAIR", "POOR"]).optional(),

  // Activities
  activities: z.string().optional(),

  // Medicine
  medicine: z.string().optional(),

  // Health indicators
  diarrhea: z.boolean().default(false),
  constipation: z.boolean().default(false),
  urinePotty: z.coerce.number().int().min(0).default(0),
  stoolPotty: z.coerce.number().int().min(0).default(0),
  urineDiaper: z.coerce.number().int().min(0).default(0),
  stoolDiaper: z.coerce.number().int().min(0).default(0),

  // Symptoms
  mood: z.enum(["HAPPY", "CALM", "FUSSY", "CRYING", "SLEEPY"]).optional(),
  moodNoon: z.enum(["sad", "neutral", "happy"]).optional(),
  cough: z.boolean().default(false),
  runnyNose: z.boolean().default(false),
  vomit: z.boolean().default(false),

  // Dynamic entries
  feverEntries: z.array(feverEntrySchema).default([]),
  milkEntries: z.array(milkEntrySchema).default([]),

  // Health notes
  healthNotes: z.string().optional(),

  // Extra clothes
  clothesPants: z.boolean().default(false),
  clothesSweater: z.boolean().default(false),
  clothesTshirt: z.boolean().default(false),
  clothesUnderwear: z.boolean().default(false),
  clothesSocks: z.boolean().default(false),
  needsWipes: z.boolean().default(false),
  needsBrush: z.boolean().default(false),
  needsTowel: z.boolean().default(false),
  needsDiapers: z.boolean().default(false),
  needsBabyBottle: z.boolean().default(false),
  needsMilk: z.boolean().default(false),

  // Attachments
  attachments: z.array(attachmentEntrySchema).default([]),

  // Batch action
  applyFoodForAll: z.boolean().default(false),

  // Remarks
  remarks: z.string().optional(),

  // Absent flow fields
  absentReason: z.string().optional(),
  absentFrom: z.string().optional(),
  absentTo: z.string().optional(),
  hospitalAttend: z.boolean().default(false),
});

export type DailyReportFormValues = z.input<typeof dailyReportSchema>;
