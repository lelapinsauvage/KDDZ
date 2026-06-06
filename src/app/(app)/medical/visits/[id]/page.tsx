import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import { VisitDetailClient, type VisitFormValues, type VisitStatus } from "./visit-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ childId?: string }>;
}

type JsonRecord = Record<string, unknown>;

function todayString() {
  return new Date().toISOString().split("T")[0];
}

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

function pickBoolean(data: JsonRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "yes", "on"].includes(normalized)) return true;
      if (["0", "false", "no", "off"].includes(normalized)) return false;
    }
  }
  return false;
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

function emptyFormValues(childId = ""): VisitFormValues {
  return {
    childId,
    visitDate: todayString(),
    height: "",
    weight: "",
    bp: "",
    leye: "",
    reye: "",
    leyewg: false,
    eyeprob: "",
    creye: "",
    earwl: "",
    earwr: "",
    eardl: "",
    eardr: "",
    earhl: "",
    earhr: "",
    earprob: "",
    nose: "",
    noseprob: "",
    thyriod: "",
    thprob: "",
    lymph: "",
    lymphprob: "",
    heart: "",
    arterial: "",
    heartprob: "",
    resp: "",
    respprob: "",
    bone: "",
    joint: "",
    backbone: "",
    muscle: "",
    motor: "",
    abdomen: "",
    enlarged: "",
    tumor: "",
    genitals: "",
    abdoprob: "",
    lice: "",
    derma: "",
    skin: "",
    hair: "",
    nails: "",
    skinprob: "",
    status: "DRAFT",
  };
}

function formValuesFromData(params: {
  childId: string;
  data: JsonRecord;
  status: VisitStatus;
  createdDate: string;
}): VisitFormValues {
  const { childId, data, status, createdDate } = params;
  return {
    childId,
    visitDate:
      dateString(pickString(data, "formdate", "visit_date", "visitDate")) || createdDate,
    height: pickString(data, "height", "heightCm"),
    weight: pickString(data, "weight", "weightKg"),
    bp: pickString(data, "bp", "bloodPressure"),
    leye: pickString(data, "leye", "leftEye"),
    reye: pickString(data, "reye", "rightEye"),
    leyewg: pickBoolean(data, "leyewg", "withGlasses"),
    eyeprob: pickString(data, "eyeprob", "eyesNotes"),
    creye: pickString(data, "creye", "crookedEyes"),
    earwl: pickString(data, "earwl", "waxLeft"),
    earwr: pickString(data, "earwr", "waxRight"),
    eardl: pickString(data, "eardl", "drumLeft"),
    eardr: pickString(data, "eardr", "drumRight"),
    earhl: pickString(data, "earhl", "hearingLeft"),
    earhr: pickString(data, "earhr", "hearingRight"),
    earprob: pickString(data, "earprob", "earsNotes"),
    nose: pickString(data, "nose", "noseThroat"),
    noseprob: pickString(data, "noseprob"),
    thyriod: pickString(data, "thyriod", "thyroid"),
    thprob: pickString(data, "thprob"),
    lymph: pickString(data, "lymph", "lymphNodes"),
    lymphprob: pickString(data, "lymphprob"),
    heart: pickString(data, "heart"),
    arterial: pickString(data, "arterial"),
    heartprob: pickString(data, "heartprob"),
    resp: pickString(data, "resp", "respiratory"),
    respprob: pickString(data, "respprob"),
    bone: pickString(data, "bone"),
    joint: pickString(data, "joint"),
    backbone: pickString(data, "backbone"),
    muscle: pickString(data, "muscle"),
    motor: pickString(data, "motor", "motorSystem"),
    abdomen: pickString(data, "abdomen"),
    enlarged: pickString(data, "enlarged"),
    tumor: pickString(data, "tumor"),
    genitals: pickString(data, "genitals"),
    abdoprob: pickString(data, "abdoprob", "abdomenGenitals"),
    lice: pickString(data, "lice", "liceLupus"),
    derma: pickString(data, "derma", "dermatitis"),
    skin: pickString(data, "skin", "skinAllergy"),
    hair: pickString(data, "hair"),
    nails: pickString(data, "nails"),
    skinprob: pickString(data, "skinprob", "skinNotes"),
    status,
  };
}

export default async function VisitDetailPage({ params, searchParams }: PageProps) {
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
      <VisitDetailClient
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
    <VisitDetailClient
      isNew={false}
      formId={form.id}
      formData={formValuesFromData({
        childId: form.childId,
        data,
        status: form.status as VisitStatus,
        createdDate: form.createdAt.toISOString().split("T")[0],
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
