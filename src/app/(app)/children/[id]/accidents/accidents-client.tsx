"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, FileText, Trash2, AlertTriangle } from "lucide-react";

interface ChildData {
  id: string;
  firstName: string;
  lastName: string;
}

interface AccidentRecord {
  id: string;
  date: string;
  time: string;
  location: string;
  description: string;
  severity: string;
  firstAid: string;
  parentNotified: boolean;
}

interface Props {
  child: ChildData;
  accidents: AccidentRecord[];
}

const severityColors: Record<string, string> = {
  MINOR: "bg-yellow-100 text-yellow-700",
  MODERATE: "bg-orange-100 text-orange-700",
  SEVERE: "bg-red-100 text-red-700",
};

const columns: ColumnDef<AccidentRecord>[] = [
  {
    accessorKey: "date",
    header: "Date & Time",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.date}</div>
        {row.original.time && (
          <div className="text-xs text-muted-foreground">{row.original.time}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[250px]">{row.original.description}</span>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => (
      <Badge className={severityColors[row.original.severity] ?? "bg-gray-100 text-gray-700"}>
        {row.original.severity}
      </Badge>
    ),
    filterFn: (row, _columnId, filterValue) => {
      if (!filterValue || filterValue === "ALL") return true;
      return row.original.severity === filterValue;
    },
  },
  {
    accessorKey: "firstAid",
    header: "First Aid",
    cell: ({ row }) => (
      <span className="max-w-[200px] text-muted-foreground">{row.original.firstAid || "\u2014"}</span>
    ),
  },
  {
    id: "parentNotified",
    header: "Parent",
    cell: ({ row }) => (
      <Badge
        variant={row.original.parentNotified ? "default" : "outline"}
        className={row.original.parentNotified ? "bg-green-100 text-green-700" : ""}
      >
        {row.original.parentNotified ? "Notified" : "Not Notified"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
];

export function AccidentsClient({ child, accidents }: Props) {
  const id = child.id;

  return (
    <>
      <PageHeader
        title={`${child.firstName} ${child.lastName} — Accident Reports`}
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Children", href: "/children" },
          { label: `${child.firstName} ${child.lastName}`, href: `/children/${id}/dashboard` },
          { label: "Accidents" },
        ]}
      />

      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">{accidents.length} accident(s) on record</span>
          </div>
          <Button size="sm" style={{ background: "#1caf9a" }}>
            <Plus className="mr-1 h-4 w-4" />
            Report Accident
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={accidents}
          searchKey="description"
          searchPlaceholder="Search accidents..."
        />
      </div>
    </>
  );
}
