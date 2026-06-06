"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FileText,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/shared/export-button";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteAbsenceReport } from "@/lib/actions/absent-reports";
import type { ExportColumn } from "@/lib/export";

type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AbsenceReportRow {
  id: string;
  legacyReportId: number | null;
  childId: string;
  childNumber: string;
  photo: string | null;
  firstName: string;
  lastName: string;
  childName: string;
  branchId: string;
  branchName: string;
  classId: string | null;
  className: string;
  absenceReason: string;
  reportDate: string;
  createdAt: string;
  workflowStatus: AbsenceStatus;
  createdBy: string;
}

interface AbsentReportsClientProps {
  reports: AbsenceReportRow[];
  total: number;
  branches: Array<{ id: string; name: string }>;
  initialStatusFilter?: AbsenceStatus | "ALL";
  variant?: "reports" | "drafts";
}

interface LegacyFilters {
  identifier: string;
  firstName: string;
  lastName: string;
  reason: string;
  className: string;
  reportDate: string;
  createdFrom: string;
  createdTo: string;
}

const PAGE_SIZES = ["10", "20", "50", "100", "150", "ALL"] as const;

function childPhotoSrc(photo: string | null) {
  if (!photo || photo === "default.jpg") return "";
  if (/^https?:\/\//i.test(photo) || photo.startsWith("/")) return photo;
  if (photo.includes("/")) return `/${photo.replace(/^\/+/, "")}`;
  return `/images/EmpPhoto/${photo}`;
}

function formatDateOnly(date: string | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(date: string | null) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateValue(date: string) {
  const parsed = new Date(date);
  parsed.setHours(0, 0, 0, 0);
  return parsed.getTime();
}

function addOneDay(date: string) {
  const parsed = new Date(date);
  parsed.setHours(0, 0, 0, 0);
  parsed.setDate(parsed.getDate() + 1);
  return parsed.getTime();
}

function formatReason(reason: string) {
  const normalized = reason.trim();
  if (!normalized) return "Absent";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function reasonClass(reason: string) {
  const normalized = reason.trim().toLowerCase();
  if (normalized.includes("sick") || normalized.includes("ill")) {
    return "bg-[#c29d0b] text-white border-transparent";
  }
  if (normalized.includes("absent")) {
    return "bg-[#d64635] text-white border-transparent";
  }
  return "bg-[#707070] text-white border-transparent";
}

function workflowLabel(status: AbsenceStatus) {
  if (status === "PENDING") return "Draft";
  if (status === "APPROVED") return "Submitted";
  return "Rejected";
}

function workflowBadgeClass(status: AbsenceStatus) {
  if (status === "PENDING") return "bg-[#c29d0b] text-white border-transparent";
  if (status === "APPROVED") return "bg-[#008200] text-white border-transparent";
  return "bg-[#d64635] text-white border-transparent";
}

function ChildPhoto({ report }: { report: AbsenceReportRow }) {
  const [failed, setFailed] = useState(false);
  const src = childPhotoSrc(report.photo);

  if (!src || failed) {
    return (
      <div className="flex size-14 items-center justify-center rounded-full border bg-muted">
        <User className="size-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative size-14 overflow-hidden rounded-full border bg-muted">
      <Image
        src={src}
        alt={report.childName}
        fill
        sizes="56px"
        className="object-cover"
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function AbsentReportsClient({
  reports,
  total,
  branches,
  initialStatusFilter = "APPROVED",
  variant = "reports",
}: AbsentReportsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<AbsenceStatus | "ALL">(initialStatusFilter);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>("10");
  const [deleteTarget, setDeleteTarget] = useState<AbsenceReportRow | null>(null);
  const [legacyFilters, setLegacyFilters] = useState<LegacyFilters>({
    identifier: "",
    firstName: "",
    lastName: "",
    reason: "",
    className: "",
    reportDate: "",
    createdFrom: "",
    createdTo: "",
  });

  const identifierLabel = variant === "drafts" ? "Report #" : "Child #";

  const exportColumns = useMemo<ExportColumn[]>(
    () => [
      {
        header: identifierLabel,
        key: variant === "drafts" ? "legacyReportId" : "childNumber",
      },
      { header: "F Name", key: "firstName" },
      { header: "L Name", key: "lastName" },
      {
        header: "Status",
        key: "absenceReason",
        transform: (value) => formatReason(value as string),
      },
      { header: "Branch", key: "branchName" },
      { header: "Class", key: "className" },
      {
        header: "Report Date",
        key: "reportDate",
        transform: (value) => formatDateOnly(value as string | null),
      },
      {
        header: "Date",
        key: "createdAt",
        transform: (value) => formatDateTime(value as string | null),
      },
    ],
    [identifierLabel, variant],
  );

  const uniqueClasses = useMemo(
    () => Array.from(new Set(reports.map((report) => report.className))).filter((name) => name && name !== "—"),
    [reports],
  );

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const from = legacyFilters.createdFrom ? dateValue(legacyFilters.createdFrom) : null;
    const to = legacyFilters.createdTo ? addOneDay(legacyFilters.createdTo) : null;

    return reports.filter((report) => {
      if (variant === "drafts" && report.workflowStatus !== "PENDING") return false;
      if (variant === "reports" && statusFilter !== "ALL" && report.workflowStatus !== statusFilter) return false;
      if (branchFilter !== "ALL" && report.branchId !== branchFilter) return false;

      if (query) {
        const haystack = [
          report.legacyReportId,
          report.childNumber,
          report.firstName,
          report.lastName,
          report.absenceReason,
          report.branchName,
          report.className,
          report.reportDate,
        ].join(" ").toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      const identifier = variant === "drafts"
        ? report.legacyReportId?.toString() ?? ""
        : report.childNumber;
      if (legacyFilters.identifier && !identifier.includes(legacyFilters.identifier.trim())) return false;
      if (legacyFilters.firstName && !report.firstName.toLowerCase().includes(legacyFilters.firstName.toLowerCase())) return false;
      if (legacyFilters.lastName && !report.lastName.toLowerCase().includes(legacyFilters.lastName.toLowerCase())) return false;
      if (legacyFilters.reason && !formatReason(report.absenceReason).toLowerCase().includes(legacyFilters.reason.toLowerCase())) return false;
      if (legacyFilters.className && !report.className.toLowerCase().includes(legacyFilters.className.toLowerCase())) return false;
      if (legacyFilters.reportDate && !report.reportDate.includes(legacyFilters.reportDate.trim())) return false;

      const created = new Date(report.createdAt).getTime();
      if (from !== null && created < from) return false;
      if (to !== null && created >= to) return false;

      return true;
    });
  }, [branchFilter, legacyFilters, reports, searchQuery, statusFilter, variant]);

  const effectivePageSize = pageSize === "ALL" ? Math.max(filteredReports.length, 1) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredReports.length / effectivePageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedReports =
    pageSize === "ALL"
      ? filteredReports
      : filteredReports.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; value: string }[] = [];
    if (searchQuery) pills.push({ key: "search", label: "Search", value: searchQuery });
    if (branchFilter !== "ALL") {
      pills.push({
        key: "branch",
        label: "Branch",
        value: branches.find((branch) => branch.id === branchFilter)?.name ?? branchFilter,
      });
    }
    if (variant === "reports" && statusFilter !== "APPROVED") {
      pills.push({
        key: "workflow",
        label: "Workflow",
        value: statusFilter === "ALL" ? "All" : workflowLabel(statusFilter),
      });
    }
    if (legacyFilters.identifier) pills.push({ key: "identifier", label: identifierLabel, value: legacyFilters.identifier });
    if (legacyFilters.firstName) pills.push({ key: "firstName", label: "F Name", value: legacyFilters.firstName });
    if (legacyFilters.lastName) pills.push({ key: "lastName", label: "L Name", value: legacyFilters.lastName });
    if (legacyFilters.reason) pills.push({ key: "reason", label: "Status", value: legacyFilters.reason });
    if (legacyFilters.className) pills.push({ key: "className", label: "Class", value: legacyFilters.className });
    if (legacyFilters.reportDate) pills.push({ key: "reportDate", label: "Report Date", value: legacyFilters.reportDate });
    if (legacyFilters.createdFrom) pills.push({ key: "createdFrom", label: "Created from", value: legacyFilters.createdFrom });
    if (legacyFilters.createdTo) pills.push({ key: "createdTo", label: "Created to", value: legacyFilters.createdTo });
    return pills;
  }, [branchFilter, branches, identifierLabel, legacyFilters, searchQuery, statusFilter, variant]);

  function clearFilter(key: string) {
    if (key === "search") setSearchQuery("");
    if (key === "branch") setBranchFilter("ALL");
    if (key === "workflow") setStatusFilter("APPROVED");
    if (key in legacyFilters) {
      setLegacyFilters((current) => ({ ...current, [key]: "" }));
    }
    setPage(1);
  }

  function clearAllFilters() {
    setSearchQuery("");
    setBranchFilter("ALL");
    setStatusFilter(variant === "drafts" ? "PENDING" : "APPROVED");
    setLegacyFilters({
      identifier: "",
      firstName: "",
      lastName: "",
      reason: "",
      className: "",
      reportDate: "",
      createdFrom: "",
      createdTo: "",
    });
    setPage(1);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteAbsenceReport(deleteTarget.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Absent report deleted");
        router.refresh();
      }
      setDeleteTarget(null);
    });
  }

  const title = variant === "drafts" ? "Absent Draft Reports" : "Absent Reports";
  const listingTitle = "Absent Reports Listing";

  return (
    <>
      <PageHeader
        title={title}
        breadcrumbs={[
          { label: "Absent Reports", href: "/absent-reports" },
          ...(variant === "drafts" ? [{ label: "Drafts" }] : []),
        ]}
        actions={
          variant === "reports" ? (
            <Button asChild>
              <Link href="/absent-reports/new">
                <Plus className="size-4" />
                New Absent Report
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="hidden print:block print:mb-4 print:text-center">
        <h1 className="text-2xl font-bold text-black">{listingTitle}</h1>
        <p className="text-sm text-gray-500">
          {filteredReports.length} reports - Printed on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-6 p-4 md:p-6 print:p-0">
        <div className="grid grid-cols-1 gap-4 print:hidden sm:grid-cols-3">
          <div className="overflow-hidden rounded bg-[#327ad5] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{total}</p>
                <p className="text-xs text-white/80">{variant === "drafts" ? "Total Drafts" : "Total Reports"}</p>
              </div>
              <FileText className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="overflow-hidden rounded bg-[#1caf9a] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{filteredReports.length}</p>
                <p className="text-xs text-white/80">Filtered Rows</p>
              </div>
              <Search className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="overflow-hidden rounded bg-[#d64635] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">
                  {reports.filter((report) => report.workflowStatus === "PENDING").length}
                </p>
                <p className="text-xs text-white/80">Draft Reports</p>
              </div>
              <CalendarDays className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        <Card className="print:border-none print:shadow-none">
          <CardHeader className="print:hidden">
            <CardTitle className="text-lg">{listingTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 print:p-0 print:space-y-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setPage(1);
                  }}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <Select
                value={branchFilter}
                onValueChange={(value) => {
                  setBranchFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]">
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

              {variant === "reports" && (
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as AbsenceStatus | "ALL");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">Submitted</SelectItem>
                    <SelectItem value="PENDING">Draft</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Select
                value={legacyFilters.className || "ALL"}
                onValueChange={(value) => {
                  setLegacyFilters((current) => ({ ...current, className: value === "ALL" ? "" : value }));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Classes</SelectItem>
                  {uniqueClasses.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="ml-auto flex items-center gap-2">
                <ExportButton
                  filename={variant === "drafts" ? "draft-absent-reports" : "absent-reports"}
                  sheetName={variant === "drafts" ? "Absent Draft Reports" : listingTitle}
                  columns={exportColumns}
                  data={filteredReports as unknown as Record<string, unknown>[]}
                />
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="size-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 print:hidden sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
              <Input
                placeholder={identifierLabel}
                value={legacyFilters.identifier}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, identifier: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="F Name"
                value={legacyFilters.firstName}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, firstName: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="L Name"
                value={legacyFilters.lastName}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, lastName: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="Status"
                value={legacyFilters.reason}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, reason: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                placeholder="Report Date"
                value={legacyFilters.reportDate}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, reportDate: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={legacyFilters.createdFrom}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, createdFrom: event.target.value }));
                  setPage(1);
                }}
              />
              <Input
                type="date"
                value={legacyFilters.createdTo}
                onChange={(event) => {
                  setLegacyFilters((current) => ({ ...current, createdTo: event.target.value }));
                  setPage(1);
                }}
              />
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="size-4" />
                Clear
              </Button>
            </div>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                <span className="text-xs text-muted-foreground">Filters:</span>
                {activeFilters.map((filter) => (
                  <Badge key={filter.key} variant="secondary" className="gap-1 pl-2.5 pr-1 text-xs font-normal">
                    {filter.label}: <span className="font-medium">{filter.value}</span>
                    <button
                      type="button"
                      onClick={() => clearFilter(filter.key)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearAllFilters}>
                  Clear all
                </Button>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm print:rounded-none print:border-gray-300 print:shadow-none">
              <div className="overflow-x-auto print:overflow-visible">
                <Table className="min-w-[1040px] print:min-w-0 print:w-full print:text-[11px]">
                  <TableHeader className="sticky top-0 z-10">
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{identifierLabel}</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Image</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">F Name</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">L Name</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Branch</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Class</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Report Date</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                      <TableHead className="bg-muted/60 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground print:hidden">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : paginatedReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                          No absent reports found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedReports.map((report) => (
                        <TableRow key={report.id} className="group border-border/40 transition-colors hover:bg-accent/40">
                          <TableCell className="px-3 py-3 text-sm font-medium">
                            {variant === "drafts" ? report.legacyReportId ?? "—" : report.childNumber}
                          </TableCell>
                          <TableCell className="px-3 py-3">
                            <ChildPhoto report={report} />
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm font-medium">{report.firstName}</TableCell>
                          <TableCell className="px-3 py-3 text-sm font-medium">{report.lastName}</TableCell>
                          <TableCell className="px-3 py-3">
                            <Badge className={`text-[10px] ${reasonClass(report.absenceReason)}`}>
                              {formatReason(report.absenceReason)}
                            </Badge>
                            {(variant === "drafts" || report.workflowStatus !== "APPROVED") && (
                              <Badge className={`ml-1 text-[10px] ${workflowBadgeClass(report.workflowStatus)}`}>
                                {workflowLabel(report.workflowStatus)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{report.branchName}</TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{report.className}</TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{formatDateOnly(report.reportDate)}</TableCell>
                          <TableCell className="px-3 py-3 text-sm text-muted-foreground">{formatDateTime(report.createdAt)}</TableCell>
                          <TableCell className="px-3 py-3 text-right print:hidden">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button asChild variant="ghost" size="icon-sm">
                                <Link href={`/absent-reports/${report.id}`}>
                                  <Eye className="size-4 text-muted-foreground" />
                                </Link>
                              </Button>
                              <Button asChild variant="ghost" size="icon-sm">
                                <Link href={`/absent-reports/${report.id}/edit`}>
                                  <Pencil className="size-4 text-muted-foreground" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(report)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {filteredReports.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{Math.min((currentPage - 1) * effectivePageSize + 1, filteredReports.length)}</span>
                  {" "}-{" "}
                  <span className="font-medium text-foreground">{Math.min(currentPage * effectivePageSize, filteredReports.length)}</span>
                  {" "}of <span className="font-medium text-foreground">{filteredReports.length}</span> reports
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows:</span>
                  <Select
                    value={pageSize}
                    onValueChange={(value) => {
                      setPageSize(value as (typeof PAGE_SIZES)[number]);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[82px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size === "ALL" ? "All" : size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(1)} disabled={currentPage <= 1}>
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="min-w-[5rem] text-center text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{currentPage}</span> / {pageCount}
                    </span>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount}>
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(pageCount)} disabled={currentPage >= pageCount}>
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Absent Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report for <strong>{deleteTarget?.childName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
