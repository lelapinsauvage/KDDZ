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
  message: string;
  dueDate: string;
  branch: string;
  isActive: boolean;
}

interface RequestAlarmsClientProps {
  alarms: RequestAlarm[];
  branches: { id: string; name: string }[];
}

export function RequestAlarmsClient({ alarms, branches }: RequestAlarmsClientProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (statusFilter === "ALL") return alarms;
    if (statusFilter === "Active") return alarms.filter((r) => r.isActive);
    return alarms.filter((r) => !r.isActive);
  }, [statusFilter, alarms]);

  const columns: ColumnDef<RequestAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "message",
        header: "Request",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-blue-500" />
            <span className="font-medium">{row.original.message || "—"}</span>
          </div>
        ),
      },
      {
        accessorKey: "dueDate",
        header: "Date",
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
          <Badge className={row.original.isActive ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}>
            {row.original.isActive ? "Pending" : "Resolved"}
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
              <SelectItem value="Active">Pending</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {filtered.length > 0 ? (
          <DataTable columns={columns} data={filtered} searchKey="message" searchPlaceholder="Search requests..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No request alarms found.
          </div>
        )}
      </div>
    </>
  );
}
