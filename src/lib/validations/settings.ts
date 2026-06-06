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
  // Government Registration
  registration_number: z.string(),
  registration_date: z.string(),
  // Owner Information
  owner_type: z.string(), // "person" | "entity"
  owner_name: z.string(),
  owner_father_name: z.string(),
  owner_family_name: z.string(),
  owner_id_number: z.string(),
  owner_nationality: z.string(),
  owner_place_of_birth: z.string(),
  owner_date_of_birth: z.string(),
  entity_legal_name: z.string(),
  entity_type: z.string(),
  entity_registration_number: z.string(),
  entity_representative_name: z.string(),
  // Nursery Identity
  nursery_name_ar: z.string(),
  nursery_name_latin: z.string(),
  // Location
  nursery_province_id: z.string(),
  nursery_district_id: z.string(),
  nursery_region_id: z.string(),
});

export type NurserySettingsValues = z.infer<typeof nurserySettingsSchema>;

export const holidaySchema = z.object({
  name: z.string().min(1, "Description is required"),
  description: z.string(),
  date: z.string().min(1, "Start date is required"),
  endDate: z.string(),
  repeated: z.boolean(),
  type: z.string(),
  isActive: z.boolean(),
  notificationTitle: z.string(),
  notificationMessage: z.string().max(155, "Message must be 155 characters or less"),
  daysBefore: z.number().int().min(0),
  notificationDaysBefore: z.array(z.number().int().min(1).max(7)),
  informTeachers: z.boolean(),
  sendVia: z.string(),
  branchId: z.string().nullable(),
});

export type HolidayFormValues = z.infer<typeof holidaySchema>;

export const eventSchema = z.object({
  title: z.string().min(1, "Event title is required"),
  description: z.string(),
  customSubject: z.string(),
  customBody: z.string().max(155, "Message must be 155 characters or less"),
  date: z.string().min(1, "Start date is required"),
  endDate: z.string(),
  eventTypeId: z.string().nullable(),
  branchId: z.string().nullable(),
  notificationBranchIds: z.array(z.string()),
  notificationDaysBefore: z.array(z.number().int().min(1).max(10)),
  isActive: z.boolean(),
});

export type EventFormValues = z.infer<typeof eventSchema>;
