"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserX,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteAbsenceReport } from "@/lib/actions/absent-reports";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
}

interface AbsenceAttachment {
  id: string;
  filename: string;
  fileUrl: string;
}

interface AbsenceRecord {
  id: string;
  date: string;
  reason: string | null;
  status: string;
  createdBy: string | null;
  absentFrom: string | null;
  absentTo: string | null;
  hospitalName: string | null;
  doctorName: string | null;
  attachments: AbsenceAttachment[];
}

interface Props {
  child: ChildData;
  absences: AbsenceRecord[];
}

const statusColors: Record<string, string> = {
  PENDING: "bg-[#c29d0b] text-white border-transparent",
  APPROVED: "bg-[#008200] text-white border-transparent",
  REJECTED: "bg-[#d64635] text-white border-transparent",
};

const exportColumns: ExportColumn[] = [
  { header: "Date", key: "date" },
  { header: "Reason", key: "reason" },
  { header: "Absent From", key: "absentFrom" },
  { header: "To", key: "absentTo" },
  { header: "Hospital", key: "hospitalName" },
  { header: "Dr. Name", key: "doctorName" },
  { header: "Status", key: "status" },
  { header: "Attachment Count", key: "attachmentCount" },
];

function display(value: string | null | undefined) {
  return value && value.trim() ? value : "-";
}

function attachmentHref(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  if (fileUrl.includes("/")) return `/${fileUrl.replace(/^\/+/, "")}`;
  return `/images/MedForms/${fileUrl}`;
}

function previewItems(attachments: AbsenceAttachment[]): AttachmentPreviewItem[] {
  return attachments.map((attachment) => ({
    id: attachment.id,
    filename: attachment.filename,
    href: attachmentHref(attachment.fileUrl),
  }));
}

function filenameFor(child: ChildData) {
  return `${child.firstName}_${child.lastName}_absence_reports`
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/_+/g, "_");
}

function exportRows(rows: AbsenceRecord[]) {
  return rows.map((row) => ({
    date: row.date,
    reason: row.reason ?? "",
    absentFrom: row.absentFrom ?? "",
    absentTo: row.absentTo ?? "",
    hospitalName: row.hospitalName ?? "",
    doctorName: row.doctorName ?? "",
    status: row.status,
    attachmentCount: row.attachments.length,
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
  icon: typeof UserX;
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

export function AbsenceClient({ child, absences }: Props) {
  const id = child.id;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewTarget, setPreviewTarget] = useState<{
    title: string;
    attachments: AttachmentPreviewItem[];
  } | null>(null);

  const filteredAbsences = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return absences.filter((report) => {
      if (dateFrom && report.date < dateFrom) return false;
      if (dateTo && report.date > dateTo) return false;
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (normalizedSearch) {
        const haystack = [
          report.date,
          report.reason,
          report.absentFrom,
          report.absentTo,
          report.hospitalName,
          report.doctorName,
          report.status,
          report.createdBy,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [absences, dateFrom, dateTo, search, statusFilter]);

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteAbsenceReport(deleteId);
      if (result.success) {
        toast.success("Absence report deleted");
        setDeleteId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete absence report");
      }
    });
  }

  const columns: ColumnDef<AbsenceRecord>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <SortableHeader column={column}>Date</SortableHeader>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.date}</span>,
    },
    {
      accessorKey: "reason",
      header: ({ column }) => (
        <SortableHeader column={column}>Reason</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="block max-w-[280px] truncate">
          {display(row.original.reason)}
        </span>
      ),
    },
    {
      accessorKey: "absentFrom",
      header: ({ column }) => (
        <SortableHeader column={column}>Absent From</SortableHeader>
      ),
      cell: ({ row }) => display(row.original.absentFrom),
    },
    {
      accessorKey: "absentTo",
      header: ({ column }) => (
        <SortableHeader column={column}>To</SortableHeader>
      ),
      cell: ({ row }) => display(row.original.absentTo),
    },
    {
      accessorKey: "hospitalName",
      header: ({ column }) => (
        <SortableHeader column={column}>Hospital</SortableHeader>
      ),
      cell: ({ row }) => display(row.original.hospitalName),
    },
    {
      accessorKey: "doctorName",
      header: ({ column }) => (
        <SortableHeader column={column}>Dr. Name</SortableHeader>
      ),
      cell: ({ row }) => display(row.original.doctorName),
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
            <DropdownMenuItem asChild>
              <Link href={`/absent-reports/${row.original.id}`}>
                <Eye className="mr-2 size-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/absent-reports/${row.original.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteId(row.original.id)}
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
                  title: `${row.original.date} Absence Attachment`,
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

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} Absence Reports`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}` },
          { label: "Absence" },
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
              <p className="text-sm text-muted-foreground">Child Absence Reports</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton
              filename={filenameFor(child)}
              sheetName="Absence Reports"
              columns={exportColumns}
              data={exportRows(filteredAbsences)}
            />
            <Button size="sm" asChild>
              <Link href={`/absent-reports/new?childId=${id}`}>
                <Plus className="size-4" />
                New Absence Report
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total Absences"
            value={absences.length}
            icon={CalendarDays}
            className="bg-primary/10 text-primary"
          />
          <SummaryCard
            label="Approved"
            value={absences.filter((a) => a.status === "APPROVED").length}
            icon={FileText}
            className="bg-[#008200]/10 text-[#008200]"
          />
          <SummaryCard
            label="Pending"
            value={absences.filter((a) => a.status === "PENDING").length}
            icon={Search}
            className="bg-[#c29d0b]/10 text-[#9b7d08]"
          />
          <SummaryCard
            label="Attachments"
            value={absences.reduce((sum, report) => sum + report.attachments.length, 0)}
            icon={Download}
            className="bg-[#67809F]/15 text-[#4b617d]"
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
                  placeholder="Search date, reason, hospital, doctor..."
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
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                aria-label="Status filter"
              >
                <option value="all">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{filteredAbsences.length} visible</Badge>
              {statusFilter !== "all" ? (
                <Badge className={statusColors[statusFilter] ?? ""}>{statusFilter}</Badge>
              ) : null}
            </div>

            <DataTable
              columns={columns}
              data={filteredAbsences}
              emptyState={
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No absence reports match the current filters.
                </p>
              }
            />
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Absence Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this absence report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
        title={previewTarget?.title ?? "Absence Attachment"}
        attachments={previewTarget?.attachments ?? []}
      />
    </>
  );
}
