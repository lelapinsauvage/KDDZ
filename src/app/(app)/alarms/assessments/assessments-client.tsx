"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CalendarClock,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
} from "lucide-react";

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

interface AssessmentDueAlarmEntry {
  id: string;
  assessmentType: number;
  assessmentTypeName: string;
  childId: string;
  childNumber: string | null;
  childName: string;
  branchId: string;
  branchName: string;
  classId: string;
  className: string;
  dueDate: string;
  daysUntilDue: number;
  actionHref: string;
  message: string;
}

interface ScheduledAssessmentEntry {
  id: string;
  assessmentType: number;
  assessmentTypeName: string;
  scheduledDate: string;
  daysUntil: number;
  branchId: string;
  branchName: string;
}

interface AssessmentsClientProps {
  dueAlarms: AssessmentDueAlarmEntry[];
  scheduledAssessments: ScheduledAssessmentEntry[];
  branches: { id: string; name: string }[];
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dueBadgeClass(days: number) {
  if (days <= 3) return "bg-rose-100 text-rose-700 border-rose-200";
  if (days <= 7) return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-amber-100 text-amber-700 border-amber-200";
}

function dueLabel(days: number) {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export function AssessmentsClient({
  dueAlarms,
  scheduledAssessments,
  branches,
}: AssessmentsClientProps) {
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState("ALL");

  const filteredDueAlarms = useMemo(() => {
    return dueAlarms.filter((alarm) => {
      if (branchFilter !== "ALL" && alarm.branchId !== branchFilter) return false;
      if (urgencyFilter === "TODAY" && alarm.daysUntilDue !== 0) return false;
      if (urgencyFilter === "WEEK" && alarm.daysUntilDue > 7) return false;
      return true;
    });
  }, [dueAlarms, branchFilter, urgencyFilter]);

  const filteredScheduledAssessments = useMemo(() => {
    if (branchFilter === "ALL") return scheduledAssessments;
    return scheduledAssessments.filter((assessment) => assessment.branchId === branchFilter);
  }, [scheduledAssessments, branchFilter]);

  const dueToday = dueAlarms.filter((alarm) => alarm.daysUntilDue === 0).length;
  const dueThisWeek = dueAlarms.filter((alarm) => alarm.daysUntilDue <= 7).length;

  const dueColumns: ColumnDef<AssessmentDueAlarmEntry>[] = useMemo(
    () => [
      {
        accessorKey: "childNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Child #
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{row.original.childNumber ?? "-"}</span>
        ),
      },
      {
        accessorKey: "childName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Child
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Link
            href={row.original.actionHref}
            className="font-medium text-primary hover:underline"
          >
            {row.original.childName}
          </Link>
        ),
      },
      {
        accessorKey: "assessmentTypeName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assessment
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.assessmentTypeName}
          </Badge>
        ),
      },
      {
        accessorKey: "className",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Class
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" className="bg-[#e8ecf1] text-[#555] font-normal">
            {row.original.className}
          </Badge>
        ),
      },
      {
        accessorKey: "branchName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <span className="text-[#555]">{formatDate(row.original.dueDate)}</span>
        ),
      },
      {
        accessorKey: "daysUntilDue",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold uppercase"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due In
            <ArrowUpDown className="ml-1 size-3" />
          </Button>
        ),
        cell: ({ row }) => (
          <Badge className={dueBadgeClass(row.original.daysUntilDue)}>
            {dueLabel(row.original.daysUntilDue)}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button asChild size="sm">
            <Link href={row.original.actionHref}>
              <ExternalLink className="mr-1 size-4" />
              Create
            </Link>
          </Button>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  const scheduledColumns: ColumnDef<ScheduledAssessmentEntry>[] = useMemo(
    () => [
      {
        accessorKey: "assessmentTypeName",
        header: "Assessment",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" />
            <span className="font-medium">{row.original.assessmentTypeName}</span>
          </div>
        ),
      },
      {
        accessorKey: "scheduledDate",
        header: "Scheduled Date",
        cell: ({ row }) => formatDate(row.original.scheduledDate),
      },
      {
        accessorKey: "daysUntil",
        header: "Days Until",
        cell: ({ row }) => (
          <Badge className={dueBadgeClass(row.original.daysUntil)}>
            {dueLabel(row.original.daysUntil)}
          </Badge>
        ),
      },
      {
        accessorKey: "branchName",
        header: "Branch",
      },
      {
        id: "actions",
        header: "",
        cell: () => (
          <Button asChild variant="ghost" size="icon" className="size-8">
            <Link href="/assessments/dates">
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
        title="Assessment Alarms"
        breadcrumbs={[
          { label: "Alarms", href: "/alarms" },
          { label: "Assessments" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-normal">Today</div>
                <div className="mt-1 text-2xl font-semibold">{dueToday}</div>
              </div>
              <FileWarning className="size-5" />
            </div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-orange-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-normal">7 Days</div>
                <div className="mt-1 text-2xl font-semibold">{dueThisWeek}</div>
              </div>
              <CalendarClock className="size-5" />
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-normal">Scheduled</div>
                <div className="mt-1 text-2xl font-semibold">{scheduledAssessments.length}</div>
              </div>
              <ClipboardCheck className="size-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="All Due Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Due Dates</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="WEEK">7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
            <div>
              <h2 className="text-base font-semibold">Due Assessment Reports</h2>
              <p className="text-xs text-muted-foreground">
                {filteredDueAlarms.length} of {dueAlarms.length} reminders
              </p>
            </div>
          </div>
          <div className="p-4">
            <DataTable
              columns={dueColumns}
              data={filteredDueAlarms}
              searchKey="childName"
              searchPlaceholder="Search by child name..."
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-base font-semibold">Scheduled Assessment Dates</h2>
          </div>
          <div className="p-4">
            <DataTable
              columns={scheduledColumns}
              data={filteredScheduledAssessments}
              searchKey="assessmentTypeName"
              searchPlaceholder="Search assessments..."
            />
          </div>
        </div>
      </div>
    </>
  );
}
