"use client";

import { useState, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface DoctorVisitRow {
  id: string;
  childName: string;
  visitDate: string;
  doctor: string;
  reason: string;
  followUpDate: string | null;
  branchName: string;
}

// --- Column Definitions ---

const columns: ColumnDef<DoctorVisitRow>[] = [
  {
    accessorKey: "childName",
    header: "Child Name",
    cell: ({ row }) => (
      <span className="font-medium text-[#333]">{row.original.childName}</span>
    ),
  },
  {
    accessorKey: "visitDate",
    header: "Visit Date",
    cell: ({ row }) => (
      <span className="text-sm text-[#333]">
        {row.original.visitDate
          ? format(new Date(row.original.visitDate), "MMM d, yyyy")
          : "—"}
      </span>
    ),
  },
  {
    accessorKey: "doctor",
    header: "Doctor",
    cell: ({ row }) => (
      <span className="text-sm text-[#6f7b8a]">{row.original.doctor || "—"}</span>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-sm text-[#6f7b8a]">{row.original.reason || "—"}</span>
    ),
  },
  {
    accessorKey: "followUpDate",
    header: "Follow-up Date",
    cell: ({ row }) => (
      <span className="text-sm text-[#6f7b8a]">
        {row.original.followUpDate
          ? format(new Date(row.original.followUpDate), "MMM d, yyyy")
          : "\u2014"}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const visit = row.original;
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
              <Link href={`/medical/visits/${visit.id}`}>
                <Eye className="size-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/medical/visits/${visit.id}`}>
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

interface MedicalVisitsClientProps {
  visits: DoctorVisitRow[];
  total: number;
}

// --- Page Component ---

export function MedicalVisitsClient({ visits, total }: MedicalVisitsClientProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search) return visits;
    const lower = search.toLowerCase();
    return visits.filter(
      (v) =>
        v.childName.toLowerCase().includes(lower) ||
        v.doctor.toLowerCase().includes(lower) ||
        v.reason.toLowerCase().includes(lower)
    );
  }, [visits, search]);

  return (
    <>
      <PageHeader
        title="Doctor Visits"
        breadcrumbs={[
          { label: "Medical", href: "/medical/general" },
          { label: "Visits" },
        ]}
      />
      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by child, doctor or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Link href="/medical/visits/new" className="ml-auto">
            <Button style={{ background: "#1caf9a" }} className="text-white">
              <Plus className="size-4" />
              Add New
            </Button>
          </Link>
        </div>

        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
            <p className="text-sm text-muted-foreground">No doctor visits found.</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredData} />
        )}
      </div>
    </>
  );
}
