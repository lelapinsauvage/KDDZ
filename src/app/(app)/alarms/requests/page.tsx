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
import { MessageSquare } from "lucide-react";

interface RequestAlarm {
  id: string;
  parentName: string;
  childName: string;
  request: string;
  date: string;
  status: "Pending" | "Approved" | "Rejected";
}

const demoRequests: RequestAlarm[] = [
  { id: "ra-1", parentName: "Hassan Haddad", childName: "Lara Haddad", request: "Early pickup at 3 PM", date: "2026-02-20", status: "Pending" },
  { id: "ra-2", parentName: "Walid Khoury", childName: "Adam Khoury", request: "Dietary change to lactose-free", date: "2026-02-19", status: "Approved" },
  { id: "ra-3", parentName: "Omar Nassar", childName: "Jad Nassar", request: "Extra nap time", date: "2026-02-18", status: "Pending" },
  { id: "ra-4", parentName: "Ali Saab", childName: "Karim Saab", request: "Permission for field trip", date: "2026-02-17", status: "Approved" },
  { id: "ra-5", parentName: "Rami Frem", childName: "Rayan Frem", request: "Schedule parent meeting", date: "2026-02-21", status: "Pending" },
  { id: "ra-6", parentName: "Nabil Hariri", childName: "Tarek Hariri", request: "Change class schedule", date: "2026-02-16", status: "Rejected" },
];

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function RequestAlarmsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return demoRequests;
    return demoRequests.filter((r) => r.status === statusFilter);
  }, [statusFilter]);

  const columns: ColumnDef<RequestAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "parentName",
        header: "Parent Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-blue-500" />
            <span className="font-medium">{row.original.parentName}</span>
          </div>
        ),
      },
      { accessorKey: "childName", header: "Child" },
      {
        accessorKey: "request",
        header: "Request",
        cell: ({ row }) => (
          <span className="max-w-[250px] truncate">{row.original.request}</span>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.date + "T00:00:00").toLocaleDateString("en-GB", {
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
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Request Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/requests" },
          { label: "Requests" },
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
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DataTable columns={columns} data={filtered} searchKey="parentName" searchPlaceholder="Search parents..." />
      </div>
    </>
  );
}
