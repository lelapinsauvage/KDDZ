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
import { Bell } from "lucide-react";

interface OtherAlarm {
  id: string;
  message: string;
  dueDate: string;
  isActive: boolean;
  branch: string;
}

interface OtherAlarmsClientProps {
  alarms: OtherAlarm[];
  branches: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  Active: "bg-amber-100 text-amber-700",
  Resolved: "bg-emerald-100 text-emerald-700",
};

export function OtherAlarmsClient({ alarms, branches }: OtherAlarmsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return alarms;
    return alarms.filter((o) => o.branch === branchFilter);
  }, [branchFilter, alarms]);

  const columns: ColumnDef<OtherAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-orange-500" />
            <span className="font-medium">{row.original.message || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
          if (!row.original.dueDate) return "—";
          return new Date(row.original.dueDate + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={statusColors[row.original.isActive ? "Active" : "Resolved"]}>
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
        title="Other Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Others" },
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
            No other alarms found.
          </div>
        )}
      </div>
    </>
  );
}
