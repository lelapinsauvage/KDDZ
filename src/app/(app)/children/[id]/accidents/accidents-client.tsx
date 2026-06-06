"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
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
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
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
import { deleteAccidentReport } from "@/lib/actions/medical";
import { AccidentReportDialog } from "./accident-report-dialog";

interface ChildData {
  id: string;
  branchId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
}

interface AccidentAttachment {
  id: string;
  filename: string;
  fileUrl: string;
}

interface AccidentRecord {
  id: string;
  date: string;
  time: string;
  cause: string;
  location: string;
  specifyArea: string;
  cameraNumber: string;
  firstAid: string;
  teacher: string;
  emergencyHospital: string;
  treatment: string;
  status: string;
  createdBy: string | null;
  attachments: AccidentAttachment[];
}

interface StaffMember {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  child: ChildData;
  accidents: AccidentRecord[];
  staffList: StaffMember[];
}

const locationLabels: Record<string, string> = {
  playground: "Playground",
  classroom: "Classroom",
  bathroom: "Bathroom",
  hallway: "Hallway",
  cafeteria: "Cafeteria",
  outdoor: "Outdoor Area",
  stairs: "Stairs",
  other: "Other",
};

const firstAidLabels: Record<string, string> = {
  none: "None",
  bandage: "Bandage",
  ice_pack: "Ice Pack",
  antiseptic: "Antiseptic",
  splint: "Splint",
  other: "Other",
};

const hospitalLabels: Record<string, string> = {
  none: "Not Required",
  emergency_room: "Emergency Room",
  hospital_visit: "Hospital Visit",
  ambulance: "Ambulance Called",
  true: "Yes",
};

const treatmentLabels: Record<string, string> = {
  none: "No Treatment Needed",
  minor_wound_care: "Minor Wound Care",
  medication: "Medication",
  stitches: "Stitches",
  cast_splint: "Cast / Splint",
  observation: "Observation",
  other: "Other",
};

const exportColumns: ExportColumn[] = [
  { header: "Date", key: "date" },
  { header: "Time", key: "time" },
  { header: "Cause", key: "cause" },
  { header: "Place", key: "location" },
  { header: "Specific Area", key: "specifyArea" },
  { header: "Cam #", key: "cameraNumber" },
  { header: "FirstAid", key: "firstAid" },
  { header: "Teacher", key: "teacher" },
  { header: "Hospital", key: "emergencyHospital" },
  { header: "Treatment", key: "treatment" },
];

function display(value: string | null | undefined, labels?: Record<string, string>): ReactNode {
  if (!value || !value.trim()) return "-";
  return labels?.[value] ?? value;
}

function displayText(value: string | null | undefined, labels?: Record<string, string>) {
  if (!value || !value.trim()) return "";
  return labels?.[value] ?? value;
}

function filenameFor(child: ChildData) {
  return `${child.firstName}_${child.lastName}_accident_reports`
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/_+/g, "_");
}

function attachmentHref(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("/")) return fileUrl;
  if (fileUrl.includes("/")) return `/${fileUrl.replace(/^\/+/, "")}`;
  return `/images/MedForms/${fileUrl}`;
}

function exportRows(rows: AccidentRecord[]) {
  return rows.map((row) => ({
    date: row.date,
    time: row.time,
    cause: row.cause,
    location: displayText(row.location, locationLabels),
    specifyArea: row.specifyArea,
    cameraNumber: row.cameraNumber,
    firstAid: displayText(row.firstAid, firstAidLabels),
    teacher: row.teacher,
    emergencyHospital: displayText(row.emergencyHospital, hospitalLabels),
    treatment: displayText(row.treatment, treatmentLabels),
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

export function AccidentsClient({ child, accidents, staffList }: Props) {
  const id = child.id;
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<AccidentRecord | null>(null);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [attachmentFilter, setAttachmentFilter] = useState("all");

  const filteredAccidents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return accidents.filter((report) => {
      if (dateFrom && report.date < dateFrom) return false;
      if (dateTo && report.date > dateTo) return false;
      if (attachmentFilter === "with" && report.attachments.length === 0) return false;
      if (attachmentFilter === "without" && report.attachments.length > 0) return false;
      if (normalizedSearch) {
        const haystack = [
          report.date,
          report.time,
          report.cause,
          displayText(report.location, locationLabels),
          report.specifyArea,
          report.cameraNumber,
          displayText(report.firstAid, firstAidLabels),
          report.teacher,
          displayText(report.emergencyHospital, hospitalLabels),
          displayText(report.treatment, treatmentLabels),
          report.createdBy,
          report.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      return true;
    });
  }, [accidents, attachmentFilter, dateFrom, dateTo, search]);

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteAccidentReport(deleteTarget.id);
      if (result.success) {
        toast.success("Accident report deleted");
        setDeleteTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete accident report");
      }
    });
  }

  const columns: ColumnDef<AccidentRecord>[] = [
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
      accessorKey: "cause",
      header: ({ column }) => <SortableHeader column={column}>Cause</SortableHeader>,
      cell: ({ row }) => (
        <span className="block max-w-[240px] truncate">{display(row.original.cause)}</span>
      ),
    },
    {
      accessorKey: "location",
      header: ({ column }) => <SortableHeader column={column}>Place</SortableHeader>,
      cell: ({ row }) => display(row.original.location, locationLabels),
    },
    {
      accessorKey: "specifyArea",
      header: ({ column }) => (
        <SortableHeader column={column}>Specific Area</SortableHeader>
      ),
      cell: ({ row }) => display(row.original.specifyArea),
    },
    {
      accessorKey: "cameraNumber",
      header: ({ column }) => <SortableHeader column={column}>Cam #</SortableHeader>,
      cell: ({ row }) => display(row.original.cameraNumber),
    },
    {
      accessorKey: "firstAid",
      header: ({ column }) => <SortableHeader column={column}>First Aid</SortableHeader>,
      cell: ({ row }) => display(row.original.firstAid, firstAidLabels),
    },
    {
      accessorKey: "teacher",
      header: ({ column }) => <SortableHeader column={column}>Teacher</SortableHeader>,
      cell: ({ row }) => display(row.original.teacher),
    },
    {
      accessorKey: "emergencyHospital",
      header: ({ column }) => <SortableHeader column={column}>Hospital</SortableHeader>,
      cell: ({ row }) => display(row.original.emergencyHospital, hospitalLabels),
    },
    {
      accessorKey: "treatment",
      header: ({ column }) => <SortableHeader column={column}>Treatment</SortableHeader>,
      cell: ({ row }) => display(row.original.treatment, treatmentLabels),
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
              <Link href={`/medical/accidents/${row.original.id}`}>
                <Eye className="mr-2 size-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/accidents/${row.original.id}`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
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
            <Button variant="outline" size="xs" asChild>
              <a
                href={attachmentHref(firstAttachment.fileUrl)}
                target="_blank"
                rel="noreferrer"
                title={firstAttachment.filename}
              >
                <Paperclip className="size-3" />
                View Attachment
              </a>
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
        title={`${child.firstName} ${child.lastName} Accident Reports`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}` },
          { label: "Accidents" },
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
              <p className="text-sm text-muted-foreground">Child Accident Reports</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportButton
              filename={filenameFor(child)}
              sheetName="Accident Reports"
              columns={exportColumns}
              data={exportRows(filteredAccidents)}
            />
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              New Accident
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total Accidents"
            value={accidents.length}
            icon={AlertTriangle}
            className="bg-[#d64635]/10 text-[#d64635]"
          />
          <SummaryCard
            label="With Hospital"
            value={accidents.filter((a) => a.emergencyHospital && a.emergencyHospital !== "none").length}
            icon={CalendarDays}
            className="bg-[#67809F]/15 text-[#4b617d]"
          />
          <SummaryCard
            label="Attachments"
            value={accidents.reduce((sum, report) => sum + report.attachments.length, 0)}
            icon={Download}
            className="bg-primary/10 text-primary"
          />
          <SummaryCard
            label="Visible"
            value={filteredAccidents.length}
            icon={FileText}
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
                  placeholder="Search date, cause, place, teacher..."
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
              <Badge variant="secondary">{filteredAccidents.length} visible</Badge>
              {attachmentFilter !== "all" ? (
                <Badge variant="outline">
                  {attachmentFilter === "with" ? "With attachment" : "Without attachment"}
                </Badge>
              ) : null}
            </div>

            <DataTable
              columns={columns}
              data={filteredAccidents}
              emptyState={
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No accident reports match the current filters.
                </p>
              }
            />
          </CardContent>
        </Card>
      </div>

      <AccidentReportDialog
        childId={id}
        branchId={child.branchId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staffList={staffList}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Accident Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this accident report? This action cannot be undone.
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
    </>
  );
}
