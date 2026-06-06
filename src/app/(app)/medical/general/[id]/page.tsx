import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import {
  GeneralDetailClient,
  type GeneralDoctorOption,
  type GeneralDoctorRow,
  type GeneralFormValues,
  type MedicalStatusRow,
  type MedicationStatusRow,
} from "./general-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ childId?: string }>;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return "";
}

function pickString(data: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = stringValue(data[key]);
    if (value) return value;
  }
  return "";
}

function pickNumber(data: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function todayString() {
  return new Date().toISOString().split("T")[0];
}

function rowDate(value: string) {
  if (!value) return todayString();
  return value.split("T")[0];
}

function optionalDate(value: string) {
  if (!value) return "";
  return value.split("T")[0];
}

function rowsFromData(
  data: JsonRecord,
  key: string,
  typeKeys: string[],
  dateKeys: string[],
): MedicalStatusRow[] {
  const value = data[key];
  if (!Array.isArray(value)) return [];

  return value
    .map((row, index) => {
      if (!isRecord(row)) return null;
      return {
        id: `${key}-${index + 1}`,
        type: pickString(row, ...typeKeys),
        date: rowDate(pickString(row, ...dateKeys)),
      };
    })
    .filter((row): row is MedicalStatusRow => Boolean(row));
}

function medicationRowsFromData(data: JsonRecord): MedicationStatusRow[] {
  const value = data.med_values;
  if (!Array.isArray(value)) return [];

  return value
    .map((row, index) => {
      if (!isRecord(row)) return null;
      return {
        id: `medication-${index + 1}`,
        type: pickString(row, "Medtype", "type", "medname"),
        date: rowDate(pickString(row, "Meddate", "date", "meddate")),
        time: pickString(row, "Medtime", "time", "medtime"),
        expiry: optionalDate(pickString(row, "Medtimeexp", "expiry", "medtimeexp")),
      };
    })
    .filter((row): row is MedicationStatusRow => Boolean(row));
}

function rowsFromEntries(
  entries: Array<{ field: string; value: string | null; legacyData: unknown }>,
  medtype: string,
  keyPrefix: string,
): MedicalStatusRow[] {
  return entries
    .filter((entry) => {
      const legacy = isRecord(entry.legacyData) ? entry.legacyData : {};
      const field = stringValue(legacy.medtype || entry.field).toLowerCase();
      return field === medtype;
    })
    .map((entry, index) => {
      const legacy = isRecord(entry.legacyData) ? entry.legacyData : {};
      return {
        id: `${keyPrefix}-${index + 1}`,
        type: pickString(legacy, "medname", "medcase", "medcomment") || stringValue(entry.value),
        date: rowDate(pickString(legacy, "meddate", "date")),
      };
    });
}

function medicationRowsFromEntries(
  entries: Array<{ field: string; value: string | null; legacyData: unknown }>,
): MedicationStatusRow[] {
  return entries
    .filter((entry) => {
      const legacy = isRecord(entry.legacyData) ? entry.legacyData : {};
      const field = stringValue(legacy.medtype || entry.field).toLowerCase();
      return field === "medic";
    })
    .map((entry, index) => {
      const legacy = isRecord(entry.legacyData) ? entry.legacyData : {};
      return {
        id: `medication-${index + 1}`,
        type: pickString(legacy, "medname", "medcase", "medcomment") || stringValue(entry.value),
        date: rowDate(pickString(legacy, "meddate", "date")),
        time: pickString(legacy, "medtime", "time"),
        expiry: optionalDate(pickString(legacy, "expiry", "medtimeexp")),
      };
    });
}

function doctorRowsFromData(data: JsonRecord): GeneralDoctorRow[] {
  const addressValues = data.address_values;
  if (Array.isArray(addressValues) && addressValues.length > 0) {
    return addressValues
      .map((row, index) => {
        if (!isRecord(row)) return null;
        return {
          id: `doctor-${index + 1}`,
          firstName: pickString(row, "Dfname", "firstName", "fdfname", "dfname"),
          lastName: pickString(row, "Dlname", "lastName", "fdlname", "dlname"),
          mouhafaza: pickString(row, "Mouhafaza", "muhafaza", "governorate"),
          quadaa: pickString(row, "Quadaa", "quadaa", "district"),
          region: pickString(row, "Region", "region"),
          city: pickString(row, "City", "city"),
          street: pickString(row, "Street", "street"),
          building: pickString(row, "Building", "building"),
          phone: pickString(row, "Address_phone", "phone", "tel", "telephone"),
          remarks: pickString(row, "Address_remarks", "remarks"),
          latitude: pickString(row, "Latitude", "latitude"),
          longitude: pickString(row, "Longitude", "longitude"),
        };
      })
      .filter((row): row is GeneralDoctorRow => Boolean(row));
  }

  return [
    {
      id: "doctor-1",
      firstName: pickString(data, "fdfname", "dfname", "doctorFirstName"),
      lastName: pickString(data, "fdlname", "dlname", "doctorLastName"),
      mouhafaza: pickString(data, "muhafaza", "Mouhafaza", "governorate"),
      quadaa: pickString(data, "quadaa", "Quadaa", "district"),
      region: pickString(data, "region", "Region"),
      city: pickString(data, "city", "City"),
      street: pickString(data, "street", "Street"),
      building: pickString(data, "building", "Building"),
      phone: pickString(data, "tel", "Address_phone", "phone", "telephone"),
      remarks: pickString(data, "remarks", "Address_remarks"),
      latitude: pickString(data, "latitude", "Latitude"),
      longitude: pickString(data, "longitude", "Longitude"),
    },
  ];
}

function insuranceChoice(data: JsonRecord): "" | "Yes" | "No" {
  const raw = pickString(data, "has_insurance", "hasInsurance", "has_ins");
  if (raw === "Yes" || raw === "true" || raw === "1") return "Yes";
  if (raw === "No" || raw === "false" || raw === "0") return "No";
  return "";
}

function defaultStatusRows(prefix: string): MedicalStatusRow[] {
  return [{ id: `${prefix}-1`, type: "", date: todayString() }];
}

function defaultMedicationRows(): MedicationStatusRow[] {
  return [{ id: "medication-1", type: "", date: todayString(), time: "", expiry: "" }];
}

function initialFormValues(params: {
  childId: string;
  data: JsonRecord;
  entries: Array<{ field: string; value: string | null; legacyData: unknown }>;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
}): GeneralFormValues {
  const { childId, data, entries, status } = params;
  const disabilityRows = rowsFromData(
    data,
    "relative_values",
    ["Distype", "type", "medname"],
    ["Disdate", "date", "meddate"],
  );
  const disabilityEntryRows = rowsFromEntries(entries, "disability", "disability");
  const medicalCaseRows = rowsFromData(
    data,
    "case_values",
    ["Casetype", "type", "medname"],
    ["Casedate", "date", "meddate"],
  );
  const medicalCaseEntryRows = rowsFromEntries(entries, "medcase", "medical-case");
  const surgicalRows = rowsFromData(
    data,
    "surg_values",
    ["Surgtype", "type", "medname"],
    ["Surgdate", "date", "meddate"],
  );
  const surgicalEntryRows = rowsFromEntries(entries, "surg", "surgical");
  const allergyRows = rowsFromData(
    data,
    "allerg_values",
    ["Allergtype", "type", "medname"],
    ["Allergdate", "date", "meddate"],
  );
  const allergyEntryRows = rowsFromEntries(entries, "allergy", "allergy");
  const medicationRows = medicationRowsFromData(data);
  const medicationEntryRows = medicationRowsFromEntries(entries);

  return {
    childId,
    hasInsurance: insuranceChoice(data),
    insuranceType: pickString(data, "insurance", "ins", "insuranceType"),
    insuranceExpiry: optionalDate(pickString(data, "ins_expdate", "insexp", "insuranceExpiry")),
    doctorRows: doctorRowsFromData(data),
    disabilityRows: disabilityRows.length
      ? disabilityRows
      : disabilityEntryRows.length
        ? disabilityEntryRows
        : defaultStatusRows("disability"),
    medicalCaseRows: medicalCaseRows.length
      ? medicalCaseRows
      : medicalCaseEntryRows.length
        ? medicalCaseEntryRows
        : defaultStatusRows("medical-case"),
    medicationRows: medicationRows.length
      ? medicationRows
      : medicationEntryRows.length
        ? medicationEntryRows
        : defaultMedicationRows(),
    surgicalRows: surgicalRows.length
      ? surgicalRows
      : surgicalEntryRows.length
        ? surgicalEntryRows
        : defaultStatusRows("surgical"),
    allergyRows: allergyRows.length
      ? allergyRows
      : allergyEntryRows.length
        ? allergyEntryRows
        : defaultStatusRows("allergy"),
    status,
  };
}

export default async function GeneralMedicalDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { childId: requestedChildId }] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const { organizationId: orgId } = await requireOrg();

  const [children, doctors] = await Promise.all([
    db.child.findMany({
      where: { isActive: true, branch: { organizationId: orgId } },
      select: {
        id: true,
        legacyId: true,
        childNumber: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
        photo: true,
        branchId: true,
        classId: true,
        branch: { select: { id: true, name: true, legacyId: true } },
        class: { select: { id: true, name: true, legacyId: true } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    db.doctor.findMany({
      where: { isActive: true, branch: { organizationId: orgId } },
      include: {
        branch: { select: { id: true, name: true } },
        addresses: { take: 1, orderBy: { createdAt: "asc" } },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  const childOptions = children.map((child) => ({
    id: child.id,
    legacyId: child.legacyId,
    name: `${child.firstName} ${child.lastName}`,
    childNumber: child.childNumber ?? child.legacyId?.toString() ?? "-",
    dateOfBirth: child.dateOfBirth?.toISOString().split("T")[0] ?? "",
    gender: child.gender ?? "",
    photo: child.photo ?? null,
    branchId: child.branchId,
    branchName: child.branch?.name ?? "-",
    branchLegacyId: child.branch?.legacyId ?? null,
    classId: child.classId ?? null,
    className: child.class?.name ?? "",
    classLegacyId: child.class?.legacyId ?? null,
  }));

  const doctorOptions: GeneralDoctorOption[] = doctors.map((doctor) => {
    const legacy = isRecord(doctor.legacyData) ? doctor.legacyData : {};
    const address = doctor.addresses[0];
    return {
      id: doctor.id,
      legacyId: doctor.legacyId,
      name: `${doctor.firstName} ${doctor.lastName}`,
      branchId: doctor.branchId,
      firstName: pickString(legacy, "dfname") || doctor.firstName,
      lastName: pickString(legacy, "dlname") || doctor.lastName,
      mouhafaza: pickString(legacy, "muhafaza", "Mouhafaza") || (address?.governorate ?? ""),
      quadaa: pickString(legacy, "quadaa", "Quadaa") || (address?.district ?? ""),
      region: pickString(legacy, "region", "Region") || (address?.region ?? ""),
      city: pickString(legacy, "city", "City") || (address?.city ?? ""),
      street: pickString(legacy, "street", "Street") || (address?.street ?? ""),
      building: pickString(legacy, "building", "Building") || (address?.building ?? ""),
      phone: pickString(legacy, "tel", "Address_phone") || doctor.telephone || doctor.phone || doctor.mobile || "",
      remarks: pickString(legacy, "remarks", "Address_remarks") || (doctor.remarks ?? ""),
      latitude: pickString(legacy, "latitude", "Latitude"),
      longitude: pickString(legacy, "longitude", "Longitude"),
    };
  });

  if (isNew) {
    const initialData: GeneralFormValues = {
      childId: requestedChildId ?? "",
      hasInsurance: "",
      insuranceType: "",
      insuranceExpiry: "",
      doctorRows: doctorRowsFromData({}),
      disabilityRows: defaultStatusRows("disability"),
      medicalCaseRows: defaultStatusRows("medical-case"),
      medicationRows: defaultMedicationRows(),
      surgicalRows: defaultStatusRows("surgical"),
      allergyRows: defaultStatusRows("allergy"),
      status: "DRAFT",
    };

    return (
      <GeneralDetailClient
        isNew
        formId={null}
        formData={initialData}
        initialData={{}}
        childrenList={childOptions}
        doctorList={doctorOptions}
        initialAttachments={[]}
      />
    );
  }

  const result = await getMedicalForm(id);

  if ("error" in result && result.error) {
    notFound();
  }

  const form = result.form!;
  const data = (form.data ?? {}) as JsonRecord;

  if (!childOptions.some((child) => child.id === form.childId)) {
    childOptions.unshift({
      id: form.childId,
      legacyId: form.child.legacyId ?? null,
      name: `${form.child.firstName} ${form.child.lastName}`,
      childNumber: form.child.childNumber ?? form.child.legacyId?.toString() ?? "-",
      dateOfBirth: form.child.dateOfBirth?.toISOString().split("T")[0] ?? "",
      gender: form.child.gender ?? "",
      photo: form.child.photo ?? null,
      branchId: form.child.branchId,
      branchName: form.child.branch?.name ?? "-",
      branchLegacyId: form.child.branch?.legacyId ?? null,
      classId: form.child.classId ?? null,
      className: form.child.class?.name ?? "",
      classLegacyId: form.child.class?.legacyId ?? null,
    });
  }

  const formData = initialFormValues({
    childId: form.childId,
    data,
    entries: form.entries.map((entry) => ({
      field: entry.field,
      value: entry.value,
      legacyData: entry.legacyData,
    })),
    status: form.status as "DRAFT" | "SUBMITTED" | "REVIEWED",
  });

  return (
    <GeneralDetailClient
      isNew={false}
      formId={form.id}
      formData={formData}
      initialData={data}
      childrenList={childOptions}
      doctorList={doctorOptions}
      initialAttachments={form.attachments.map((attachment) => ({
        id: attachment.id,
        title: attachment.title ?? "",
        filename: attachment.filename,
        fileUrl: attachment.fileUrl,
      }))}
      legacyFormId={pickNumber(data, "form_id", "_oldId")}
    />
  );
}
