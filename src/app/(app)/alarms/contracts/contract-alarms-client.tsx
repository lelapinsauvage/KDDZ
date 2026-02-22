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
import { FileText } from "lucide-react";

interface ContractAlarm {
  id: string;
  message: string;
  dueDate: string;
  daysLeft: number;
  status: "Expired" | "Expiring Soon" | "Active";
  branch: string;
}

interface ContractAlarmsClientProps {
  alarms: ContractAlarm[];
  branches: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  Expired: "bg-red-100 text-red-700",
  "Expiring Soon": "bg-amber-100 text-amber-700",
  Active: "bg-emerald-100 text-emerald-700",
};

export function ContractAlarmsClient({ alarms, branches }: ContractAlarmsClientProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return alarms;
    return alarms.filter((c) => c.status === statusFilter);
  }, [statusFilter, alarms]);

  const columns: ColumnDef<ContractAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#1caf9a]" />
            <span className="font-medium">{row.original.message || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Contract End",
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
        accessorKey: "daysLeft",
        header: "Days Left",
        cell: ({ row }) => {
          const d = row.original.daysLeft;
          return (
            <span className={d < 0 ? "font-medium text-red-600" : ""}>
              {d < 0 ? `${Math.abs(d)} overdue` : `${d} days`}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={statusColors[row.original.status]}>{row.original.status}</Badge>
        ),
      },
      { accessorKey: "branch", header: "Branch" },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Contract Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Contracts" },
        ]}
      />
      <div className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
              <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} searchKey="message" searchPlaceholder="Search contracts..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No contract alarms found.
          </div>
        )}
      </div>
    </>
  );
}
