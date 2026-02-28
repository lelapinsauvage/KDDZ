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
  // Section A: Legal Entity Type
  entityType: z.string().default(""),

  // Section B: Owner Info
  ownerFirstName: z.string().default(""),
  ownerFatherName: z.string().default(""),
  ownerFamilyName: z.string().default(""),
  ownerMotherName: z.string().default(""),
  ownerMotherMaidenName: z.string().default(""),
  ownerDob: z.string().default(""),
  ownerPlaceOfBirth: z.string().default(""),
  ownerNationality: z.string().default(""),
  ownerRegistryNumber: z.string().default(""),

  // Section C: Nursery Identity
  nameArabic: z.string().default(""),
  nameLatin: z.string().default(""),

  // Section D: Nursery Address
  governorate: z.string().default(""),
  district: z.string().default(""),
  town: z.string().default(""),
  realEstateArea: z.string().default(""),
  propertyNumber: z.string().default(""),
  addressSection: z.string().default(""),
  street: z.string().default(""),
  building: z.string().default(""),
  floor: z.string().default(""),
  addrPhone: z.string().default(""),
  addrFax: z.string().default(""),
  addrEmail: z.string().email("Invalid email").or(z.literal("")).default(""),
  postalCode: z.string().default(""),

  // Section E: Property / Lease
  ownershipType: z.string().default(""),
  ownerName: z.string().default(""),
  propertyGovernorate: z.string().default(""),
  propertyDistrict: z.string().default(""),
  propertyRegion: z.string().default(""),

  // Section F: Management
  directorFirstName: z.string().default(""),
  directorLastName: z.string().default(""),
  directorSpecialty: z.string().default(""),
  doctorFirstName: z.string().default(""),
  doctorFatherName: z.string().default(""),
  doctorLastName: z.string().default(""),
  doctorSyndicateNo: z.string().default(""),
  doctorSpecialty: z.string().default(""),

  // Section G: Capacity
  totalChildren: z.coerce.number().default(0),
  walkers: z.coerce.number().default(0),
  nonWalkers: z.coerce.number().default(0),
  workingHours: z.string().default(""),

  // Section H: Insurance
  insuranceCompany: z.string().default(""),
  insuranceContractType: z.string().default(""),
});

export type BranchComplianceFormValues = z.input<typeof branchComplianceSchema>;

// Fields per section — used for progress calculation
export const complianceSections = [
  {
    id: "legal-entity",
    title: "نوع الشخصية القانونية",
    fields: ["entityType"] as const,
  },
  {
    id: "owner-info",
    title: "معلومات عن صاحب العلاقة",
    fields: [
      "ownerFirstName", "ownerFatherName", "ownerFamilyName",
      "ownerMotherName", "ownerMotherMaidenName", "ownerDob",
      "ownerPlaceOfBirth", "ownerNationality", "ownerRegistryNumber",
    ] as const,
  },
  {
    id: "nursery-name",
    title: "اسم الحضانة",
    fields: ["nameArabic", "nameLatin"] as const,
  },
  {
    id: "nursery-address",
    title: "عنوان الحضانة",
    fields: [
      "governorate", "district", "town", "realEstateArea",
      "propertyNumber", "addressSection", "street", "building",
      "floor", "addrPhone", "addrFax", "addrEmail", "postalCode",
    ] as const,
  },
  {
    id: "property-lease",
    title: "الملكية أو سند الإيجار المصدق",
    fields: [
      "ownershipType", "ownerName", "propertyGovernorate",
      "propertyDistrict", "propertyRegion",
    ] as const,
  },
  {
    id: "management",
    title: "الإدارة",
    fields: [
      "directorFirstName", "directorLastName", "directorSpecialty",
      "doctorFirstName", "doctorFatherName", "doctorLastName",
      "doctorSyndicateNo", "doctorSpecialty",
    ] as const,
  },
  {
    id: "capacity",
    title: "السعة",
    fields: [
      "totalChildren", "walkers", "nonWalkers", "workingHours",
    ] as const,
  },
  {
    id: "insurance",
    title: "الضمان",
    fields: [
      "insuranceCompany", "insuranceContractType",
    ] as const,
  },
  {
    id: "staff-compliance",
    title: "مستندات الموظفين",
    fields: [] as const,
  },
  {
    id: "ministry-attachments",
    title: "المستندات المطلوبة",
    fields: [] as const,
  },
] as const;

/** Calculate overall completion percentage from form values */
export function calculateCompletionPercentage(
  values: Record<string, unknown>,
): number {
  const allFields = complianceSections.flatMap((s) => s.fields);
  if (allFields.length === 0) return 0;
  const filled = allFields.filter((f) => {
    const v = values[f];
    if (typeof v === "number") return v > 0;
    return typeof v === "string" && v.trim().length > 0;
  });
  return Math.round((filled.length / allFields.length) * 100);
}

/** Calculate per-section completion */
export function calculateSectionCompletion(
  values: Record<string, unknown>,
): Record<string, { filled: number; total: number; percent: number }> {
  const result: Record<string, { filled: number; total: number; percent: number }> = {};
  for (const section of complianceSections) {
    if (section.fields.length === 0) {
      // Sections E/F don't have form fields — always show as N/A
      result[section.id] = { filled: 0, total: 0, percent: 0 };
      continue;
    }
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
