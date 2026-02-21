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
import { ClipboardCheck } from "lucide-react";

interface AssessmentAlarm {
  id: string;
  assessmentType: string;
  scheduledDate: string;
  daysUntil: number;
  branch: string;
}

interface AssessmentsClientProps {
  assessments: AssessmentAlarm[];
  branches: { id: string; name: string }[];
}

// Map assessment type numbers to human-readable names
const assessmentTypeNames: Record<number, string> = {
  1: "Developmental",
  2: "Behavioral",
  3: "Cognitive",
  4: "Language",
  5: "Social",
  6: "Physical",
};

export function AssessmentsClient({ assessments, branches }: AssessmentsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");

  const filtered = useMemo(() => {
    if (branchFilter === "ALL") return assessments;
    return assessments.filter((a) => a.branch === branchFilter);
  }, [branchFilter, assessments]);

  const columns: ColumnDef<AssessmentAlarm>[] = useMemo(
    () => [
      {
        accessorKey: "assessmentType",
        header: "Assessment Type",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-[#1caf9a]" />
            <span className="font-medium">{row.original.assessmentType}</span>
          </div>
        ),
      },
      {
        accessorKey: "scheduledDate",
        header: "Scheduled Date",
        cell: ({ row }) =>
          new Date(row.original.scheduledDate + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
      },
      {
        accessorKey: "daysUntil",
        header: "Days Until",
        cell: ({ row }) => {
          const d = row.original.daysUntil;
          return (
            <Badge
              className={
                d <= 7
                  ? "bg-red-100 text-red-700"
                  : d <= 30
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }
            >
              {d === 0 ? "Today" : `${d} days`}
            </Badge>
          );
        },
      },
      { accessorKey: "branch", header: "Branch" },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Assessment Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms/assessments" },
          { label: "Assessments" },
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
          <DataTable columns={columns} data={filtered} searchKey="assessmentType" searchPlaceholder="Search assessments..." />
        ) : (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            No upcoming assessments found.
          </div>
        )}
      </div>
    </>
  );
}

export { assessmentTypeNames };
