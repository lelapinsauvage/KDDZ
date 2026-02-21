"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, ArrowUpDown, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

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

// Assessment type mapping
const assessmentTypeNames: Record<string, string> = {
  "1": "Social Development",
  "2": "Motor Skills",
  "3": "Language Development",
  "4": "Cognitive Skills",
  "5": "Self-Care Skills",
};

type AssessmentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface AssessmentEntry {
  id: string;
  childId: string;
  childName: string;
  classId: string;
  className: string;
  status: AssessmentStatus;
  date: string;
  assessor: string;
}

interface ClassOption {
  id: string;
  name: string;
}

const statusBadgeStyles: Record<AssessmentStatus, string> = {
  DRAFT: "bg-amber-100 text-amber-700 border-amber-200",
  SUBMITTED: "bg-blue-100 text-blue-700 border-blue-200",
  REVIEWED: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

interface AssessmentsClientProps {
  typeParam: string;
  assessments: AssessmentEntry[];
  classes: ClassOption[];
}

export default function AssessmentsClient({
  typeParam,
  assessments,
  classes,
}: AssessmentsClientProps) {
  const typeName = assessmentTypeNames[typeParam] ?? "Assessment";

  const [classFilter, setClassFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredEntries = useMemo(() => {
    return assessments.filter((entry) => {
      if (classFilter !== "ALL" && entry.classId !== classFilter) return false;
      if (statusFilter !== "ALL" && entry.status !== statusFilter) return false;
      return true;
    });
  }, [assessments, classFilter, statusFilter]);

  const columns: ColumnDef<AssessmentEntry>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Child Name
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-[#333]">{row.original.childName}</span>
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
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue || filterValue === "ALL") return true;
          return row.original.status === filterValue;
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
        accessorKey: "assessor",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assessor
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{row.original.assessor}</span>
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
                <DropdownMenuItem onClick={() => console.log("View assessment:", entry.id)}>
                  <Eye className="mr-2 size-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Edit assessment:", entry.id)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => console.log("Delete assessment:", entry.id)}
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
    []
  );

  return (
    <>
      <PageHeader
        title={typeName}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Assessments" },
          { label: typeName },
        ]}
      />

      <div className="space-y-4 p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-[170px]">
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
            <SelectTrigger className="w-[150px]">
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

          <Button style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 size-4" />
            New Assessment
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredEntries}
          searchKey="childName"
          searchPlaceholder="Search by child name..."
        />
      </div>
    </>
  );
}
