import { z } from "zod";

// ── Branch create/edit form schema ──
export const branchFormSchema = z.object({
  name: z.string().min(1, "Branch name is required"),
  prefix: z.string().default(""),
  address: z.string().default(""),
  phone: z.string().default(""),
  telephone: z.string().default(""),
  email: z.string().email("Invalid email").or(z.literal("")).default(""),
  themeColor: z.string().default("#1caf9a"),
  isActive: z.boolean().default(true),
});

export type BranchFormValues = z.input<typeof branchFormSchema>;

// ── Compliance form schema ──
export const branchComplianceSchema = z.object({
  // Legal Entity
  entityType: z.string().default(""),
  legalName: z.string().default(""),
  organizationType: z.string().default(""),
  companySubType: z.string().default(""),
  purpose: z.string().default(""),

  // Registration
  registrationNumber: z.string().default(""),
  registrationPlace: z.string().default(""),
  registrationDate: z.string().default(""),

  // Authorized Signatory
  signatoryName: z.string().default(""),
  signatoryRole: z.string().default(""),
  signatoryNationality: z.string().default(""),
  signatoryPhone: z.string().default(""),

  // Nursery Identity
  nameArabic: z.string().default(""),
  nameLatin: z.string().default(""),

  // Address
  country: z.string().default("Lebanon"),
  governorate: z.string().default(""),
  district: z.string().default(""),
  town: z.string().default(""),
  floor: z.string().default(""),
  building: z.string().default(""),
  street: z.string().default(""),
  landmark: z.string().default(""),
  poBox: z.string().default(""),
  postalCode: z.string().default(""),
  addrPhone: z.string().default(""),
  addrMobile: z.string().default(""),
  addrFax: z.string().default(""),
  addrEmail: z.string().email("Invalid email").or(z.literal("")).default(""),
  addrWebsite: z.string().default(""),

  // Property / Lease
  ownerName: z.string().default(""),
  propertyNumber: z.string().default(""),
  propertyGovernorate: z.string().default(""),
  propertyDistrict: z.string().default(""),
  propertyRegion: z.string().default(""),
  ownershipType: z.string().default(""),

  // Management
  directorFirstName: z.string().default(""),
  directorLastName: z.string().default(""),
  directorSpecialty: z.string().default(""),
  doctorFirstName: z.string().default(""),
  doctorFatherName: z.string().default(""),
  doctorLastName: z.string().default(""),
  doctorSyndicateNo: z.string().default(""),
  doctorSpecialty: z.string().default(""),

  // Capacity
  totalChildren: z.coerce.number().int().min(0).default(0),
  walkers: z.coerce.number().int().min(0).default(0),
  nonWalkers: z.coerce.number().int().min(0).default(0),
  workingHours: z.string().default(""),

  // Insurance
  insuranceCompany: z.string().default(""),
  insuranceContractType: z.string().default(""),
});

export type BranchComplianceFormValues = z.input<typeof branchComplianceSchema>;

// Fields per section — used for progress calculation
export const complianceSections = [
  {
    id: "legal-entity",
    title: "Legal Entity",
    fields: ["entityType", "legalName", "organizationType", "companySubType", "purpose"] as const,
  },
  {
    id: "registration",
    title: "Registration",
    fields: ["registrationNumber", "registrationPlace", "registrationDate"] as const,
  },
  {
    id: "signatory",
    title: "Authorized Signatory",
    fields: ["signatoryName", "signatoryRole", "signatoryNationality", "signatoryPhone"] as const,
  },
  {
    id: "nursery-identity",
    title: "Nursery Identity",
    fields: ["nameArabic", "nameLatin"] as const,
  },
  {
    id: "address",
    title: "Address",
    fields: [
      "country", "governorate", "district", "town", "floor", "building",
      "street", "landmark", "poBox", "postalCode", "addrPhone", "addrMobile",
      "addrFax", "addrEmail", "addrWebsite",
    ] as const,
  },
  {
    id: "property",
    title: "Property / Lease",
    fields: ["ownerName", "propertyNumber", "propertyGovernorate", "propertyDistrict", "propertyRegion", "ownershipType"] as const,
  },
  {
    id: "management",
    title: "Management",
    fields: [
      "directorFirstName", "directorLastName", "directorSpecialty",
      "doctorFirstName", "doctorFatherName", "doctorLastName", "doctorSyndicateNo", "doctorSpecialty",
    ] as const,
  },
  {
    id: "capacity",
    title: "Capacity",
    fields: ["totalChildren", "walkers", "nonWalkers", "workingHours"] as const,
  },
  {
    id: "insurance",
    title: "Insurance",
    fields: ["insuranceCompany", "insuranceContractType"] as const,
  },
] as const;

/** Calculate overall completion percentage from form values */
export function calculateCompletionPercentage(
  values: Record<string, unknown>,
): number {
  const allFields = complianceSections.flatMap((s) => s.fields);
  const filled = allFields.filter((f) => {
    const v = values[f];
    if (typeof v === "number") return v > 0;
    return typeof v === "string" && v.trim().length > 0;
  });
  return allFields.length === 0
    ? 0
    : Math.round((filled.length / allFields.length) * 100);
}

/** Calculate per-section completion */
export function calculateSectionCompletion(
  values: Record<string, unknown>,
): Record<string, { filled: number; total: number; percent: number }> {
  const result: Record<string, { filled: number; total: number; percent: number }> = {};
  for (const section of complianceSections) {
    const filled = section.fields.filter((f) => {
      const v = values[f];
      if (typeof v === "number") return v > 0;
      return typeof v === "string" && v.trim().length > 0;
    }).length;
    result[section.id] = {
      filled,
      total: section.fields.length,
      percent: Math.round((filled / section.fields.length) * 100),
    };
  }
  return result;
}
