"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";

// --- Types ---

type Severity = "Minor" | "Moderate" | "Severe";
type AccidentStatus = "DRAFT" | "SUBMITTED" | "REVIEWED";

interface AccidentReportRow {
  id: string;
  childName: string;
  date: string;
  description: string;
  severity: string;
  status: AccidentStatus;
  branchName: string;
}

// --- Badge Helpers ---

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "Minor":
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Minor
        </Badge>
      );
    case "Moderate":
      return (
        <Badge className="bg-orange-50 text-orange-700 border-orange-200">
          Moderate
        </Badge>
      );
    case "Severe":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          Severe
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {severity || "—"}
        </Badge>
      );
  }
}

function getStatusBadge(status: AccidentStatus) {
  switch (status) {
    case "DRAFT":
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Draft
        </Badge>
      );
    case "SUBMITTED":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Submitted
        </Badge>
      );
    case "REVIEWED":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Reviewed
        </Badge>
      );
  }
}

// --- Column Definitions ---

const columns: ColumnDef<AccidentReportRow>[] = [
  {
    accessorKey: "childName",
    header: "Child Name",
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.childName}</span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-sm text-[#333]">
        {format(new Date(row.original.date), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="text-sm text-[#6f7b8a] line-clamp-1 max-w-[300px]">
        {row.original.description || "—"}
      </span>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => getSeverityBadge(row.original.severity),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const report = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/medical/accidents/${report.id}`}>
                <Eye className="size-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/accidents/${report.id}`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
  },
];

// --- Props ---

interface AccidentReportsClientProps {
  reports: AccidentReportRow[];
  total: number;
}

// --- Page Component ---

export function AccidentReportsClient({ reports, total }: AccidentReportsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    let data = reports;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.childName.toLowerCase().includes(lower) ||
          r.description.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    return data;
  }, [reports, search, statusFilter]);

  return (
    <>
      <PageHeader
        title="Accident Reports"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Accidents" },
        ]}
      />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/medical/accidents/new" className="ml-auto">
            <Button style={{ background: "#1caf9a" }} className="text-white">
              <Plus className="size-4" />
              Add New
            </Button>
          </Link>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No accident reports found.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>
    </>
  );
}
