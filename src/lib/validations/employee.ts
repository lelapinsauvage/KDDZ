import { z } from "zod";

// ── Address sub-schema ──
export const employeeAddressSchema = z.object({
  street: z.string().default(""),
  city: z.string().default(""),
  region: z.string().default(""),
});

// ── Main employee form schema ──
export const employeeFormSchema = z.object({
  // Personal info
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).default(""),
  phone: z.string().default(""),
  mobile: z.string().default(""),
  nationality: z.string().default(""),
  dateOfBirth: z.string().default(""),
  hireDate: z.string().default(""),
  specialization: z.string().default(""),

  // Doctor-specific
  licenseNumber: z.string().default(""),

  // Garderie info
  branchId: z.string().min(1, "Branch is required"),
  isActive: z.boolean().default(true),

  // Address
  address: employeeAddressSchema.default({
    street: "",
    city: "",
    region: "",
  }),
});

export type EmployeeFormValues = z.input<typeof employeeFormSchema>;
