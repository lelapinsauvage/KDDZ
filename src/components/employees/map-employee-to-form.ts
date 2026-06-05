import type { EmployeeFormValues } from "@/lib/validations/employee";

const DOCUMENT_TYPES = new Set([
  "CONTRACT",
  "MEDICAL_TEST",
  "FIRST_AID",
  "CERTIFICATE",
  "ATTACHMENT",
]);

function fmtDate(d: unknown): string {
  if (!d) return "";
  try {
    return new Date(d as string | number).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function documentType(value: unknown): EmployeeFormValues["documents"][number]["type"] {
  return typeof value === "string" && DOCUMENT_TYPES.has(value)
    ? (value as EmployeeFormValues["documents"][number]["type"])
    : "ATTACHMENT";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapEmployeeToForm(emp: any): EmployeeFormValues & { id: string } {
  const address = emp.addresses?.[0];
  const employeeDocuments = emp.documents ?? emp.attachments ?? [];

  return {
    id: emp.id,
    username: emp.username ?? "",
    firstName: emp.firstName ?? "",
    lastName: emp.lastName ?? "",
    dateOfBirth: fmtDate(emp.dateOfBirth),
    placeOfBirth: emp.placeOfBirth ?? "",
    registerNumber: emp.registerNumber ?? "",
    nationality: emp.nationality ?? "",
    maritalStatus: emp.maritalStatus ?? "",
    numberOfChildren: emp.numberOfChildren ?? 0,
    gender: emp.gender ?? "",
    medicalCase: emp.medicalCase ?? false,
    medicalCaseDescription: emp.medicalCaseDescription ?? "",
    phone: emp.phone ?? "",
    telephone: emp.telephone ?? "",
    mobile: emp.mobile ?? "",
    email: emp.email ?? "",
    cnss: emp.cnss ?? "",
    cnssNo: emp.cnssNo ?? "",
    secondaryDegree: emp.secondaryDegree ?? "",
    secondaryDegreeYear: emp.secondaryDegreeYear ?? "",
    universityDegree: emp.universityDegree ?? "",
    universityDegreeYear: emp.universityDegreeYear ?? "",
    licenseNumber: emp.licenseNumber ?? "",
    hireDate: fmtDate(emp.hireDate),
    specialization: emp.specialization ?? "",
    branchId: emp.branchId ?? "",
    classId: emp.classId ?? "",
    isActive: emp.isActive ?? true,
    remarks: emp.remarks ?? "",
    address: {
      governorate: address?.governorate ?? "",
      district: address?.district ?? "",
      region: address?.region ?? "",
      city: address?.city ?? "",
      street: address?.street ?? "",
      building: address?.building ?? "",
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    languages: (emp.languages ?? []).map((l: any) => ({
      language: l.language,
      canRead: l.canRead ?? "NONE",
      canWrite: l.canWrite ?? "NONE",
      canSpeak: l.canSpeak ?? "NONE",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experiences: (emp.experiences ?? []).map((e: any) => ({
      type: e.type,
      company: e.company ?? "",
      position: e.position ?? "",
      fromDate: fmtDate(e.fromDate),
      toDate: fmtDate(e.toDate),
      description: e.description ?? "",
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    documents: employeeDocuments.map((d: any) => ({
      id: d.id,
      type: documentType(d.type),
      title: d.title ?? d.filename ?? "",
      date: fmtDate(d.date),
      expiryDate: fmtDate(d.expiryDate),
      fileUrl: d.fileUrl ?? "",
    })),
  };
}
