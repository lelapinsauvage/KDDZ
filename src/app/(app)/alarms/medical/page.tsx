"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope } from "lucide-react";

interface MedicalAlarm {
  id: string;
  childName: string;
  type: string;
  dueDate: string;
  lastVisit: string;
  branch: string;
}

const demoMedical: MedicalAlarm[] = [
  { id: "ma-1", childName: "Lara Haddad", type: "Annual Checkup", dueDate: "2026-03-12", lastVisit: "2025-03-12", branch: "Main Branch" },
  { id: "ma-2", childName: "Adam Khoury", type: "Dental Checkup", dueDate: "2026-02-22", lastVisit: "2025-08-22", branch: "Main Branch" },
  { id: "ma-3", childName: "Jad Nassar", type: "Vision Screening", dueDate: "2026-02-15", lastVisit: "2025-02-15", branch: "Main Branch" },
  { id: "ma-4", childName: "Karim Saab", type: "Annual Checkup", dueDate: "2026-04-18", lastVisit: "2025-04-18", branch: "Downtown Branch" },
  { id: "ma-5", childName: "Tia Daher", type: "Hearing Test", dueDate: "2026-02-14", lastVisit: "2025-08-14", branch: "Downtown Branch" },
  { id: "ma-6", childName: "Rayan Frem", type: "Dental Checkup", dueDate: "2026-03-20", lastVisit: "2025-09-20", branch: "Suburb Branch" },
];

export default function MedicalAlarmsPage() {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return demoMedical;
    return demoMedical.filter((m) => m.branch === branchFilter);
  }, [branchFilter]);

  const columns: ColumnDef<MedicalAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Stethoscope className="size-4 text-red-500" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      { accessorKey: "type", header: "Type" },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
          const due = new Date(row.original.dueDate + "T00:00:00");
          const now = new Date();
          const overdue = due < now;
          return (
            <Badge className={overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
              {due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastVisit",
        header: "Last Visit",
        cell: ({ row }) =>
          new Date(row.original.lastVisit + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      },
      { accessorKey: "branch", header: "Branch" },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Medical Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/medical" },
          { label: "Medical" },
        ]}
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              <SelectItem value="Main Branch">Main Branch</SelectItem>
              <SelectItem value="Downtown Branch">Downtown Branch</SelectItem>
              <SelectItem value="Suburb Branch">Suburb Branch</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable columns={columns} data={filtered} searchKey="childName" searchPlaceholder="Search children..." />
      </div>
    </>
  );
}
