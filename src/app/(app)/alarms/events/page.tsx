"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Eye } from "lucide-react";

interface EventAlarm {
  id: string;
  title: string;
  date: string;
  type: string;
  typeColor: string;
  branch: string;
}

const demoEvents: EventAlarm[] = [
  { id: "ea-1", title: "Spring Field Trip", date: "2026-03-15", type: "Field Trip", typeColor: "#22c55e", branch: "Main Branch" },
  { id: "ea-2", title: "Parent-Teacher Meeting", date: "2026-02-25", type: "Parent Meeting", typeColor: "#3b82f6", branch: "Main Branch" },
  { id: "ea-3", title: "Lara's Birthday Party", date: "2026-03-12", type: "Birthday Party", typeColor: "#ec4899", branch: "Main Branch" },
  { id: "ea-4", title: "Easter Celebration", date: "2026-04-05", type: "Holiday Celebration", typeColor: "#ef4444", branch: "All Branches" },
  { id: "ea-5", title: "Health Screening Day", date: "2026-03-01", type: "Health Checkup", typeColor: "#1caf9a", branch: "Downtown Branch" },
  { id: "ea-6", title: "Art Exhibition", date: "2026-03-20", type: "Field Trip", typeColor: "#22c55e", branch: "Suburb Branch" },
];

export default function EventAlarmsPage() {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return demoEvents;
    return demoEvents.filter((e) => e.branch === branchFilter || e.branch === "All Branches");
  }, [branchFilter]);

  const columns: ColumnDef<EventAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Event Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[#1caf9a]" />
            <span className="font-medium">{row.original.title}</span>
          </div>
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
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge
            style={{ backgroundColor: row.original.typeColor + "20", color: row.original.typeColor }}
          >
            {row.original.type}
          </Badge>
        ),
      },
      { accessorKey: "branch", header: "Branch" },
      {
        id: "actions",
        header: "Actions",
        cell: () => (
          <Button variant="ghost" size="icon" className="size-8">
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Event Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/events" },
          { label: "Events" },
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
        <DataTable columns={columns} data={filtered} searchKey="title" searchPlaceholder="Search events..." />
      </div>
    </>
  );
}
