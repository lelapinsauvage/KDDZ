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
  title: string;
  message: string;
  dueDate: string;
  status: "Active" | "Resolved" | "Dismissed";
  branch: string;
}

const demoOthers: OtherAlarm[] = [
  { id: "oa-1", title: "Fire Drill", message: "Schedule quarterly fire drill for all branches", dueDate: "2026-03-01", status: "Active", branch: "All Branches" },
  { id: "oa-2", title: "Supply Order", message: "Reorder art supplies for Nursery A and B", dueDate: "2026-02-25", status: "Active", branch: "Main Branch" },
  { id: "oa-3", title: "AC Maintenance", message: "Annual AC service for Downtown Branch", dueDate: "2026-02-15", status: "Resolved", branch: "Downtown Branch" },
  { id: "oa-4", title: "License Renewal", message: "Nursery operating license expires soon", dueDate: "2026-04-30", status: "Active", branch: "Main Branch" },
  { id: "oa-5", title: "Staff Training", message: "First aid training session reminder", dueDate: "2026-03-10", status: "Active", branch: "Suburb Branch" },
];

const statusColors: Record<string, string> = {
  Active: "bg-amber-100 text-amber-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Dismissed: "bg-gray-100 text-gray-600",
};

export default function OtherAlarmsPage() {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return demoOthers;
    return demoOthers.filter((o) => o.branch === branchFilter || o.branch === "All Branches");
  }, [branchFilter]);

  const columns: ColumnDef<OtherAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-orange-500" />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: "message",
        header: "Message",
        cell: ({ row }) => (
          <span className="max-w-[300px] truncate text-muted-foreground">{row.original.message}</span>
        ),
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
        title="Other Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/others" },
          { label: "Others" },
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
        <DataTable columns={columns} data={filtered} searchKey="title" searchPlaceholder="Search alarms..." />
      </div>
    </>
  );
}
