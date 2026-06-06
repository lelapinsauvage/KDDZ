import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getMedicalForms, getOrgStaffList } from "@/lib/actions/medical";
import { AccidentsClient } from "./accidents-client";

interface Props {
  params: Promise<{ id: string }>;
}

function valueAsString(...values: unknown[]) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    if (typeof value === "boolean") return value ? "Yes" : "";
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value);
  }
  return "";
}

function valueAsDate(value: unknown, fallback: Date) {
  const raw = valueAsString(value);
  if (!raw) return fallback.toISOString().slice(0, 10);
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw.slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

export default async function ChildAccidentsPage({ params }: Props) {
  const { id } = await params;

  const [child, { forms }, staffList] = await Promise.all([
    getChild(id),
    getMedicalForms({ childId: id, formType: "ACCIDENTS" }),
    getOrgStaffList(),
  ]);

  if (!child) {
    notFound();
  }

  const childData = {
    id: child.id,
    branchId: child.branchId,
    firstName: child.firstName,
    lastName: child.lastName,
    photo: child.photo ?? null,
  };

  const staffById = new Map(
    staffList.map((staff) => [staff.id, staff.name ?? staff.email]),
  );

  const accidents = forms.map((form) => {
    const data = (form.data ?? {}) as Record<string, unknown>;
    const teacherId = valueAsString(data.teacherId, data.teacher_id);
    const legacyTeacherName = [data.f_name, data.l_name]
      .map((part) => valueAsString(part))
      .filter(Boolean)
      .join(" ");

    return {
      id: form.id,
      date: valueAsDate(valueAsString(data.accident_date, data.date), form.createdAt),
      time: valueAsString(data.accident_time, data.time),
      cause: valueAsString(data.cause, data.accidentCause),
      location: valueAsString(data.place, data.location),
      specifyArea: valueAsString(data.area, data.specifyArea),
      cameraNumber: valueAsString(data.camnum, data.cameraNumber),
      firstAid: valueAsString(data.firstaid, data.firstAid, data.firstAidGiven),
      teacher: staffById.get(teacherId) ?? (legacyTeacherName || teacherId),
      emergencyHospital: valueAsString(data.em_hospital, data.emergencyHospital),
      treatment: valueAsString(data.treatment),
      status: form.status,
      createdBy: form.createdBy?.name ?? form.createdBy?.email ?? null,
      attachments: (form.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        fileUrl: attachment.fileUrl,
      })),
    };
  });

  return (
    <AccidentsClient
      child={childData}
      accidents={accidents}
      staffList={staffList}
    />
  );
}
