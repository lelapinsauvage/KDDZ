import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import {
  VaccinationDetailClient,
  type VaccinationFormStatus,
  type VaccinationFormValues,
} from "./vaccination-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ childId?: string }>;
}

type JsonRecord = Record<string, unknown>;

const vaccineFields = [
  "hepdate",
  "hep",
  "ipvdate",
  "ipv",
  "opvdate1",
  "opv1",
  "opvdate2",
  "opv2",
  "opvdate3",
  "opv3",
  "opvdate4",
  "opv4",
  "opvdate5",
  "opv5",
  "dptdate1",
  "dpt1",
  "dptdate2",
  "dpt2",
  "dptdate3",
  "dpt3",
  "dptdate4",
  "dpt4",
  "hasbedate1",
  "hasbe1",
  "mmrdate1",
  "mmr1",
  "mmrdate2",
  "mmr2",
  "ndptdate",
  "ndpt",
  "dtdate1",
  "dt1",
] as const;

function stringValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return value.toString();
  if (typeof value === "boolean") return value ? "1" : "0";
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

function dateString(value: string) {
  if (!value) return "";
  const isoDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDate) return isoDate[1];

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return value;
}

function emptyFormValues(childId = ""): VaccinationFormValues {
  return {
    childId,
    hepdate: "",
    hep: "",
    ipvdate: "",
    ipv: "",
    opvdate1: "",
    opv1: "",
    opvdate2: "",
    opv2: "",
    opvdate3: "",
    opv3: "",
    opvdate4: "",
    opv4: "",
    opvdate5: "",
    opv5: "",
    dptdate1: "",
    dpt1: "",
    dptdate2: "",
    dpt2: "",
    dptdate3: "",
    dpt3: "",
    dptdate4: "",
    dpt4: "",
    hasbedate1: "",
    hasbe1: "",
    mmrdate1: "",
    mmr1: "",
    mmrdate2: "",
    mmr2: "",
    ndptdate: "",
    ndpt: "",
    dtdate1: "",
    dt1: "",
    status: "DRAFT",
  };
}

function formValuesFromData(params: {
  childId: string;
  data: JsonRecord;
  status: VaccinationFormStatus;
}): VaccinationFormValues {
  const base = emptyFormValues(params.childId);
  vaccineFields.forEach((field) => {
    base[field] = field.includes("date")
      ? dateString(pickString(params.data, field))
      : pickString(params.data, field);
  });
  base.status = params.status;
  return base;
}

export default async function VaccinationDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, { childId: requestedChildId }] = await Promise.all([params, searchParams]);
  const isNew = id === "new";
  const { organizationId: orgId } = await requireOrg();

  const children = await db.child.findMany({
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
  });

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

  if (isNew) {
    return (
      <VaccinationDetailClient
        isNew
        formId={null}
        formData={emptyFormValues(requestedChildId ?? "")}
        initialData={{}}
        childrenList={childOptions}
        initialAttachments={[]}
      />
    );
  }

  const result = await getMedicalForm(id);

  if ("error" in result && result.error) {
    notFound();
  }

  const form = result.form!;
  if (form.formType !== "VACCINATIONS") {
    notFound();
  }

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

  return (
    <VaccinationDetailClient
      isNew={false}
      formId={form.id}
      formData={formValuesFromData({
        childId: form.childId,
        data,
        status: form.status as VaccinationFormStatus,
      })}
      initialData={data}
      childrenList={childOptions}
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
