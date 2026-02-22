import { z } from "zod";

// ── Guardian sub-schema ──
const guardianSchema = z.object({
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  nationality: z.string().default(""),
  phone: z.string().default(""),
  mobile: z.string().default(""),
  email: z.string().email("Invalid email address").or(z.literal("")).default(""),
  profession: z.string().default(""),
  workplace: z.string().default(""),
  workPhone: z.string().default(""),
  maritalStatus: z.string().default(""),
  divorceSituation: z.string().default(""),
  medicalCase: z.string().default(""),
  canPickUp: z.boolean().default(true),
  idNumber: z.string().default(""),
});

// ── Relative sub-schema ──
const relativeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relation: z.string().min(1, "Relation is required"),
  phone: z.string().min(1, "Phone is required"),
  isAuthorized: z.boolean().default(false),
});

// ── Accounting entry sub-schema ──
const accountingEntrySchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  type: z.enum(["FEE", "DISCOUNT", "PAYMENT", "ADJUSTMENT"]),
});

// ── Main child form schema ──
export const childFormSchema = z.object({
  // Basic info
  firstName: z.string().min(1, "First name is required"),
  firstNameAr: z.string().default(""),
  middleName: z.string().default(""),
  lastName: z.string().min(1, "Last name is required"),
  lastNameAr: z.string().default(""),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  placeOfBirth: z.string().default(""),
  gender: z.enum(["MALE", "FEMALE"], {
    message: "Gender is required",
  }),
  nationality: z.string().default(""),
  religion: z.string().default(""),
  idNumber: z.string().default(""),
  bloodType: z.string().default(""),
  allergies: z.string().default(""),
  photo: z.string().default(""),

  // Mother
  mother: guardianSchema.default({
    firstName: "",
    lastName: "",
    nationality: "",
    phone: "",
    mobile: "",
    email: "",
    profession: "",
    workplace: "",
    workPhone: "",
    maritalStatus: "",
    divorceSituation: "",
    medicalCase: "",
    canPickUp: true,
    idNumber: "",
  }),

  // Father
  father: guardianSchema.default({
    firstName: "",
    lastName: "",
    nationality: "",
    phone: "",
    mobile: "",
    email: "",
    profession: "",
    workplace: "",
    workPhone: "",
    maritalStatus: "",
    divorceSituation: "",
    medicalCase: "",
    canPickUp: true,
    idNumber: "",
  }),

  // Enrollment
  branchId: z.string().min(1, "Branch is required"),
  classId: z.string().min(1, "Class is required"),
  schoolYearId: z.string().min(1, "School year is required"),
  enrollmentDate: z.string().default(""),
  isActive: z.boolean().default(true),
  isDraft: z.boolean().default(false),

  // Care preferences
  busAttendance: z.boolean().default(false),
  diaperType: z.string().default(""),
  milkType: z.string().default(""),
  milkPortions: z.coerce.number().default(0),
  milkScoop: z.coerce.number().default(0),
  milkTime1: z.string().default(""),
  milkTime2: z.string().default(""),
  milkTime3: z.string().default(""),
  lunchIncluded: z.boolean().default(true),
  sleepFrom: z.string().default(""),
  sleepTo: z.string().default(""),
  remarks: z.string().default(""),
  language: z.string().default(""),
  previousGarderie: z.boolean().default(false),
  previousGarderieName: z.string().default(""),

  // Relatives
  relatives: z.array(relativeSchema).default([]),

  // Accounting
  accountingEntries: z.array(accountingEntrySchema).default([]),
});

export type ChildFormValues = z.input<typeof childFormSchema>;
