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
  message: string;
  dueDate: string;
  branch: string;
  isActive: boolean;
}

interface MedicalAlarmsClientProps {
  alarms: MedicalAlarm[];
  branches: { id: string; name: string }[];
}

export function MedicalAlarmsClient({ alarms, branches }: MedicalAlarmsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return alarms;
    return alarms.filter((m) => m.branch === branchFilter);
  }, [branchFilter, alarms]);

  const columns: ColumnDef<MedicalAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Stethoscope className="size-4 text-red-500" />
            <span className="font-medium">{row.original.message || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
          if (!row.original.dueDate) return "—";
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
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.isActive ? "bg-amber-100 text-amber-700" : "bg-[#059669]/15 text-[#059669]"}>
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
        title="Medical Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Medical" },
        ]}
      />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
            No medical alarms found.
          </div>
        )}
      </div>
    </>
  );
}
