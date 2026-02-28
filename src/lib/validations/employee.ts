import { z } from "zod";

// ── Address sub-schema ──
export const employeeAddressSchema = z.object({
  governorate: z.string(),
  district: z.string(),
  region: z.string(),
  city: z.string(),
  street: z.string(),
  building: z.string(),
});

// ── Language sub-schema ──
export const employeeLanguageSchema = z.object({
  language: z.enum(["ENGLISH", "FRENCH", "ARABIC"]),
  canRead: z.enum(["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "FLUENT"]),
  canWrite: z.enum(["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "FLUENT"]),
  canSpeak: z.enum(["NONE", "BASIC", "INTERMEDIATE", "ADVANCED", "FLUENT"]),
});

// ── Experience sub-schema (work / stage / workshop) ──
export const employeeExperienceSchema = z.object({
  type: z.enum(["WORK", "STAGE", "WORKSHOP"]),
  company: z.string(),
  position: z.string(),
  fromDate: z.string(),
  toDate: z.string(),
  description: z.string(),
});

// ── Document sub-schema (contract / medical test / certificate / attachment) ──
export const employeeDocumentSchema = z.object({
  type: z.enum(["CONTRACT", "MEDICAL_TEST", "FIRST_AID", "CERTIFICATE", "ATTACHMENT"]),
  title: z.string(),
  date: z.string(),
  expiryDate: z.string(),
  fileUrl: z.string(),
});

// ── Main employee form schema ──
export const employeeFormSchema = z.object({
  // System
  username: z.string(),

  // Personal info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string(),
  placeOfBirth: z.string(),
  registerNumber: z.string(),
  nationality: z.string(),
  maritalStatus: z.string(),
  numberOfChildren: z.number().int().min(0),
  gender: z.string(),
  medicalCase: z.boolean(),
  medicalCaseDescription: z.string(),

  // Contact / general
  phone: z.string(),
  telephone: z.string(),
  mobile: z.string(),
  email: z.string().email("Invalid email").or(z.literal("")),
  cnss: z.string(),
  cnssNo: z.string(),
  secondaryDegree: z.string(),
  secondaryDegreeYear: z.string(),
  universityDegree: z.string(),
  universityDegreeYear: z.string(),

  // Doctor-specific
  licenseNumber: z.string(),

  // Garderie info
  hireDate: z.string(),
  specialization: z.string(),
  branchId: z.string().min(1, "Branch is required"),
  classId: z.string(),
  isActive: z.boolean(),
  remarks: z.string(),

  // Address
  address: employeeAddressSchema,

  // Languages
  languages: z.array(employeeLanguageSchema),

  // Experiences (work + stage + workshop all in one list)
  experiences: z.array(employeeExperienceSchema),

  // Documents (contract, medical test, certificate, attachment)
  documents: z.array(employeeDocumentSchema),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
