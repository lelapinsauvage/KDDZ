import { z } from "zod";

export const nurserySettingsSchema = z.object({
  nursery_name: z.string().min(1, "Nursery name is required"),
  nursery_address: z.string(),
  nursery_phone: z.string(),
  nursery_email: z.string().email("Invalid email address").or(z.literal("")),
  open_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  close_time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  working_days: z.string(),
  default_milk: z.string(),
  default_diaper: z.string(),
  assessment_types: z.string(),
  email_notifications: z.string(),
  sms_notifications: z.string(),
  push_notifications: z.string(),
});

export type NurserySettingsValues = z.infer<typeof nurserySettingsSchema>;

export const holidaySchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  description: z.string(),
  date: z.string().min(1, "Start date is required"),
  endDate: z.string(),
  repeated: z.boolean(),
  type: z.string(),
  isActive: z.boolean(),
  notificationTitle: z.string(),
  notificationMessage: z.string(),
  daysBefore: z.number().int().min(0),
  branchId: z.string().nullable(),
});

export type HolidayFormValues = z.infer<typeof holidaySchema>;

export const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string(),
  date: z.string().min(1, "Start date is required"),
  endDate: z.string(),
  eventTypeId: z.string().nullable(),
  branchId: z.string().nullable(),
  isActive: z.boolean(),
});

export type EventFormValues = z.infer<typeof eventSchema>;
