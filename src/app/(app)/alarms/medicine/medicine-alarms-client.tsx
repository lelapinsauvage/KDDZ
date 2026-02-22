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
  message: string;
  dueDate: string;
  branch: string;
  isActive: boolean;
}

interface MedicineAlarmsClientProps {
  alarms: MedicineAlarm[];
  branches: { id: string; name: string }[];
}

export function MedicineAlarmsClient({ alarms, branches }: MedicineAlarmsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return alarms;
    return alarms.filter((m) => m.branch === branchFilter);
  }, [branchFilter, alarms]);

  const columns: ColumnDef<MedicineAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-purple-500" />
            <span className="font-medium">{row.original.message || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
          if (!row.original.dueDate) return "—";
          const dt = new Date(row.original.dueDate + "T00:00:00");
          return (
            <span className="text-sm">
              {dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.isActive ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
            {row.original.isActive ? "Active" : "Resolved"}
          </Badge>
        ),
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
          { label: "Alarms", href: "/alarms" },
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
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} searchKey="message" searchPlaceholder="Search alarms..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No medicine alarms found.
          </div>
        )}
      </div>
    </>
  );
}
