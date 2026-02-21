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
import { Syringe } from "lucide-react";

interface VaccinationAlarm {
  id: string;
  childName: string;
  vaccine: string;
  dueDate: string;
  daysOverdue: number;
  branch: string;
  className: string;
}

interface VaccinationsClientProps {
  vaccinations: VaccinationAlarm[];
  branches: { id: string; name: string }[];
}

export function VaccinationsClient({ vaccinations, branches }: VaccinationsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return vaccinations;
    return vaccinations.filter((v) => v.branch === branchFilter);
  }, [branchFilter, vaccinations]);

  const columns: ColumnDef<VaccinationAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "childName",
        header: "Child Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Syringe className="size-4 text-blue-500" />
            <span className="font-medium">{row.original.childName}</span>
          </div>
        ),
      },
      { accessorKey: "vaccine", header: "Vaccine" },
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
        accessorKey: "daysOverdue",
        header: "Status",
        cell: ({ row }) => {
          const days = row.original.daysOverdue;
          return (
            <Badge className="bg-red-100 text-red-700">
              {days} {days === 1 ? "day" : "days"} overdue
            </Badge>
          );
        },
      },
      { accessorKey: "branch", header: "Branch" },
      { accessorKey: "className", header: "Class" },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Vaccination Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/vaccinations" },
          { label: "Vaccinations" },
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
          <DataTable columns={columns} data={filtered} searchKey="childName" searchPlaceholder="Search children..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No overdue vaccinations found.
          </div>
        )}
      </div>
    </>
  );
}
