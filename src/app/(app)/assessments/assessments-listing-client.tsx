"use client";

import { useCallback, useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, ArrowUpDown, MoreHorizontal, Eye, Pencil, Trash2, Calendar } from "lucide-react";

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

const statusBadgeStyles: Record<AssessmentStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  REVIEWED: "bg-[#059669]/15 text-[#059669] border-[#059669]/20",
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
  classes: ClassOption[];
  branches: BranchOption[];
}

export default function AssessmentsListingClient({
  assessments,
  classes,
  branches,
}: AssessmentsListingClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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
      </div>
    </>
  );
}
