import { getBranches } from "@/lib/actions/branches";
import { getCallCauseOptions, getCallChildOptions, getCallLogs } from "@/lib/actions/calls";
import { getClasses } from "@/lib/actions/classes";
import { getOrgStaffList } from "@/lib/actions/medical";
import { FadeIn } from "@/components/ui/skeleton";
import { CallsManagementClient } from "./calls-management-client";
import type { CallDirection } from "@/generated/prisma/client";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    branch?: string;
    class?: string;
    direction?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    pageSize?: string;
  }>;
}

function parseDirection(value: string | undefined): CallDirection | undefined {
  if (value === "INCOMING" || value === "OUTGOING" || value === "MISSED") {
    return value;
  }
  return undefined;
}

function formatTime(date: Date | null): string | null {
  if (!date) return null;
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default async function CallsManagementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(10, Number(params.pageSize) || 25));

  const [
    callsResult,
    branchesResult,
    classesResult,
    staffList,
    callCauseOptions,
    childOptions,
  ] = await Promise.all([
    getCallLogs({
      search: params.search || undefined,
      branchId: params.branch && params.branch !== "ALL" ? params.branch : undefined,
      classId: params.class && params.class !== "ALL" ? params.class : undefined,
      direction: parseDirection(params.direction),
      dateFrom: params.dateFrom || undefined,
      dateTo: params.dateTo || undefined,
      page,
      pageSize,
    }),
    getBranches(),
    getClasses(),
    getOrgStaffList(),
    getCallCauseOptions(),
    getCallChildOptions(),
  ]);

  const branches = (branchesResult.success && branchesResult.data
    ? branchesResult.data
    : []) as Array<{ id: string; name: string }>;
  const classes = (classesResult.success && classesResult.data
    ? classesResult.data
    : []) as Array<{ id: string; name: string; branchId: string }>;

  const calls = callsResult.calls.map((call) => ({
    id: call.id,
    date: call.date.toISOString().slice(0, 10),
    time: formatTime(call.time),
    direction: call.direction,
    childId: call.child.id,
    childName: `${call.child.firstName} ${call.child.lastName}`.trim(),
    branchId: call.child.branchId,
    branchName: call.child.branch?.name ?? "",
    classId: call.child.classId,
    className: call.child.class?.name ?? "",
    contact: call.contact ?? "",
    phone: call.phone ?? "",
    subject: call.subject ?? "",
    reason: call.reason ?? "",
    remarks: call.remarks ?? "",
    createdBy: call.createdBy?.name ?? call.createdBy?.email ?? null,
    attachmentCount: call._count.attachments,
  }));

  const children = childOptions.map((child) => ({
    id: child.id,
    firstName: child.firstName,
    lastName: child.lastName,
    branchId: child.branchId,
    classId: child.classId,
    branchName: child.branch?.name ?? "",
    className: child.class?.name ?? "",
  }));

  return (
    <FadeIn>
      <CallsManagementClient
        calls={calls}
        total={callsResult.total}
        branches={branches}
        classes={classes}
        staffList={staffList}
        callCauseOptions={callCauseOptions}
        childOptions={children}
        filters={{
          search: params.search ?? "",
          branch: params.branch ?? "ALL",
          class: params.class ?? "ALL",
          direction: params.direction ?? "ALL",
          dateFrom: params.dateFrom ?? "",
          dateTo: params.dateTo ?? "",
          page,
          pageSize,
        }}
      />
    </FadeIn>
  );
}
