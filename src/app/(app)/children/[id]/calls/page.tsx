import { notFound } from "next/navigation";
import { getChild } from "@/lib/actions/children";
import { getCallCauseOptions, getChildCallLogs } from "@/lib/actions/calls";
import { getOrgStaffList } from "@/lib/actions/medical";
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
    getOrgStaffList(),
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
  };

  const calls = callsRaw.map((c) => ({
    id: c.id,
    date: c.date.toISOString().slice(0, 10),
    time: formatTime(c.time),
    direction: c.direction,
    contact: c.contact ?? "",
    phone: c.phone ?? "",
    subject: c.subject ?? "",
    reason: c.reason ?? "",
    remarks: c.remarks ?? "",
    createdBy: c.createdBy?.name ?? c.createdBy?.email ?? null,
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
