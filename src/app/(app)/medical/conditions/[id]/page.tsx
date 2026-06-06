import { notFound } from "next/navigation";
import { getMedicalForm } from "@/lib/actions/medical";
import { db } from "@/lib/db";
import { requireOrg } from "@/lib/require-org";
import {
  ConditionDetailClient,
  type ConditionAssessmentRow,
  type ConditionFormValues,
  type ConditionGroupKey,
  type ConditionStatus,
} from "./condition-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ childId?: string }>;
}

type JsonRecord = Record<string, unknown>;
type EntryForHydration = {
  field: string;
  value: string | null;
  legacyData: unknown;
};

const conditionGroupKeys: ConditionGroupKey[] = [
  "hearing",
  "speaking",
  "sight",
  "respiration",
  "worms",
  "heart",
  "arteries",
  "urine",
  "epilepsy",
  "migraine",
  "eating",
  "blood",
  "health",
];

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

function rowDate(value: string) {
  return dateString(value) || todayString();
}

function valuePart(value: string | null, label: string) {
  if (!value) return "";
  const prefix = `${label}:`;
  const part = value
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.toLowerCase().startsWith(prefix));
  return part ? part.slice(prefix.length).trim() : "";
}

function legacyRowsFromArray(value: unknown, key: ConditionGroupKey): ConditionAssessmentRow[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((row, index) => {
      if (!isRecord(row)) return null;
      return {
        id: `${key}-${index + 1}`,
        result: pickString(row, "Asstype", "asstype", "medname", "result") as ConditionAssessmentRow["result"],
        caseValue: pickString(row, "Asscas", "asscas", "medcase", "caseValue", "case"),
        remarks: pickString(row, "Remarks", "remarks"),
        date: rowDate(pickString(row, "Assdate", "assdate", "meddate", "date")),
      };
    })
    .filter((row): row is ConditionAssessmentRow => Boolean(row));
}

function rowsFromData(data: JsonRecord, key: ConditionGroupKey) {
  const legacyRows = legacyRowsFromArray(data[`${key}_values`], key);
  if (legacyRows.length) return legacyRows;

  const modernGroups = isRecord(data.assessmentGroups)
    ? data.assessmentGroups
    : isRecord(data.conditionAssessmentGroups)
      ? data.conditionAssessmentGroups
      : null;

  return modernGroups ? legacyRowsFromArray(modernGroups[key], key) : [];
}

function rowsFromEntries(entries: EntryForHydration[], key: ConditionGroupKey) {
  return entries
    .filter((entry) => {
      const legacy = isRecord(entry.legacyData) ? entry.legacyData : {};
      const field = pickString(legacy, "medtype") || stringValue(entry.field);
      return field.toLowerCase() === key;
    })
    .map((entry, index) => {
      const legacy = isRecord(entry.legacyData) ? entry.legacyData : {};
      return {
        id: `${key}-entry-${index + 1}`,
        result:
          (pickString(legacy, "medname", "Asstype", "asstype") ||
            valuePart(entry.value, "name") ||
            stringValue(entry.value)) as ConditionAssessmentRow["result"],
        caseValue:
          pickString(legacy, "medcase", "Asscas", "asscas") ||
          valuePart(entry.value, "case"),
        remarks:
          pickString(legacy, "remarks", "Remarks") ||
          valuePart(entry.value, "remarks"),
        date: rowDate(
          pickString(legacy, "meddate", "Assdate", "assdate", "date") ||
            valuePart(entry.value, "date"),
        ),
      };
    });
}

function defaultAssessmentRows(key: ConditionGroupKey): ConditionAssessmentRow[] {
  return [
    {
      id: `${key}-1`,
      result: "",
      caseValue: "",
      remarks: "",
      date: todayString(),
    },
  ];
}

function initialFormValues(params: {
  childId: string;
  data: JsonRecord;
  entries: EntryForHydration[];
  status: ConditionStatus;
  createdDate: string;
}): ConditionFormValues {
  const { childId, data, entries, status, createdDate } = params;
  const groups = Object.fromEntries(
    conditionGroupKeys.map((key) => {
      const dataRows = rowsFromData(data, key);
      const entryRows = rowsFromEntries(entries, key);
      return [
        key,
        dataRows.length
          ? dataRows
          : entryRows.length
            ? entryRows
            : defaultAssessmentRows(key),
      ];
    }),
  ) as Record<ConditionGroupKey, ConditionAssessmentRow[]>;

  return {
    childId,
    assessmentDate:
      dateString(pickString(data, "formdate", "asses_date", "assessmentDate", "diagnosisDate")) ||
      createdDate ||
      todayString(),
    generalHealth: pickString(data, "assess", "general_health", "generalHealth", "severity"),
    groups,
    status,
  };
}

export default async function ConditionDetailPage({ params, searchParams }: PageProps) {
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
      <ConditionDetailClient
        isNew
        formId={null}
        formData={initialFormValues({
          childId: requestedChildId ?? "",
          data: {},
          entries: [],
          status: "DRAFT",
          createdDate: todayString(),
        })}
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
    <ConditionDetailClient
      isNew={false}
      formId={form.id}
      formData={initialFormValues({
        childId: form.childId,
        data,
        entries: form.entries.map((entry) => ({
          field: entry.field,
          value: entry.value,
          legacyData: entry.legacyData,
        })),
        status: form.status as ConditionStatus,
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
