"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Send,
  Loader2,
  CheckCircle2,
  FileEdit,
  Smile,
  Meh,
  Frown,
  Moon,
  CloudMoon,
  Utensils,
  UtensilsCrossed,
  BedDouble,
  SunMedium,
  Filter,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { deleteDailyReport, submitDailyReport } from "@/lib/actions/daily-reports";
import { toast } from "sonner";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";

const dailyReportsExportColumns: ExportColumn[] = [
  { header: "Date", key: "date" },
  { header: "Child Name", key: "childName" },
  { header: "Class", key: "className" },
  { header: "Branch", key: "branchName" },
  { header: "Breakfast", key: "breakfast", transform: (v) => v ? String(v) : "N/A" },
  { header: "Lunch", key: "lunch", transform: (v) => v ? String(v) : "N/A" },
  { header: "Sleep", key: "sleep", transform: (v) => v ? "Yes" : "No" },
  { header: "Mood", key: "mood", transform: (v) => v ? String(v) : "" },
  { header: "Status", key: "status" },
  { header: "Created By", key: "createdBy" },
];

// --- Types ---

interface DailyReportRow {
  id: string;
  date: string;
  childName: string;
  className: string;
  branchId: string;
  branchName: string;
  breakfast: string | null;
  lunch: string | null;
  sleep: boolean;
  sleepFrom: string | null;
  sleepTo: string | null;
  mood: string | null;
  status: "DRAFT" | "SUBMITTED";
  createdBy: string;
}

// --- Avatar colors ---

const avatarColors = [
  "bg-[#C35A2C]/10 text-[#C35A2C]",
  "bg-[#8B7355]/15 text-[#8B7355]",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-sky-100 text-sky-700",
  "bg-[#6B8F71]/15 text-[#6B8F71]",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-orange-100 text-orange-700",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name: string) {
  const parts = name.split(" ");
  return (parts[0]?.charAt(0) ?? "") + (parts[1]?.charAt(0) ?? "");
}

// --- Helpers ---

function getMoodConfig(mood: string): { color: string; icon: typeof Smile; label: string } {
  switch (mood) {
    case "HAPPY":
      return { color: "bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20", icon: Smile, label: "Happy" };
    case "CALM":
      return { color: "bg-[var(--color-info-light)] text-[var(--color-info-dark)] border-[var(--color-info)]/20", icon: Meh, label: "Calm" };
    case "FUSSY":
      return { color: "bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20", icon: Frown, label: "Fussy" };
    case "SLEEPY":
      return { color: "bg-violet-50 text-violet-700 border-violet-200", icon: Moon, label: "Sleepy" };
    case "CRYING":
      return { color: "bg-[var(--color-error-light)] text-[var(--color-error-dark)] border-[var(--color-error)]/20", icon: CloudMoon, label: "Crying" };
    default:
      return { color: "bg-muted text-muted-foreground border-border", icon: Meh, label: mood };
  }
}

function getPortionConfig(portion: string | null): { label: string; color: string; dots: number } {
  if (!portion) return { label: "N/A", color: "text-muted-foreground", dots: 0 };
  switch (portion) {
    case "ALL":
      return { label: "All", color: "text-[var(--color-success-dark)]", dots: 5 };
    case "MOST":
      return { label: "Most", color: "text-[var(--color-success-dark)]", dots: 4 };
    case "HALF":
      return { label: "Half", color: "text-[var(--color-warning-dark)]", dots: 3 };
    case "LITTLE":
      return { label: "Little", color: "text-[var(--color-warning)]", dots: 2 };
    case "NONE":
      return { label: "None", color: "text-[var(--color-error)]", dots: 0 };
    default:
      return { label: portion, color: "text-muted-foreground", dots: 0 };
  }
}

// --- Props ---

interface DailyReportsClientProps {
  reports: DailyReportRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  initialStatusFilter?: string;
}

// --- Meal Dots ---

function MealDots({ portion }: { portion: string | null }) {
  const config = getPortionConfig(portion);
  if (!portion) return <span className="text-xs text-muted-foreground">--</span>;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`size-1.5 rounded-full ${
              i <= config.dots
                ? portion === "ALL" || portion === "MOST"
                  ? "bg-[var(--color-success)]"
                  : portion === "HALF"
                  ? "bg-[var(--color-warning)]"
                  : "bg-[var(--color-warning)]"
                : "bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
    </div>
  );
}

// --- Page Component ---

export function DailyReportsClient({
  reports,
  branches,
  initialStatusFilter = "all",
}: DailyReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    let data = reports;

    if (search) {
      const lower = search.toLowerCase();
      data = data.filter((r) => r.childName.toLowerCase().includes(lower));
    }

    if (dateFrom) {
      data = data.filter((r) => r.date >= dateFrom);
    }

    if (dateTo) {
      data = data.filter((r) => r.date <= dateTo);
    }

    if (branchFilter && branchFilter !== "all") {
      data = data.filter((r) => r.branchId === branchFilter);
    }

    if (classFilter && classFilter !== "all") {
      data = data.filter((r) => r.className === classFilter);
    }

    if (statusFilter && statusFilter !== "all") {
      data = data.filter((r) => r.status === statusFilter);
    }

    return data;
  }, [reports, search, dateFrom, dateTo, branchFilter, classFilter, statusFilter]);

  const uniqueClasses = useMemo(
    () => [...new Set(reports.map((r) => r.className))].filter((c) => c !== "—"),
    [reports]
  );

  const activeFilterCount = [
    dateFrom,
    dateTo,
    branchFilter !== "all" ? branchFilter : "",
    classFilter !== "all" ? classFilter : "",
    statusFilter !== "all" ? statusFilter : "",
  ].filter(Boolean).length;

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteDailyReport(deleteId);
      setDeleteId(null);
      router.refresh();
    });
  }

  function handleSubmit(id: string) {
    startTransition(async () => {
      const result = await submitDailyReport(id);
      if (result.success) {
        toast.success("Report submitted");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to submit report");
      }
    });
  }

  const dailyReportColumns: ColumnDef<DailyReportRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {format(new Date(row.original.date), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      accessorKey: "childName",
      header: "Child",
      cell: ({ row }) => {
        const name = row.original.childName;
        return (
          <div className="flex items-center gap-2.5">
            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(name)}`}>
              {getInitials(name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{name}</p>
              <p className="text-[11px] text-muted-foreground">{row.original.className}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "breakfast",
      header: () => (
        <div className="flex items-center gap-1">
          <Utensils className="size-3.5 text-amber-500" />
          <span>Breakfast</span>
        </div>
      ),
      cell: ({ row }) => <MealDots portion={row.original.breakfast} />,
    },
    {
      accessorKey: "lunch",
      header: () => (
        <div className="flex items-center gap-1">
          <UtensilsCrossed className="size-3.5 text-orange-500" />
          <span>Lunch</span>
        </div>
      ),
      cell: ({ row }) => <MealDots portion={row.original.lunch} />,
    },
    {
      accessorKey: "sleep",
      header: () => (
        <div className="flex items-center gap-1">
          <BedDouble className="size-3.5 text-indigo-500" />
          <span>Sleep</span>
        </div>
      ),
      cell: ({ row }) => {
        const slept = row.original.sleep;
        return (
          <div className="flex items-center gap-1.5">
            {slept ? (
              <>
                <div className="flex size-5 items-center justify-center rounded-full bg-indigo-100">
                  <BedDouble className="size-3 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-indigo-700">Slept</span>
              </>
            ) : (
              <>
                <div className="flex size-5 items-center justify-center rounded-full bg-slate-100">
                  <SunMedium className="size-3 text-slate-500" />
                </div>
                <span className="text-xs font-medium text-slate-500">No Nap</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "mood",
      header: "Mood",
      cell: ({ row }) => {
        const mood = row.original.mood;
        if (!mood) return <span className="text-xs text-muted-foreground">--</span>;
        const config = getMoodConfig(mood);
        const Icon = config.icon;
        return (
          <Badge className={`${config.color} gap-1`}>
            <Icon className="size-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return status === "SUBMITTED" ? (
          <Badge className="bg-[var(--color-success-light)] text-[var(--color-success-dark)] border-[var(--color-success)]/20 gap-1">
            <CheckCircle2 className="size-3" />
            Submitted
          </Badge>
        ) : (
          <Badge className="bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border-[var(--color-warning)]/20 gap-1">
            <FileEdit className="size-3" />
            Draft
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "By",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.createdBy}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const report = row.original;
        return (
          <div className="flex items-center gap-1">
            {report.status === "DRAFT" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => handleSubmit(report.id)}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3.5" />}
                <span className="ml-1 text-xs">Submit</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/daily-reports/${report.id}`}>
                    <Eye className="size-4" />
                    View Report
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/daily-reports/${report.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/daily-reports/${report.id}/print`}>
                    <Printer className="size-4" />
                    Print
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteId(report.id)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
    },
  ];

  return (
    <>
      <PageHeader
        title="Daily Reports"
        breadcrumbs={[{ label: "Daily Reports" }]}
        actions={
          <Button asChild>
            <Link href="/daily-reports/new">
              <Plus className="size-4" />
              New Report
            </Link>
          </Button>
        }
      />
      <div className="p-4 space-y-4 md:p-6">
        {/* Toolbar */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative w-full sm:max-w-xs sm:flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by child name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <div className="flex w-full items-center gap-1.5 sm:w-auto">
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 sm:w-[150px] sm:flex-initial h-9"
                />
                <label className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-1">To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 sm:w-[150px] sm:flex-initial h-9"
                />
              </div>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px] h-9">
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px] h-9">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {uniqueClasses.map((cls) => (
                    <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[140px] h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                </SelectContent>
              </Select>

              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary gap-1 h-7">
                  <Filter className="size-3" />
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                </Badge>
              )}

              <div className="ml-auto flex items-center gap-2">
                <ExportButton
                  filename="daily-reports"
                  sheetName="Daily Reports"
                  columns={dailyReportsExportColumns}
                  data={filteredData as unknown as Record<string, unknown>[]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredData.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No daily reports found"
            description={
              search || dateFrom || dateTo || branchFilter !== "all" || classFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "No reports have been submitted yet. Start filling out daily reports for your class."
            }
            action={{ label: "New Report", href: "/daily-reports/new", icon: Plus }}
            secondaryAction={{ label: "Start Batch Reports", href: "/daily-reports/batch" }}
          />
        ) : (
          <DataTable columns={dailyReportColumns} data={filteredData} />
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Daily Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this daily report? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
