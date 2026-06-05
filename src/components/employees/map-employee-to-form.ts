import type { EmployeeFormValues } from "@/lib/validations/employee";

type LooseRow = Record<string, unknown>;

const DOCUMENT_TYPES = new Set([
  "CONTRACT",
  "MEDICAL_TEST",
  "FIRST_AID",
  "CERTIFICATE",
  "ATTACHMENT",
]);

const fileRowId = (source: "attachment" | "document", id: unknown): string | undefined =>
  typeof id === "string" && id ? `${source}:${id}` : undefined;

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
  const employeeAttachments = (emp.attachments ?? []).map((attachment: LooseRow) => ({
    id: fileRowId("attachment", attachment.id),
    type: documentType(attachment.type),
    title: typeof attachment.title === "string"
      ? attachment.title
      : typeof attachment.filename === "string"
        ? attachment.filename
        : "",
    date: "",
    expiryDate: fmtDate(attachment.expiryDate),
    fileUrl: typeof attachment.fileUrl === "string" ? attachment.fileUrl : "",
  }));
  const employeeDocuments = (emp.documents ?? []).map((document: LooseRow) => ({
    id: fileRowId("document", document.id),
    type: documentType(document.type),
    title: typeof document.title === "string" ? document.title : "",
    date: fmtDate(document.date),
    expiryDate: fmtDate(document.expiryDate),
    fileUrl: typeof document.fileUrl === "string" ? document.fileUrl : "",
  }));

  return {
    id: emp.id,
    username: emp.username ?? "",
    firstName: emp.firstName ?? "",
    lastName: emp.lastName ?? "",
    imageUrl: emp.imageUrl ?? "",
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
    documents: [...employeeAttachments, ...employeeDocuments],
  };
}
