"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Download,
  Eye,
  ExternalLink,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Printer,
  Search,
  Trash2,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import {
  AttachmentPreviewDialog,
  type AttachmentPreviewItem,
} from "@/components/shared/attachment-preview-dialog";
import type { ExportColumn } from "@/lib/export";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCallLog } from "@/lib/actions/calls";
import { CallReportDialog, type CallCauseOption } from "./call-report-dialog";

interface ChildData {
  id: string;
  branchId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
}

interface CallAttachment {
  id: string;
  filename: string;
  fileUrl: string;
}

interface CallRecord {
  id: string;
  date: string;
  time: string | null;
  direction: string;
  isDraft: boolean;
  contact: string;
  phone: string;
  staffId: string;
  teacher: string;
  subject: string;
  reason: string;
  remarks: string;
  createdBy: string | null;
  attachments: CallAttachment[];
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  child: ChildData;
  calls: CallRecord[];
  staffList: StaffMember[];
  callCauseOptions: CallCauseOption[];
}

const fallbackCauseLabels: Record<string, string> = {
  health: "Health Issue",
  behavior: "Behavior",
  absence: "Absence",
  pickup: "Pickup Arrangement",
  emergency: "Emergency",
  general_inquiry: "General Inquiry",
  complaint: "Complaint",
  follow_up: "Follow Up",
  other: "Other",
};

const directionConfig: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  INCOMING: {
    label: "Incoming",
    icon: PhoneIncoming,
    className: "bg-[#3498db]/10 text-[#1d6fa5] border-[#3498db]/30",
  },
  OUTGOING: {
    label: "Outgoing",
    icon: PhoneOutgoing,
    className: "bg-[#8e44ad]/10 text-[#6f2f8f] border-[#8e44ad]/30",
  },
  MISSED: {
    label: "Missed",
    icon: Phone,
    className: "bg-[#d64635]/10 text-[#b73528] border-[#d64635]/30",
  },
};

const exportColumns: ExportColumn[] = [
  { header: "Date", key: "date" },
  { header: "Time", key: "time" },
  { header: "Call Type", key: "callType" },
  { header: "Cause", key: "reason" },
  { header: "Teacher", key: "teacher" },
  { header: "Subject", key: "subject" },
  { header: "Remarks", key: "remarks" },
];

function display(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function attachmentHref(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  if (fileUrl.includes("/")) return `/${fileUrl.replace(/^\/+/, "")}`;
  return `/images/MedForms/${fileUrl}`;
}

function previewItems(attachments: CallAttachment[]): AttachmentPreviewItem[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    filename: attachment.filename,
    href: attachmentHref(attachment.fileUrl),
  }));
}

function filenameFor(child: ChildData) {
  return `${child.firstName}_${child.lastName}_calls_report`
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/_+/g, "_");
}

function exportRows(rows: CallRecord[], causeLabels: Record<string, string>) {
  return rows.map((row) => ({
    date: row.date,
    time: row.time ?? "",
    callType: directionConfig[row.direction]?.label ?? row.direction,
    reason: causeLabels[row.reason] ?? row.reason,
    teacher: row.teacher,
    subject: row.subject,
    remarks: row.remarks,
  }));
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <Card className="rounded-sm">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <div className={`flex size-10 items-center justify-center rounded ${className}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function CallDetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-2 last:border-b-0 sm:grid-cols-[140px_1fr]">
      <dt className="text-xs font-medium uppercase text-muted-foreground">{label}</dt>
      <dd className="text-sm">{display(value)}</dd>
    </div>
  );
}

function CallTableSection({
  title,
  icon: Icon,
  calls,
  columns,
}: {
  title: string;
  icon: LucideIcon;
  calls: CallRecord[];
  columns: ColumnDef<CallRecord>[];
}) {
  return (
    <Card className="rounded-sm">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
          <Badge variant="secondary">{calls.length}</Badge>
        </div>
        <DataTable
          columns={columns}
          data={calls}
          emptyState={
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {title.toLowerCase()} calls match the current filters.
            </p>
          }
        />
      </CardContent>
    </Card>
  );
}

export function CallsClient({ child, calls, staffList, callCauseOptions }: Props) {
  const id = child.id;
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<CallRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<CallRecord | null>(null);
  const [editTarget, setEditTarget] = useState<CallRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<{
    title: string;
    attachments: AttachmentPreviewItem[];
  } | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [attachmentFilter, setAttachmentFilter] = useState("all");

  const causeLabels = useMemo(() => {
    const labels = { ...fallbackCauseLabels };
    for (const option of callCauseOptions) {
      labels[option.value] = option.category
        ? `${option.category}: ${option.label}`
        : option.label;
    }
    return labels;
  }, [callCauseOptions]);

  const filteredCalls = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return calls.filter((call) => {
      if (dateFrom && call.date < dateFrom) return false;
      if (dateTo && call.date > dateTo) return false;
      if (attachmentFilter === "with" && call.attachments.length === 0) return false;
      if (attachmentFilter === "without" && call.attachments.length > 0) return false;
      if (normalizedSearch) {
        const haystack = [
          call.date,
          call.time,
          directionConfig[call.direction]?.label,
          causeLabels[call.reason] ?? call.reason,
          call.teacher,
          call.subject,
          call.remarks,
          call.contact,
          call.phone,
          call.createdBy,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [attachmentFilter, calls, causeLabels, dateFrom, dateTo, search]);

  const incomingCalls = filteredCalls.filter((call) => call.direction === "INCOMING");
  const outgoingCalls = filteredCalls.filter((call) => call.direction === "OUTGOING");

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteCallLog(deleteTarget.id);
      if (result.success) {
        toast.success("Call log deleted");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete call log");
      }
    });
  }

  function openNewCallDialog() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEditCallDialog(call: CallRecord) {
    setEditTarget(call);
    setDialogOpen(true);
  }

  function handleCallDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditTarget(null);
    }
  }

  function columnsFor(staffHeader: string): ColumnDef<CallRecord>[] {
    return [
      {
        accessorKey: "date",
        header: ({ column }) => <SortableHeader column={column}>Date</SortableHeader>,
        cell: ({ row }) => <span className="font-medium">{row.original.date}</span>,
      },
      {
        accessorKey: "time",
        header: ({ column }) => <SortableHeader column={column}>Time</SortableHeader>,
        cell: ({ row }) => display(row.original.time),
      },
      {
        accessorKey: "reason",
        header: ({ column }) => <SortableHeader column={column}>Cause</SortableHeader>,
        cell: ({ row }) => display(causeLabels[row.original.reason] ?? row.original.reason),
      },
      {
        accessorKey: "teacher",
        header: ({ column }) => <SortableHeader column={column}>{staffHeader}</SortableHeader>,
        cell: ({ row }) => display(row.original.teacher),
      },
      {
        accessorKey: "subject",
        header: ({ column }) => <SortableHeader column={column}>Subject</SortableHeader>,
        cell: ({ row }) => (
          <span className="flex max-w-[220px] items-center gap-1.5 truncate">
            {row.original.isDraft ? <Badge variant="secondary">Draft</Badge> : null}
            <span className="truncate">{display(row.original.subject)}</span>
          </span>
        ),
      },
      {
        accessorKey: "remarks",
        header: ({ column }) => <SortableHeader column={column}>Remarks</SortableHeader>,
        cell: ({ row }) => (
          <span className="block max-w-[260px] truncate text-muted-foreground">
            {display(row.original.remarks)}
          </span>
        ),
      },
      {
        id: "action",
        header: "Action",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Open actions">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDetailTarget(row.original)}>
                <Eye className="mr-2 size-4" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/calls/${row.original.id}`}>
                  <ExternalLink className="mr-2 size-4" />
                  Open Form 6
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openEditCallDialog(row.original)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        id: "attachment",
        header: "Attachment",
        enableSorting: false,
        cell: ({ row }) => {
          const firstAttachment = row.original.attachments[0];
          if (!firstAttachment) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="xs"
                type="button"
                title={firstAttachment.filename}
                onClick={() =>
                  setPreviewTarget({
                    title: `${row.original.date} Call Attachment`,
                    attachments: previewItems(row.original.attachments),
                  })
                }
              >
                <Paperclip className="size-3" />
                View Attachment
              </Button>
              {row.original.attachments.length > 1 ? (
                <Badge variant="secondary">+{row.original.attachments.length - 1}</Badge>
              ) : null}
            </div>
          );
        },
      },
    ];
  }

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} Calls`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}` },
          { label: "Calls" },
        ]}
      />

      <div className="space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded border border-border/60 bg-card p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
              {child.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={child.photo} alt="" className="size-full object-cover" />
              ) : (
                <UserX className="size-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {child.firstName} {child.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">Incoming Outgoing call</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton
              filename={filenameFor(child)}
              sheetName="Calls Report"
              columns={exportColumns}
              data={exportRows(filteredCalls, causeLabels)}
            />
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print
            </Button>
            <Button size="sm" onClick={openNewCallDialog}>
              <Plus className="size-4" />
              Add Call
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total Calls"
            value={calls.length}
            icon={Phone}
            className="bg-primary/10 text-primary"
          />
          <SummaryCard
            label="Incoming"
            value={calls.filter((call) => call.direction === "INCOMING").length}
            icon={PhoneIncoming}
            className="bg-[#3498db]/10 text-[#1d6fa5]"
          />
          <SummaryCard
            label="Outgoing"
            value={calls.filter((call) => call.direction === "OUTGOING").length}
            icon={PhoneOutgoing}
            className="bg-[#8e44ad]/10 text-[#6f2f8f]"
          />
          <SummaryCard
            label="Attachments"
            value={calls.reduce((sum, call) => sum + call.attachments.length, 0)}
            icon={Download}
            className="bg-[#008200]/10 text-[#008200]"
          />
        </div>

        <Card className="rounded-sm">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
              <div role="search" className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search date, cause, teacher, subject..."
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                aria-label="Date from"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                aria-label="Date to"
              />
              <select
                value={attachmentFilter}
                onChange={(event) => setAttachmentFilter(event.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                aria-label="Attachment filter"
              >
                <option value="all">All attachments</option>
                <option value="with">With attachment</option>
                <option value="without">Without attachment</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{filteredCalls.length} visible</Badge>
              {attachmentFilter !== "all" ? (
                <Badge variant="outline">
                  {attachmentFilter === "with" ? "With attachment" : "Without attachment"}
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <CallTableSection
          title="Incoming"
          icon={PhoneIncoming}
          calls={incomingCalls}
          columns={columnsFor("Pick up")}
        />
        <CallTableSection
          title="Outgoing"
          icon={PhoneOutgoing}
          calls={outgoingCalls}
          columns={columnsFor("Teacher")}
        />
      </div>

      <CallReportDialog
        key={editTarget?.id ?? "new-call-report"}
        childId={id}
        branchId={child.branchId}
        open={dialogOpen}
        onOpenChange={handleCallDialogOpenChange}
        staffList={staffList}
        callCauseOptions={callCauseOptions}
        initialCall={editTarget}
      />

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Call Details</DialogTitle>
          </DialogHeader>
          {detailTarget ? (
            <dl>
              <CallDetailRow label="Date" value={detailTarget.date} />
              <CallDetailRow label="Time" value={detailTarget.time} />
              <CallDetailRow
                label="Call Type"
                value={directionConfig[detailTarget.direction]?.label ?? detailTarget.direction}
              />
              <CallDetailRow
                label="Cause"
                value={causeLabels[detailTarget.reason] ?? detailTarget.reason}
              />
              <CallDetailRow label="Teacher" value={detailTarget.teacher} />
              <CallDetailRow label="Subject" value={detailTarget.subject} />
              <CallDetailRow label="Remarks" value={detailTarget.remarks} />
              <CallDetailRow label="Filed By" value={detailTarget.createdBy} />
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Call</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this call? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AttachmentPreviewDialog
        open={!!previewTarget}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
        title={previewTarget?.title ?? "Call Attachment"}
        attachments={previewTarget?.attachments ?? []}
      />
    </>
  );
}
