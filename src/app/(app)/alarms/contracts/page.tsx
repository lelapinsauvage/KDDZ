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
  childName: string;
  contractStart: string;
  contractEnd: string;
  daysLeft: number;
  status: "Expired" | "Expiring Soon" | "Active";
}

const demoContracts: ContractAlarm[] = [
  { id: "ca-1", childName: "Lara Haddad", contractStart: "2025-09-01", contractEnd: "2026-03-01", daysLeft: 8, status: "Expiring Soon" },
  { id: "ca-2", childName: "Adam Khoury", contractStart: "2025-09-01", contractEnd: "2026-06-30", daysLeft: 129, status: "Active" },
  { id: "ca-3", childName: "Jad Nassar", contractStart: "2025-06-01", contractEnd: "2026-02-01", daysLeft: -20, status: "Expired" },
  { id: "ca-4", childName: "Karim Saab", contractStart: "2025-09-01", contractEnd: "2026-06-30", daysLeft: 129, status: "Active" },
  { id: "ca-5", childName: "Rayan Frem", contractStart: "2025-10-01", contractEnd: "2026-03-31", daysLeft: 38, status: "Expiring Soon" },
  { id: "ca-6", childName: "Tarek Hariri", contractStart: "2025-09-01", contractEnd: "2026-08-31", daysLeft: 191, status: "Active" },
];

const statusColors: Record<string, string> = {
  Expired: "bg-red-100 text-red-700",
  "Expiring Soon": "bg-amber-100 text-amber-700",
  Active: "bg-emerald-100 text-emerald-700",
};

export default function ContractAlarmsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return demoContracts;
    return demoContracts.filter((c) => c.status === statusFilter);
  }, [statusFilter]);

  const columns: ColumnDef<ContractAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#1caf9a]" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      {
        accessorKey: "contractStart",
        header: "Contract Start",
        cell: ({ row }) =>
          new Date(row.original.contractStart + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      },
      {
        accessorKey: "contractEnd",
        header: "Contract End",
        cell: ({ row }) =>
          new Date(row.original.contractEnd + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
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
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Contract Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/contracts" },
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
        <DataTable columns={columns} data={filtered} searchKey="childName" searchPlaceholder="Search children..." />
      </div>
    </>
  );
}
