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

type VaccinationStatus = "Up to date" | "Overdue" | "Upcoming";

interface VaccinationRow {
  id: string;
  childName: string;
  vaccine: string;
  dateGiven: string | null;
  nextDue: string | null;
  status: VaccinationStatus;
  branchName: string;
}

// --- Badge Helpers ---

function getVaccinationStatusBadge(status: VaccinationStatus) {
  switch (status) {
    case "Up to date":
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Up to date
        </Badge>
      );
    case "Overdue":
      return (
        <Badge className="bg-red-50 text-red-700 border-red-200">
          Overdue
        </Badge>
      );
    case "Upcoming":
      return (
        <Badge className="bg-blue-50 text-blue-700 border-blue-200">
          Upcoming
        </Badge>
      );
  }
}

// --- Column Definitions ---

const columns: ColumnDef<VaccinationRow>[] = [
  {
    accessorKey: "childName",
    header: "Child Name",
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.childName}</span>
    ),
  },
  {
    accessorKey: "vaccine",
    header: "Vaccine",
    cell: ({ row }) => (
      <span className="text-sm text-[#333]">{row.original.vaccine}</span>
    ),
  },
  {
    accessorKey: "dateGiven",
    header: "Date Given",
    cell: ({ row }) => (
      <span className="text-sm text-[#6f7b8a]">
        {row.original.dateGiven
          ? format(new Date(row.original.dateGiven), "MMM d, yyyy")
          : "—"}
      </span>
    ),
  },
  {
    accessorKey: "nextDue",
    header: "Next Due",
    cell: ({ row }) => (
      <span className="text-sm text-[#6f7b8a]">
        {row.original.nextDue
          ? format(new Date(row.original.nextDue), "MMM d, yyyy")
          : "N/A"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getVaccinationStatusBadge(row.original.status),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const record = row.original;
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
              <Link href={`/medical/vaccinations/${record.id}`}>
                <Eye className="size-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/vaccinations/${record.id}`}>
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

interface VaccinationsClientProps {
  vaccinations: VaccinationRow[];
  total: number;
}

// --- Page Component ---

export function VaccinationsClient({ vaccinations, total }: VaccinationsClientProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    let data = vaccinations;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter(
        (v) =>
          v.childName.toLowerCase().includes(lower) ||
          v.vaccine.toLowerCase().includes(lower)
      );
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((v) => v.status === statusFilter);
    }

    return data;
  }, [vaccinations, search, statusFilter]);

  return (
    <>
      <PageHeader
        title="Vaccination Records"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Vaccinations" },
        ]}
      />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child or vaccine..."
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
              <SelectItem value="Up to date">Up to date</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/medical/vaccinations/new" className="ml-auto">
            <Button style={{ background: "#1caf9a" }} className="text-white">
              <Plus className="size-4" />
              Add New
            </Button>
          </Link>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No vaccination records found.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>
    </>
  );
}
