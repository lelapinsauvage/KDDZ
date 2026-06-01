"use client";

import { useState } from "react";
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
import { AccidentReportDialog } from "./accident-report-dialog";

interface ChildData {
  id: string;
  branchId: string;
  firstName: string;
  lastName: string;
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
  emergencyHospital: string;
  treatment: string;
  createdBy: string | null;
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
    accessorKey: "cause",
    header: "Cause",
    cell: ({ row }) => (
      <span className="line-clamp-2 max-w-[200px]">{row.original.cause || "\u2014"}</span>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => {
      const loc = row.original.location;
      return (
        <div>
          <Badge variant="outline">
            {locationLabels[loc] ?? (loc || "\u2014")}
          </Badge>
          {row.original.specifyArea && (
            <div className="mt-0.5 text-xs text-muted-foreground">
              {row.original.specifyArea}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "firstAid",
    header: "First Aid",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {firstAidLabels[row.original.firstAid] ?? (row.original.firstAid || "\u2014")}
      </span>
    ),
  },
  {
    accessorKey: "treatment",
    header: "Treatment",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.treatment ? row.original.treatment.replace(/_/g, " ") : "\u2014"}
      </span>
    ),
  },
  {
    accessorKey: "createdBy",
    header: "Filed By",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.createdBy ?? "\u2014"}</span>
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

export function AccidentsClient({ child, accidents, staffList }: Props) {
  const id = child.id;
  const [dialogOpen, setDialogOpen] = useState(false);

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
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Report Accident
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={accidents}
          searchKey="cause"
          searchPlaceholder="Search accidents..."
        />
      </div>

      <AccidentReportDialog
        childId={id}
        branchId={child.branchId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staffList={staffList}
      />
    </>
  );
}
