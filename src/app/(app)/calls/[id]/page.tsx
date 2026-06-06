import { notFound } from "next/navigation";
import {
  getCallCauseOptions,
  getCallLogDetail,
  getCallStaffOptions,
} from "@/lib/actions/calls";
import {
  CallDetailClient,
  type StandaloneCallDetail,
} from "./call-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ legacyChild?: string }>;
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateTime(date: Date) {
  return date.toISOString().replace("T", " ").slice(0, 16);
}

function legacyObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function legacyNumber(data: Record<string, unknown>, ...keys: string[]) {
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

export default async function StandaloneCallPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, { legacyChild }] = await Promise.all([params, searchParams]);

  const [call, staffList, callCauseOptions] = await Promise.all([
    getCallLogDetail(id, { legacyChildId: legacyChild }),
    getCallStaffOptions(),
    getCallCauseOptions(),
  ]);

  if (!call) {
    notFound();
  }

  const legacyData = legacyObject(call.legacyData);
  const legacyTeacherId =
    call.legacyTeacherId ?? legacyNumber(legacyData, "teacher_id");
  const teacher =
    staffList.find((staff) => staff.id === call.staffId) ??
    staffList.find((staff) => staff.legacyId === legacyTeacherId);
  const progress = legacyNumber(legacyData, "f_progress") ?? (call.isDraft ? 0 : 1);

  const detail: StandaloneCallDetail = {
    id: call.id,
    legacyId: call.legacyId,
    sourceDatabase: call.sourceDatabase,
    childId: call.childId,
    childName: `${call.child.firstName} ${call.child.lastName}`.trim(),
    childNumber: call.child.childNumber ?? call.child.legacyId?.toString() ?? "-",
    childPhoto: call.child.photo ?? null,
    legacyChildId: call.legacyChildId ?? call.child.legacyId,
    branchId: call.child.branchId,
    branchName: call.child.branch?.name ?? "",
    legacyBranchId: call.legacyBranchId ?? call.child.branch?.legacyId ?? null,
    className: call.child.class?.name ?? null,
    legacyClassId: call.legacyClassId ?? call.child.class?.legacyId ?? null,
    direction: call.direction,
    date: call.date.toISOString().slice(0, 10),
    time: formatTime(call.time),
    reason: call.reason ?? "",
    subject: call.subject ?? "",
    remarks: call.remarks ?? "",
    staffId: call.staffId ?? "",
    teacherName: teacher?.name ?? teacher?.email ?? null,
    legacyTeacherId,
    createdBy: call.createdBy?.name ?? call.createdBy?.email ?? null,
    isDraft: call.isDraft,
    progress,
    createdAt: formatDateTime(call.createdAt),
    updatedAt: formatDateTime(call.updatedAt),
    attachments: call.attachments.map((attachment) => ({
      id: attachment.id,
      title: attachment.title,
      filename: attachment.filename,
      fileUrl: attachment.fileUrl,
    })),
  };

  return (
    <CallDetailClient
      call={detail}
      staffList={staffList}
      callCauseOptions={callCauseOptions}
    />
  );
}
