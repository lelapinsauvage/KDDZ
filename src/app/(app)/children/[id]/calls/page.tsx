import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import {
  getCallCauseOptions,
  getCallStaffOptions,
  getChildCallLogs,
} from "@/lib/actions/calls";
import { CallsClient } from "./calls-client";

interface Props {
  params: Promise<{ id: string }>;
}

/** Format a time-only Date to HH:mm string or null */
function formatTime(date: Date | null): string | null {
  if (!date) return null;
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default async function ChildCallsPage({ params }: Props) {
  const { id } = await params;

  const [child, callsRaw, staffList, callCauseOptions] = await Promise.all([
    getChild(id),
    getChildCallLogs(id),
    getCallStaffOptions(),
    getCallCauseOptions(),
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

  const calls = callsRaw.map((c) => ({
    id: c.id,
    date: c.date.toISOString().slice(0, 10),
    time: formatTime(c.time),
    direction: c.direction,
    isDraft: c.isDraft,
    contact: c.contact ?? "",
    phone: c.phone ?? "",
    staffId: c.staffId ?? "",
    teacher: staffById.get(c.staffId ?? "") ?? "",
    subject: c.subject ?? "",
    reason: c.reason ?? "",
    remarks: c.remarks ?? "",
    createdBy: c.createdBy?.name ?? c.createdBy?.email ?? null,
    attachments: (c.attachments ?? []).map((attachment) => ({
      id: attachment.id,
      filename: attachment.filename,
      fileUrl: attachment.fileUrl,
    })),
  }));

  return (
    <CallsClient
      child={childData}
      calls={calls}
      staffList={staffList}
      callCauseOptions={callCauseOptions}
    />
  );
}
