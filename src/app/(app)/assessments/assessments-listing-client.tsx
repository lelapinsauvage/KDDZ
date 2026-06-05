"use client";

import { useCallback, useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  AlertTriangle,
  ClipboardCheck,
  FileWarning,
  FileText,
  ExternalLink,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteAssessment } from "@/lib/actions/assessments";
import { ASSESSMENT_TYPE_NAMES } from "@/lib/assessment-types";
import { getInitials, getAvatarColor } from "@/components/children/children-columns";

type AssessmentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";
type ReviewStatus = "COMPLETED" | "INCOMPLETE" | "DRAFT" | "MISSING";

interface AssessmentEntry {
  id: string;
  childId: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  assessmentType: number;
  assessmentTypeName: string;
  branchId: string;
  branchName: string;
  classId: string;
  className: string;
  status: AssessmentStatus;
  date: string;
}

interface ClassOption {
  id: string;
  name: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface AssessmentReviewEntry {
  assessmentType: number;
  assessmentTypeName: string;
  childId: string;
  assessmentId: string | null;
  childNumber: string | null;
  childName: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  branchId: string;
  branchName: string;
  classId: string;
  className: string;
  currentAge: string;
  joiningAge: string;
  status: ReviewStatus;
  progress: number | null;
  reportDate: string | null;
  actionHref: string;
}

interface AssessmentReviewSummary {
  completed: number;
  incomplete: number;
  drafts: number;
  missing: number;
  total: number;
}

const statusBadgeStyles: Record<AssessmentStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  REVIEWED: "bg-[#059669]/15 text-[#059669] border-[#059669]/20",
};

const reviewStatusBadgeStyles: Record<ReviewStatus, string> = {
  MISSING: "bg-rose-100 text-rose-700 border-rose-200",
  INCOMPLETE: "bg-orange-100 text-orange-700 border-orange-200",
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-[#059669]/15 text-[#059669] border-[#059669]/20",
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  MISSING: "No Report",
  INCOMPLETE: "Incomplete",
  DRAFT: "Draft",
  COMPLETED: "Completed",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface AssessmentsListingClientProps {
  assessments: AssessmentEntry[];
  reviewRows: AssessmentReviewEntry[];
  reviewSummary: AssessmentReviewSummary;
  classes: ClassOption[];
  branches: BranchOption[];
}

export default function AssessmentsListingClient({
  assessments,
  reviewRows,
  reviewSummary,
  classes,
  branches,
}: AssessmentsListingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reviewStatusFilter, setReviewStatusFilter] = useState("NEEDS_ACTION");

  const handleDelete = useCallback(
    (id: string) => {
      if (!confirm("Are you sure you want to delete this assessment?")) return;
      startTransition(async () => {
        await deleteAssessment(id);
        router.refresh();
      });
    },
    [router]
  );

  const filteredEntries = useMemo(() => {
    return assessments.filter((entry) => {
      if (typeFilter !== "ALL" && String(entry.assessmentType) !== typeFilter) return false;
      if (branchFilter !== "ALL" && entry.branchId !== branchFilter) return false;
      if (classFilter !== "ALL" && entry.classId !== classFilter) return false;
      if (statusFilter !== "ALL" && entry.status !== statusFilter) return false;
      return true;
    });
  }, [assessments, typeFilter, branchFilter, classFilter, statusFilter]);

  const filteredReviewEntries = useMemo(() => {
    return reviewRows.filter((entry) => {
      if (typeFilter !== "ALL" && String(entry.assessmentType) !== typeFilter) return false;
      if (branchFilter !== "ALL" && entry.branchId !== branchFilter) return false;
      if (classFilter !== "ALL" && entry.classId !== classFilter) return false;
      if (reviewStatusFilter === "NEEDS_ACTION" && entry.status === "COMPLETED") return false;
      if (
        reviewStatusFilter !== "ALL" &&
        reviewStatusFilter !== "NEEDS_ACTION" &&
        entry.status !== reviewStatusFilter
      ) {
        return false;
      }
      return true;
    });
  }, [reviewRows, typeFilter, branchFilter, classFilter, reviewStatusFilter]);

  const columns: ColumnDef<AssessmentEntry>[] = useMemo(
    () => [
      {
        id: "avatar",
        header: "",
        cell: ({ row }) => {
          const entry = row.original;
          const initials = getInitials(entry.firstName, entry.lastName);
          const bg = getAvatarColor(`${entry.firstName} ${entry.lastName}`);
          if (entry.photo) {
            return (
              <img
                src={entry.photo}
                alt=""
                className="size-8 rounded-full object-cover"
              />
            );
          }
          return (
            <div
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white ${bg}`}
            >
              {initials}
            </div>
          );
        },
        enableSorting: false,
        size: 48,
      },
      {
        accessorKey: "firstName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            First Name
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link
            href={`/assessments/${row.original.assessmentType}/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.firstName}
          </Link>
        ),
      },
      {
        accessorKey: "lastName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Name
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.lastName}</span>
        ),
      },
      {
        accessorKey: "assessmentTypeName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assessment Type
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.assessmentTypeName}
          </Badge>
        ),
      },
      {
        accessorKey: "branchName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: "className",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Class
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" className="bg-[#e8ecf1] text-[#555] font-normal">
            {row.original.className}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge className={statusBadgeStyles[status]}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </Badge>
          );
        },
      },
      {
        accessorKey: "date",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{formatDate(row.original.date)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/assessments/${entry.assessmentType}/${entry.id}`}>
                    <Eye className="mr-2 size-4" />
                    View
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/assessments/${entry.assessmentType}/${entry.id}`}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => handleDelete(entry.id)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
      },
    ],
    [handleDelete]
  );

  const reviewColumns: ColumnDef<AssessmentReviewEntry>[] = useMemo(
    () => [
      {
        accessorKey: "childNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Child #
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{row.original.childNumber ?? "-"}</span>
        ),
      },
      {
        accessorKey: "childName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Child
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          const initials = getInitials(entry.firstName, entry.lastName);
          const bg = getAvatarColor(`${entry.firstName} ${entry.lastName}`);
          return (
            <div className="flex items-center gap-2">
              {entry.photo ? (
                <img
                  src={entry.photo}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white ${bg}`}
                >
                  {initials}
                </div>
              )}
              <Link
                href={entry.actionHref}
                className="font-medium text-primary hover:underline"
              >
                {entry.childName}
              </Link>
            </div>
          );
        },
      },
      {
        accessorKey: "assessmentTypeName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assessment
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.assessmentTypeName}
          </Badge>
        ),
      },
      {
        accessorKey: "branchName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: "className",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Class
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" className="bg-[#e8ecf1] text-[#555] font-normal">
            {row.original.className}
          </Badge>
        ),
      },
      {
        id: "age",
        header: "Age",
        cell: ({ row }) => (
          <div className="text-xs text-[#555]">
            <div>{row.original.currentAge}</div>
            <div className="text-muted-foreground">Joined {row.original.joiningAge}</div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <div className="flex flex-col gap-1">
              <Badge className={reviewStatusBadgeStyles[entry.status]}>
                {reviewStatusLabels[entry.status]}
              </Badge>
              {entry.progress !== null && entry.status === "INCOMPLETE" && (
                <span className="text-xs text-muted-foreground">{entry.progress}%</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "reportDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">
            {row.original.reportDate ? formatDate(row.original.reportDate) : "-"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const entry = row.original;
          return (
            <Button asChild variant={entry.status === "MISSING" ? "default" : "outline"} size="sm">
              <Link href={entry.actionHref}>
                <ExternalLink className="mr-1 size-4" />
                {entry.status === "MISSING" ? "Create" : "Open"}
              </Link>
            </Button>
          );
        },
        enableSorting: false,
      },
    ],
    []
  );

  const reviewStats = [
    {
      label: "Missing",
      value: reviewSummary.missing,
      icon: FileWarning,
      className: "border-rose-200 bg-rose-50 text-rose-700",
    },
    {
      label: "Incomplete",
      value: reviewSummary.incomplete,
      icon: AlertTriangle,
      className: "border-orange-200 bg-orange-50 text-orange-700",
    },
    {
      label: "Drafts",
      value: reviewSummary.drafts,
      icon: FileText,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    },
    {
      label: "Completed",
      value: reviewSummary.completed,
      icon: ClipboardCheck,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <>
      <PageHeader
        title="Assessments"
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Assessments" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.entries(ASSESSMENT_TYPE_NAMES).map(([key, name]) => (
                <SelectItem key={key} value={key}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[160px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <Button variant="outline" asChild>
            <Link href="/assessments/dates">
              <Calendar className="mr-1 size-4" />
              Dates
            </Link>
          </Button>

          <Button asChild>
            <Link href={`/assessments/${typeFilter !== "ALL" ? typeFilter : "1"}/new`}>
              <Plus className="mr-1 size-4" />
              New Assessment
            </Link>
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredEntries}
          searchKey="firstName"
          searchPlaceholder="Search by first name..."
        />

        {isPending && (
          <div className="text-sm text-muted-foreground">Processing...</div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {reviewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`rounded-lg border px-4 py-3 ${stat.className}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-normal">
                      {stat.label}
                    </div>
                    <div className="mt-1 text-2xl font-semibold">{stat.value}</div>
                  </div>
                  <Icon className="size-5" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">Report Review Queue</h2>
              <p className="text-xs text-muted-foreground">
                {filteredReviewEntries.length} of {reviewSummary.total} reports
              </p>
            </div>

            <div className="flex-1" />

            <Select value={reviewStatusFilter} onValueChange={setReviewStatusFilter}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Review Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEEDS_ACTION">Needs Action</SelectItem>
                <SelectItem value="ALL">All Review</SelectItem>
                <SelectItem value="MISSING">No Report</SelectItem>
                <SelectItem value="INCOMPLETE">Incomplete</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4">
            <DataTable
              columns={reviewColumns}
              data={filteredReviewEntries}
              searchKey="childName"
              searchPlaceholder="Search by child name..."
            />
          </div>
        </div>
      </div>
    </>
  );
}
