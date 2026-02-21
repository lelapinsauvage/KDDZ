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
import { Pill } from "lucide-react";

interface MedicineAlarm {
  id: string;
  childName: string;
  medicine: string;
  schedule: string;
  nextDose: string;
  branch: string;
}

const demoMedicine: MedicineAlarm[] = [
  { id: "med-1", childName: "Lara Haddad", medicine: "Amoxicillin", schedule: "3x daily", nextDose: "2026-02-21 12:00", branch: "Main Branch" },
  { id: "med-2", childName: "Jad Nassar", medicine: "Vitamin D Drops", schedule: "1x daily", nextDose: "2026-02-21 08:00", branch: "Main Branch" },
  { id: "med-3", childName: "Karim Saab", medicine: "Iron Supplement", schedule: "1x daily", nextDose: "2026-02-21 09:00", branch: "Downtown Branch" },
  { id: "med-4", childName: "Nour Mansour", medicine: "Cetirizine", schedule: "1x daily", nextDose: "2026-02-21 07:30", branch: "Downtown Branch" },
  { id: "med-5", childName: "Rayan Frem", medicine: "Ibuprofen", schedule: "As needed", nextDose: "2026-02-21 14:00", branch: "Suburb Branch" },
];

export default function MedicineAlarmsPage() {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return demoMedicine;
    return demoMedicine.filter((m) => m.branch === branchFilter);
  }, [branchFilter]);

  const columns: ColumnDef<MedicineAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-purple-500" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      { accessorKey: "medicine", header: "Medicine" },
      {
        accessorKey: "schedule",
        header: "Schedule",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.schedule}</Badge>
        ),
      },
      {
        accessorKey: "nextDose",
        header: "Next Dose",
        cell: ({ row }) => {
          const dt = new Date(row.original.nextDose);
          return (
            <span className="text-sm">
              {dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{" "}
              {dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
      },
      { accessorKey: "branch", header: "Branch" },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Medicine Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/medicine" },
          { label: "Medicine" },
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
