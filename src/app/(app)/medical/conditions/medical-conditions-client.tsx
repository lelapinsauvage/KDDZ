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

interface MedicalConditionRow {
  id: string;
  childName: string;
  condition: string;
  severity: string;
  diagnosedDate: string;
  currentStatus: string;
  branchName: string;
}

// --- Badge Helpers ---

function getSeverityBadge(severity: string) {
  switch (severity) {
    case "Mild":
      return (
        <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Mild
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

function getConditionStatusBadge(status: string) {
  switch (status) {
    case "Active":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Active
        </Badge>
      );
    case "Managed":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Managed
        </Badge>
      );
    case "Resolved":
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-600">
          Resolved
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {status || "—"}
        </Badge>
      );
  }
}

// --- Column Definitions ---

const columns: ColumnDef<MedicalConditionRow>[] = [
  {
    accessorKey: "childName",
    header: "Child Name",
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.childName}</span>
    ),
  },
  {
    accessorKey: "condition",
    header: "Condition",
    cell: ({ row }) => (
      <span className="text-sm text-[#333]">{row.original.condition || "—"}</span>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => getSeverityBadge(row.original.severity),
  },
  {
    accessorKey: "diagnosedDate",
    header: "Diagnosed Date",
    cell: ({ row }) => (
      <span className="text-sm text-[#6f7b8a]">
        {row.original.diagnosedDate
          ? format(new Date(row.original.diagnosedDate), "MMM d, yyyy")
          : "—"}
      </span>
    ),
  },
  {
    accessorKey: "currentStatus",
    header: "Current Status",
    cell: ({ row }) => getConditionStatusBadge(row.original.currentStatus),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const condition = row.original;
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
              <Link href={`/medical/conditions/${condition.id}`}>
                <Eye className="size-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/conditions/${condition.id}`}>
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

interface MedicalConditionsClientProps {
  conditions: MedicalConditionRow[];
  total: number;
}

// --- Page Component ---

export function MedicalConditionsClient({ conditions, total }: MedicalConditionsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    let data = conditions;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (c) =>
          c.childName.toLowerCase().includes(lower) ||
          c.condition.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((c) => c.currentStatus === statusFilter);
    }

    return data;
  }, [conditions, search, statusFilter]);

  return (
    <>
      <PageHeader
        title="Medical Conditions"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Conditions" },
        ]}
      />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child or condition..."
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
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Managed">Managed</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/medical/conditions/new" className="ml-auto">
            <Button style={{ background: "#1caf9a" }} className="text-white">
              <Plus className="size-4" />
              Add New
            </Button>
          </Link>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No medical conditions found.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>
    </>
  );
}
