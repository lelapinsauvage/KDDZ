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
import { Shield } from "lucide-react";

interface InsuranceAlarm {
  id: string;
  childName: string;
  policyNumber: string;
  expiryDate: string;
  daysLeft: number;
  status: "Expired" | "Expiring Soon" | "Active";
}

const demoInsurance: InsuranceAlarm[] = [
  { id: "ins-1", childName: "Lara Haddad", policyNumber: "POL-2024-001", expiryDate: "2026-02-28", daysLeft: 7, status: "Expiring Soon" },
  { id: "ins-2", childName: "Adam Khoury", policyNumber: "POL-2024-002", expiryDate: "2026-04-15", daysLeft: 53, status: "Active" },
  { id: "ins-3", childName: "Jad Nassar", policyNumber: "POL-2024-003", expiryDate: "2026-02-10", daysLeft: -11, status: "Expired" },
  { id: "ins-4", childName: "Karim Saab", policyNumber: "POL-2024-004", expiryDate: "2026-03-05", daysLeft: 12, status: "Expiring Soon" },
  { id: "ins-5", childName: "Rayan Frem", policyNumber: "POL-2024-005", expiryDate: "2026-06-30", daysLeft: 129, status: "Active" },
  { id: "ins-6", childName: "Tarek Hariri", policyNumber: "POL-2024-006", expiryDate: "2026-01-31", daysLeft: -21, status: "Expired" },
];

const statusColors: Record<string, string> = {
  Expired: "bg-red-100 text-red-700",
  "Expiring Soon": "bg-amber-100 text-amber-700",
  Active: "bg-emerald-100 text-emerald-700",
};

export default function InsuranceAlarmsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return demoInsurance;
    return demoInsurance.filter((i) => i.status === statusFilter);
  }, [statusFilter]);

  const columns: ColumnDef<InsuranceAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-blue-500" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      { accessorKey: "policyNumber", header: "Policy #" },
      {
        accessorKey: "expiryDate",
        header: "Expiry Date",
        cell: ({ row }) =>
          new Date(row.original.expiryDate + "T00:00:00").toLocaleDateString("en-GB", {
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
          return <span className={d < 0 ? "font-medium text-red-600" : ""}>{d < 0 ? `${Math.abs(d)} overdue` : `${d} days`}</span>;
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
        title="Insurance Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/insurance" },
          { label: "Insurance" },
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
