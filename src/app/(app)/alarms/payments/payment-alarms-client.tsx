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
  message: string;
  dueDate: string;
  daysLeft: number;
  status: "Overdue" | "Upcoming" | "Active";
  branch: string;
}

interface PaymentAlarmsClientProps {
  alarms: PaymentAlarm[];
  branches: { id: string; name: string }[];
}

const statusColors: Record<string, string> = {
  Overdue: "bg-red-100 text-red-700",
  Upcoming: "bg-amber-100 text-amber-700",
  Active: "bg-emerald-100 text-emerald-700",
};

export function PaymentAlarmsClient({ alarms, branches }: PaymentAlarmsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return alarms;
    return alarms.filter((p) => p.branch === branchFilter);
  }, [branchFilter, alarms]);

  const columns: ColumnDef<PaymentAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-amber-500" />
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
            No payment alarms found.
          </div>
        )}
      </div>
    </>
  );
}
