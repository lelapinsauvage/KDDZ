import { getBranches } from "@/lib/actions/branches";
import {
  getCallCauseOptions,
  getCallChildOptions,
  getCallLogs,
  getCallStaffOptions,
} from "@/lib/actions/calls";
import { getClasses } from "@/lib/actions/classes";
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

type CallsPageSize = number | "all";

function parseDirection(value: string | undefined): CallDirection | undefined {
  if (value === "INCOMING" || value === "OUTGOING" || value === "MISSED") {
    return value;
  }
  return undefined;
}

function parsePageSize(value: string | undefined): CallsPageSize {
  if (value === "all") return "all";
  const parsed = Number(value) || 10;
  if ([10, 20, 50, 100, 150].includes(parsed)) return parsed;
  return 10;
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
  const pageSize = parsePageSize(params.pageSize);
  const listParams = {
    search: params.search || undefined,
    branchId: params.branch && params.branch !== "ALL" ? params.branch : undefined,
    classId: params.class && params.class !== "ALL" ? params.class : undefined,
    direction: parseDirection(params.direction),
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    page,
    pageSize,
  };

  const [
    callsResult,
    exportCallsResult,
    branchesResult,
    classesResult,
    staffList,
    callCauseOptions,
    childOptions,
  ] = await Promise.all([
    getCallLogs(listParams),
    getCallLogs({ ...listParams, page: 1, pageSize: "all" }),
    getBranches(),
    getClasses(),
    getCallStaffOptions(),
    getCallCauseOptions(),
    getCallChildOptions(),
  ]);

  const branches = (branchesResult.success && branchesResult.data
    ? branchesResult.data
    : []) as Array<{ id: string; name: string }>;
  const classes = (classesResult.success && classesResult.data
    ? classesResult.data
    : []) as Array<{ id: string; name: string; branchId: string }>;

  const serializeCall = (call: (typeof callsResult.calls)[number]) => ({
    id: call.id,
    legacyFormId: call.legacyId,
    childNumber: call.child.childNumber ?? call.child.legacyId?.toString() ?? "-",
    childPhoto: call.child.photo ?? null,
    date: call.date.toISOString().slice(0, 10),
    time: formatTime(call.time),
    direction: call.direction,
    isDraft: call.isDraft,
    childId: call.child.id,
    firstName: call.child.firstName,
    lastName: call.child.lastName,
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
    attachmentCount: call.attachments.length,
  });

  const calls = callsResult.calls.map(serializeCall);
  const exportCalls = exportCallsResult.calls.map(serializeCall);

  const children = childOptions.map((child) => ({
    id: child.id,
    childNumber: child.childNumber ?? child.legacyId?.toString() ?? "-",
    firstName: child.firstName,
    lastName: child.lastName,
    photo: child.photo ?? null,
    branchId: child.branchId,
    classId: child.classId,
    branchName: child.branch?.name ?? "",
    className: child.class?.name ?? "",
  }));

  return (
    <FadeIn>
      <CallsManagementClient
        calls={calls}
        exportCalls={exportCalls}
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
