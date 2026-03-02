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
import { CalendarDays, ExternalLink } from "lucide-react";
import Link from "next/link";

interface EventAlarm {
  id: string;
  title: string;
  date: string;
  type: string;
  typeColor: string;
  branch: string;
}

interface EventAlarmsClientProps {
  events: EventAlarm[];
  branches: { id: string; name: string }[];
}

export function EventAlarmsClient({ events, branches }: EventAlarmsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return events;
    return events.filter((e) => e.branch === branchFilter || e.branch === "All Branches");
  }, [branchFilter, events]);

  const columns: ColumnDef<EventAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Event Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
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
        cell: ({ row }) => (
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href={`/settings/events`}>
              <ExternalLink className="size-4" />
            </Link>
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
          { label: "Alarms", href: "/alarms" },
          { label: "Events" },
        ]}
      />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
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
          <DataTable columns={columns} data={filtered} searchKey="title" searchPlaceholder="Search events..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No upcoming events found.
          </div>
        )}
      </div>
    </>
  );
}
