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
import { DollarSign } from "lucide-react";

interface PaymentAlarm {
  id: string;
  childName: string;
  amountDue: string;
  dueDate: string;
  status: "Paid" | "Overdue" | "Upcoming";
  branch: string;
}

const demoPayments: PaymentAlarm[] = [
  { id: "pa-1", childName: "Lara Haddad", amountDue: "$500", dueDate: "2026-02-15", status: "Overdue", branch: "Main Branch" },
  { id: "pa-2", childName: "Adam Khoury", amountDue: "$500", dueDate: "2026-03-01", status: "Upcoming", branch: "Main Branch" },
  { id: "pa-3", childName: "Jad Nassar", amountDue: "$450", dueDate: "2026-02-01", status: "Paid", branch: "Main Branch" },
  { id: "pa-4", childName: "Karim Saab", amountDue: "$550", dueDate: "2026-02-10", status: "Overdue", branch: "Downtown Branch" },
  { id: "pa-5", childName: "Tia Daher", amountDue: "$550", dueDate: "2026-03-01", status: "Upcoming", branch: "Downtown Branch" },
  { id: "pa-6", childName: "Rayan Frem", amountDue: "$480", dueDate: "2026-03-01", status: "Upcoming", branch: "Suburb Branch" },
];

const statusColors: Record<string, string> = {
  Paid: "bg-emerald-100 text-emerald-700",
  Overdue: "bg-red-100 text-red-700",
  Upcoming: "bg-amber-100 text-amber-700",
};

export default function PaymentAlarmsPage() {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return demoPayments;
    return demoPayments.filter((p) => p.branch === branchFilter);
  }, [branchFilter]);

  const columns: ColumnDef<PaymentAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-amber-500" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      {
        accessorKey: "amountDue",
        header: "Amount Due",
        cell: ({ row }) => <span className="font-medium">{row.original.amountDue}</span>,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) =>
          new Date(row.original.dueDate + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
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
        title="Payment Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/payments" },
          { label: "Payments" },
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
