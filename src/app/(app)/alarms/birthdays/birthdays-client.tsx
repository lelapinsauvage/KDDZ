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
import { Cake } from "lucide-react";

interface BirthdayAlarm {
  id: string;
  childName: string;
  dateOfBirth: string;
  age: number;
  daysUntil: number;
  branch: string;
  className: string;
}

interface BirthdaysClientProps {
  birthdays: BirthdayAlarm[];
  branches: { id: string; name: string }[];
}

export function BirthdaysClient({ birthdays, branches }: BirthdaysClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return birthdays;
    return birthdays.filter((b) => b.branch === branchFilter);
  }, [branchFilter, birthdays]);

  const columns: ColumnDef<BirthdayAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Cake className="size-4 text-pink-500" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      {
        accessorKey: "dateOfBirth",
        header: "Date of Birth",
        cell: ({ row }) =>
          new Date(row.original.dateOfBirth + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      },
      {
        accessorKey: "age",
        header: "Turning",
        cell: ({ row }) => `${row.original.age} years`,
      },
      {
        accessorKey: "daysUntil",
        header: "Days Until Birthday",
        cell: ({ row }) => {
          const d = row.original.daysUntil;
          return (
            <Badge
              className={
                d <= 7
                  ? "bg-red-100 text-red-700"
                  : d <= 30
                  ? "bg-amber-100 text-amber-700"
                  : "bg-[#059669]/15 text-[#059669]"
              }
            >
              {d === 0 ? "Today!" : `${d} days`}
            </Badge>
          );
        },
      },
      {
        accessorKey: "branch",
        header: "Branch",
      },
      {
        accessorKey: "className",
        header: "Class",
      },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Birthday Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Birthdays" },
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
          <DataTable columns={columns} data={filtered} searchKey="childName" searchPlaceholder="Search children..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No upcoming birthdays found.
          </div>
        )}
      </div>
    </>
  );
}
