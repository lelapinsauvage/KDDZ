"use client";

import { useMemo, useState, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { ExportButton } from "@/components/shared/export-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowUpDown,
  Clock,
  Pencil,
  Printer,
  Search,
  Upload,
  X,
} from "lucide-react";
import { updateAttendanceLog } from "@/lib/actions/employee-events";
import type { ExportColumn } from "@/lib/export";

interface AttendanceLog {
  id: string;
  legacyId: number | null;
  employeeId: string;
  employeeType: string;
  employeeName: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: string | null;
  readerId: string | null;
  readerName: string | null;
  cardId: string | null;
  note: string | null;
  legacyReaderId: string | null;
  legacyReaderName: string | null;
  legacyDate: string | null;
  legacyTime: string | null;
  legacyStatus: string | null;
  legacyCardId: string | null;
  legacyTeacherNo: string | null;
  legacyDefault: string | null;
  legacyDatetime: string | null;
  createdAt: string;
}

export interface AttendanceLogFilters {
  q: string;
  log: string;
  readerId: string;
  reader: string;
  logDate: string;
  logTime: string;
  status: string;
  cardId: string;
  teacherNo: string;
  note: string;
  datetime: string;
}

interface AttendanceLogsClientProps {
  logs: AttendanceLog[];
  initialDateFrom?: string;
  initialDateTo?: string;
  initialFilters: AttendanceLogFilters;
}

const EMPTY_FILTERS: AttendanceLogFilters = {
  q: "",
  log: "",
  readerId: "",
  reader: "",
  logDate: "",
  logTime: "",
  status: "",
  cardId: "",
  teacherNo: "",
  note: "",
  datetime: "",
};

const FILTER_KEYS = Object.keys(EMPTY_FILTERS) as Array<keyof AttendanceLogFilters>;

const attendanceExportColumns: ExportColumn[] = [
  { header: "Log", key: "log" },
  { header: "Reader ID", key: "readerId" },
  { header: "Reader", key: "reader" },
  { header: "Date", key: "date" },
  { header: "Time", key: "time" },
  { header: "Status", key: "status" },
  { header: "Card ID", key: "cardId" },
  { header: "Teacher No", key: "teacherNo" },
  { header: "Note", key: "note" },
  { header: "Datetime", key: "datetime" },
];

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizedDate(value: string | null | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return `${compact[1]}-${compact[2]}-${compact[3]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString().slice(0, 10);
}

function legacyDateDisplay(value: string | null | undefined) {
  return String(value ?? "").trim() || "-";
}

function legacyTimeDisplay(log: AttendanceLog) {
  return log.legacyTime || log.timeIn || log.timeOut || "-";
}

function legacyDatetimeDisplay(log: AttendanceLog) {
  if (log.legacyDatetime) return log.legacyDatetime;
  const date = new Date(log.createdAt);
  if (Number.isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function legacyStatus(log: AttendanceLog) {
  return log.legacyStatus || log.status || "-";
}

function legacySearchText(log: AttendanceLog) {
  return [
    log.legacyId,
    log.legacyReaderId,
    log.legacyReaderName,
    log.legacyDate,
    log.legacyTime,
    log.legacyStatus,
    log.legacyCardId,
    log.legacyTeacherNo,
    log.legacyDefault,
    log.legacyDatetime,
    log.employeeName,
  ]
    .filter(Boolean)
    .join(" ");
}

function includesFilter(value: unknown, filter: string) {
  if (!filter) return true;
  return String(value ?? "").toLowerCase().includes(filter.toLowerCase());
}

function sortableHeader(label: string) {
  return function Header({
    column,
  }: {
    column: {
      toggleSorting: (desc?: boolean) => void;
      getIsSorted: () => false | "asc" | "desc";
    };
  }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-1 size-3" />
      </Button>
    );
  };
}

export function AttendanceLogsClient({
  logs: initialLogs,
  initialDateFrom,
  initialDateTo,
  initialFilters,
}: AttendanceLogsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState(initialLogs);
  const [dateFrom, setDateFrom] = useState(initialDateFrom || todayIso());
  const [dateTo, setDateTo] = useState(initialDateTo || todayIso());
  const [filters, setFilters] = useState<AttendanceLogFilters>({
    ...EMPTY_FILTERS,
    ...initialFilters,
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [editDateOut, setEditDateOut] = useState("");
  const [editTimeOut, setEditTimeOut] = useState("");
  const [editDateIn, setEditDateIn] = useState("");
  const [editTimeIn, setEditTimeIn] = useState("");

  function updateFilter(key: keyof AttendanceLogFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setFilters({ ...EMPTY_FILTERS });
  }

  function openEditDialog(log: AttendanceLog) {
    setEditingLog(log);
    setEditDateOut(log.date);
    setEditTimeOut(log.timeOut ?? "");
    setEditDateIn(log.date);
    setEditTimeIn(log.timeIn ?? "");
    setEditDialogOpen(true);
  }

  function handleUpdate() {
    if (!editingLog) return;

    startTransition(async () => {
      const result = await updateAttendanceLog(editingLog.id, {
        timeIn: editTimeIn || null,
        timeOut: editTimeOut || null,
      });

      if (result.success) {
        setLogs((prev) =>
          prev.map((log) =>
            log.id === editingLog.id
              ? {
                  ...log,
                  timeIn: editTimeIn || null,
                  timeOut: editTimeOut || null,
                }
              : log,
          ),
        );
      }
      setEditDialogOpen(false);
    });
  }

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const logDate = normalizedDate(log.legacyDate || log.date);
        if (dateFrom && logDate < dateFrom) return false;
        if (dateTo && logDate > dateTo) return false;
        if (!includesFilter(log.legacyId, filters.log)) return false;
        if (!includesFilter(log.legacyReaderId, filters.readerId)) return false;
        if (!includesFilter(log.legacyReaderName, filters.reader)) return false;
        if (!includesFilter(log.legacyDate, filters.logDate)) return false;
        if (!includesFilter(log.legacyTime, filters.logTime)) return false;
        if (!includesFilter(legacyStatus(log), filters.status)) return false;
        if (!includesFilter(log.legacyCardId, filters.cardId)) return false;
        if (!includesFilter(log.legacyTeacherNo, filters.teacherNo)) return false;
        if (!includesFilter(log.legacyDefault, filters.note)) return false;
        if (!includesFilter(legacyDatetimeDisplay(log), filters.datetime)) return false;
        if (!includesFilter(legacySearchText(log), filters.q)) return false;
        return true;
      })
      .sort((a, b) => {
        const aLegacy = a.legacyId ?? 0;
        const bLegacy = b.legacyId ?? 0;
        if (aLegacy !== bLegacy) return bLegacy - aLegacy;
        return legacyDatetimeDisplay(b).localeCompare(legacyDatetimeDisplay(a));
      });
  }, [dateFrom, dateTo, filters, logs]);

  const exportRows = useMemo(
    () =>
      filteredLogs.map((log) => ({
        log: log.legacyId ?? log.id,
        readerId: log.legacyReaderId ?? "",
        reader: log.legacyReaderName ?? "",
        date: log.legacyDate ?? "",
        time: legacyTimeDisplay(log),
        status: legacyStatus(log),
        cardId: log.legacyCardId ?? "",
        teacherNo: log.legacyTeacherNo ?? "",
        note: log.legacyDefault ?? "",
        datetime: legacyDatetimeDisplay(log),
      })),
    [filteredLogs],
  );

  const hasFilters =
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    FILTER_KEYS.some((key) => filters[key].trim() !== "");

  const columns: ColumnDef<AttendanceLog>[] = useMemo(
    () => [
      {
        accessorKey: "legacyId",
        header: sortableHeader("Log"),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium text-muted-foreground">
            {row.original.legacyId ?? row.original.id.slice(0, 8)}
          </span>
        ),
      },
      {
        id: "readerId",
        accessorFn: (row) => row.legacyReaderId ?? "",
        header: sortableHeader("Reader ID"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.legacyReaderId ?? "-"}
          </span>
        ),
      },
      {
        id: "readerName",
        accessorFn: (row) => row.legacyReaderName ?? "",
        header: sortableHeader("Reader"),
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {row.original.legacyReaderName ?? "-"}
          </span>
        ),
      },
      {
        id: "legacyDate",
        accessorFn: (row) => row.legacyDate ?? "",
        header: sortableHeader("Date"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {legacyDateDisplay(row.original.legacyDate)}
          </span>
        ),
      },
      {
        id: "legacyTime",
        accessorFn: (row) => row.legacyTime ?? "",
        header: sortableHeader("Time"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {legacyTimeDisplay(row.original)}
          </span>
        ),
      },
      {
        id: "legacyStatus",
        accessorFn: (row) => legacyStatus(row),
        header: sortableHeader("Status"),
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs font-normal">
            {legacyStatus(row.original)}
          </Badge>
        ),
      },
      {
        id: "cardId",
        accessorFn: (row) => row.legacyCardId ?? "",
        header: sortableHeader("Card ID"),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.legacyCardId ?? "-"}
          </span>
        ),
      },
      {
        id: "teacherNo",
        accessorFn: (row) => row.legacyTeacherNo ?? "",
        header: sortableHeader("Teacher No"),
        cell: ({ row }) => (
          <span className="max-w-[220px] truncate text-sm">
            {row.original.legacyTeacherNo ?? "-"}
          </span>
        ),
      },
      {
        id: "legacyDefault",
        accessorFn: (row) => row.legacyDefault ?? "",
        header: sortableHeader("Note"),
        cell: ({ row }) => (
          <span className="max-w-[180px] truncate text-xs text-muted-foreground">
            {row.original.legacyDefault ?? "-"}
          </span>
        ),
      },
      {
        id: "legacyDatetime",
        accessorFn: (row) => legacyDatetimeDisplay(row),
        header: sortableHeader("Datetime"),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="whitespace-nowrap font-mono text-xs text-muted-foreground">
              {legacyDatetimeDisplay(row.original)}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Update log"
            onClick={() => openEditDialog(row.original)}
          >
            <Pencil className="size-3.5" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Logs Listing"
        breadcrumbs={[
          { label: "Employees", href: "/employees/teachers" },
          { label: "Attendance Logs" },
        ]}
      />
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} log entries
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ExportButton
              filename="attendance-logs"
              sheetName="Attendance Logs"
              columns={attendanceExportColumns}
              data={exportRows}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredLogs.length === 0}
              onClick={() => window.print()}
            >
              <Printer className="mr-1 size-4" />
              Print
            </Button>
          </div>
        </div>

        <div className="space-y-2 print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search logs"
                placeholder="Search logs..."
                value={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-sm text-muted-foreground">
                From
              </Label>
              <Input
                type="date"
                className="w-[140px] sm:w-[160px]"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap text-sm text-muted-foreground">
                To
              </Label>
              <Input
                type="date"
                className="w-[140px] sm:w-[160px]"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!hasFilters}
              onClick={clearFilters}
            >
              <X className="mr-1 size-4" />
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              aria-label="Filter by log"
              placeholder="Log"
              value={filters.log}
              onChange={(event) => updateFilter("log", event.target.value)}
            />
            <Input
              aria-label="Filter by reader ID"
              placeholder="Reader ID"
              value={filters.readerId}
              onChange={(event) => updateFilter("readerId", event.target.value)}
            />
            <Input
              aria-label="Filter by reader"
              placeholder="Reader"
              value={filters.reader}
              onChange={(event) => updateFilter("reader", event.target.value)}
            />
            <Input
              aria-label="Filter by log date"
              type="date"
              value={filters.logDate}
              onChange={(event) => updateFilter("logDate", event.target.value)}
            />
            <Input
              aria-label="Filter by log time"
              type="time"
              value={filters.logTime}
              onChange={(event) => updateFilter("logTime", event.target.value)}
            />
            <Input
              aria-label="Filter by status"
              placeholder="Status"
              value={filters.status}
              onChange={(event) => updateFilter("status", event.target.value)}
            />
            <Input
              aria-label="Filter by card ID"
              placeholder="Card ID"
              value={filters.cardId}
              onChange={(event) => updateFilter("cardId", event.target.value)}
            />
            <Input
              aria-label="Filter by teacher number"
              placeholder="Teacher No"
              value={filters.teacherNo}
              onChange={(event) => updateFilter("teacherNo", event.target.value)}
            />
            <Input
              aria-label="Filter by note"
              placeholder="Note"
              value={filters.note}
              onChange={(event) => updateFilter("note", event.target.value)}
            />
            <Input
              aria-label="Filter by datetime"
              placeholder="Datetime"
              value={filters.datetime}
              onChange={(event) => updateFilter("datetime", event.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredLogs}
          pageSizeOptions={[10, 20, 50, 100, 150, "all"]}
        />
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Log Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Date Out</Label>
              <Input
                type="date"
                value={editDateOut}
                onChange={(event) => setEditDateOut(event.target.value)}
              />
            </div>
            <div>
              <Label>Time Out</Label>
              <Input
                type="time"
                value={editTimeOut}
                onChange={(event) => setEditTimeOut(event.target.value)}
              />
            </div>
            <div>
              <Label>Date In</Label>
              <Input
                type="date"
                value={editDateIn}
                onChange={(event) => setEditDateIn(event.target.value)}
              />
            </div>
            <div>
              <Label>Time In</Label>
              <Input
                type="time"
                value={editTimeIn}
                onChange={(event) => setEditTimeIn(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleUpdate}
              disabled={isPending}
            >
              <Upload className="size-4" />
              {isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
