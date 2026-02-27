"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, AlertTriangle, Users } from "lucide-react";

// ── Types ──

interface PaymentAlarm {
  id: string;
  message: string;
  dueDate: string;
  daysLeft: number;
  status: "Overdue" | "Upcoming" | "Active";
  branch: string;
}

interface OverdueChild {
  childId: string;
  childName: string;
  branchName: string;
  className: string;
  totalOverdue: number;
  paymentCount: number;
  oldestDate: string;
}

interface PaymentAlarmsClientProps {
  alarms: PaymentAlarm[];
  branches: { id: string; name: string }[];
  overdueChildren: OverdueChild[];
  totalOverdue: number;
  totalOverdueCount: number;
}

const statusColors: Record<string, string> = {
  Overdue: "bg-red-100 text-red-700",
  Upcoming: "bg-amber-100 text-amber-700",
  Active: "bg-[#6B8F71]/15 text-[#6B8F71]",
};

function formatDate(iso: string) {
  if (!iso) return "\u2014";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function PaymentAlarmsClient({
  alarms,
  branches,
  overdueChildren,
  totalOverdue,
  totalOverdueCount,
}: PaymentAlarmsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filteredAlarms = useMemo(() => {
    if (branchFilter === "ALL") return alarms;
    return alarms.filter((p) => p.branch === branchFilter);
  }, [branchFilter, alarms]);

  const filteredOverdue = useMemo(() => {
    if (branchFilter === "ALL") return overdueChildren;
    return overdueChildren.filter(
      (c) => branches.some((b) => b.name === c.branchName && b.id === branchFilter) ||
             c.branchName === branchFilter,
    );
  }, [branchFilter, overdueChildren, branches]);

  const alarmColumns: ColumnDef<PaymentAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Description",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <DollarSign className="size-4 text-amber-500" />
            <span className="font-medium">{row.original.message || "\u2014"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.original.dueDate),
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
    [],
  );

  const overdueColumns: ColumnDef<OverdueChild>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <a
            href={`/children/${row.original.childId}/accounting`}
            className="font-medium text-foreground hover:text-primary hover:underline"
          >
            {row.original.childName}
          </a>
        ),
      },
      { accessorKey: "branchName", header: "Branch" },
      { accessorKey: "className", header: "Class" },
      {
        accessorKey: "totalOverdue",
        header: () => <div className="text-right">Overdue Amount</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold text-red-600">
            ${row.original.totalOverdue.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "paymentCount",
        header: "Overdue Payments",
        cell: ({ row }) => (
          <Badge className="bg-red-100 text-red-700">
            {row.original.paymentCount}
          </Badge>
        ),
      },
      {
        accessorKey: "oldestDate",
        header: "Since",
        cell: ({ row }) => formatDate(row.original.oldestDate),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Payment Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Payments" },
        ]}
      />
      <div className="space-y-6 p-4 md:p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Overdue</p>
                <p className="text-xl font-semibold text-red-600">
                  ${totalOverdue.toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100">
                <DollarSign className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Payments</p>
                <p className="text-xl font-semibold text-foreground">
                  {totalOverdueCount}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="py-4">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Children with Overdue</p>
                <p className="text-xl font-semibold text-foreground">
                  {overdueChildren.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overdue Payments by Child */}
        {filteredOverdue.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="size-4 text-red-500" />
                Children with Overdue Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={overdueColumns}
                data={filteredOverdue}
                searchKey="childName"
                searchPlaceholder="Search children..."
              />
            </CardContent>
          </Card>
        )}

        {/* General Alarms */}
        {filteredAlarms.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Alarms</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={alarmColumns}
                data={filteredAlarms}
                searchKey="message"
                searchPlaceholder="Search alarms..."
              />
            </CardContent>
          </Card>
        ) : filteredOverdue.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No payment alarms found.
          </div>
        ) : null}
      </div>
    </>
  );
}
