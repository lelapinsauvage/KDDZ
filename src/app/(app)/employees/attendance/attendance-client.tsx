"use client";

import { useCallback, useMemo, useState, useTransition, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Upload,
  FileSpreadsheet,
  UserCheck,
  Save,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { bulkCreateAttendanceLogs } from "@/lib/actions/employee-events";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeAttendance {
  id: string;
  legacyId: number | null;
  legacyKey: string | null;
  employeeName: string;
  role: string;
  branch: string;
  isActive: boolean;
}

interface BranchOption {
  id: string;
  name: string;
}

interface AttendanceClientProps {
  employees: EmployeeAttendance[];
  branches: BranchOption[];
}

type AttendanceStatus = "present" | "absent" | "late";
type AttendanceLogStatusValue =
  | "CHECK_IN"
  | "CHECK_OUT"
  | "LATE"
  | "EARLY_LEAVE";

interface AttendanceEntry {
  employeeId: string;
  status: AttendanceStatus;
  timeIn: string;
  timeOut: string;
  note: string;
}

interface AttendanceUploadLog {
  employeeId: string;
  employeeType: string;
  date: string;
  timeIn?: string;
  timeOut?: string;
  status?: AttendanceLogStatusValue;
  readerId?: string;
  readerName?: string;
  cardId?: string;
  note?: string;
}

interface CsvParseResult {
  format: "legacy-scanner" | "current-template" | "mixed";
  logs: AttendanceUploadLog[];
  skipped: number;
  unmatched: number;
  invalid: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const roleColors: Record<string, string> = {
  Teacher: "bg-blue-100 text-blue-700",
  Nurse: "bg-pink-100 text-pink-700",
  Doctor: "bg-purple-100 text-purple-700",
  Manager: "bg-amber-100 text-amber-700",
};

function cleanCell(value: string | undefined): string {
  return (value ?? "").replace(/^\uFEFF/, "").trim();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (quoted && next === "\"") {
        cell += "\"";
        index++;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cleanCell(cell));
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index++;
      row.push(cleanCell(cell));
      if (row.some((entry) => entry.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cleanCell(cell));
  if (row.some((entry) => entry.length > 0)) rows.push(row);

  return rows.filter((entry) => cleanCell(entry[0]).toLowerCase() !== "sep=,");
}

function normalizeAttendanceName(value: string | null | undefined): string {
  const cleaned = cleanCell(value ?? undefined);
  if (!cleaned) return "";
  return cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeAttendanceCard(value: string | null | undefined): string | null {
  const cleaned = cleanCell(value ?? undefined);
  if (!cleaned) return null;
  const withoutLeadingZeroes = cleaned.replace(/^0+/, "");
  return withoutLeadingZeroes || "0";
}

function normalizeHeader(value: string | undefined) {
  return cleanCell(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isHeaderRow(row: string[]) {
  const cells = row.map(normalizeHeader);
  return (
    cells[0] === "readerid" ||
    cells[0] === "employeename" ||
    (cells[0] === "name" && cells[2] === "timein") ||
    (cells[0] === "reader" && cells[1] === "readername")
  );
}

function dateIso(year: string, month: string, day: string): string | null {
  const normalized = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  if (
    parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return normalized;
}

function parseLegacyDate(value: string | null | undefined): string | null {
  const cleaned = cleanCell(value ?? undefined);
  if (!cleaned || cleaned === "0" || cleaned === "0000-00-00") return null;

  const compact = cleaned.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compact) return dateIso(compact[1], compact[2], compact[3]);

  const iso = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return dateIso(iso[1], iso[2], iso[3]);

  const dmy = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    return dateIso(dmy[3], dmy[2], dmy[1]);
  }

  const ymd = cleaned.match(/^(\d{4})[/](\d{1,2})[/](\d{1,2})$/);
  if (ymd) {
    return dateIso(ymd[1], ymd[2], ymd[3]);
  }

  return null;
}

function parseLegacyTime(value: string | null | undefined): string | null {
  const cleaned = cleanCell(value ?? undefined);
  if (!cleaned || cleaned === "0") return null;

  if (/^\d{1,4}$/.test(cleaned)) {
    const padded = cleaned.padStart(4, "0");
    const hours = Number(padded.slice(0, 2));
    const minutes = Number(padded.slice(2, 4));
    if (hours > 23 || minutes > 59) return null;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  }

  const match = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? "0");
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function legacyTimeHour(value: string | null): number | null {
  if (!value) return null;
  const hour = Number(value.slice(0, 2));
  return Number.isFinite(hour) ? hour : null;
}

function mapLegacyAttendanceStatus(
  value: string | null | undefined,
  time: string | null,
): AttendanceLogStatusValue | undefined {
  const normalized = cleanCell(value ?? undefined)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["out", "exit", "check_out", "checkout"].includes(normalized)) {
    return "CHECK_OUT";
  }
  if (["entry", "in", "check_in", "checkin"].includes(normalized)) {
    const hour = legacyTimeHour(time);
    return hour !== null && hour >= 12 ? "CHECK_OUT" : "CHECK_IN";
  }
  if (normalized === "late") return "LATE";
  if (normalized === "early_leave" || normalized === "earlyleave") {
    return "EARLY_LEAVE";
  }
  return undefined;
}

function isClockOutStatus(status: AttendanceLogStatusValue | undefined) {
  return status === "CHECK_OUT" || status === "EARLY_LEAVE";
}

function isLegacyScannerRow(row: string[]) {
  return row.length >= 8 && Boolean(parseLegacyDate(row[2]) && parseLegacyTime(row[3]));
}

function uniqueNameMap(employees: EmployeeAttendance[]) {
  const grouped = new Map<string, EmployeeAttendance[]>();
  for (const employee of employees) {
    const key = normalizeAttendanceName(employee.employeeName);
    if (!key) continue;
    const matches = grouped.get(key) ?? [];
    matches.push(employee);
    grouped.set(key, matches);
  }

  const unique = new Map<string, EmployeeAttendance>();
  for (const [name, matches] of grouped.entries()) {
    if (matches.length === 1) unique.set(name, matches[0]);
  }
  return unique;
}

function employeeTypeFor(role: string) {
  return role.toLowerCase();
}

function buildCardSeedMap(
  legacyRows: string[][],
  exactTeacherByName: Map<string, EmployeeAttendance>,
) {
  const teacherByCard = new Map<string, EmployeeAttendance>();
  const ambiguousCards = new Set<string>();

  for (const row of legacyRows) {
    const card = normalizeAttendanceCard(row[5]);
    const teacher = exactTeacherByName.get(normalizeAttendanceName(row[6]));
    if (!card || !teacher || ambiguousCards.has(card)) continue;

    const existing = teacherByCard.get(card);
    if (existing && existing.id !== teacher.id) {
      teacherByCard.delete(card);
      ambiguousCards.add(card);
      continue;
    }
    teacherByCard.set(card, teacher);
  }

  return teacherByCard;
}

function legacyRawNote(params: {
  row: string[];
  matchedBy: string;
  status?: AttendanceLogStatusValue;
}) {
  const [readerid, readername, tdate, ttime, status, cardid, teacherId, tdefault] =
    params.row;
  return JSON.stringify({
    source: "runtime_legacy_attendance_upload",
    sourceTable: "t_teacher_attendance",
    legacyReaderId: cleanCell(readerid),
    legacyReaderName: cleanCell(readername),
    legacyDate: cleanCell(tdate),
    legacyTime: cleanCell(ttime),
    legacyStatus: cleanCell(status),
    legacyCardId: cleanCell(cardid),
    legacyTeacherName: cleanCell(teacherId),
    legacyDefault: cleanCell(tdefault),
    mappedStatus: params.status ?? null,
    matchedBy: params.matchedBy,
    legacyData: {
      readerid: cleanCell(readerid),
      readername: cleanCell(readername),
      tdate: cleanCell(tdate),
      ttime: cleanCell(ttime),
      status: cleanCell(status),
      cardid: cleanCell(cardid),
      teacher_id: cleanCell(teacherId),
      tdefault: cleanCell(tdefault),
    },
  });
}

function buildLegacyScannerLog(
  row: string[],
  employeesByLegacyId: Map<number, EmployeeAttendance>,
  exactTeacherByName: Map<string, EmployeeAttendance>,
  teacherByCard: Map<string, EmployeeAttendance>,
): { log?: AttendanceUploadLog; invalid?: boolean; unmatched?: boolean } {
  const date = parseLegacyDate(row[2]);
  const time = parseLegacyTime(row[3]);
  if (!date || !time) return { invalid: true };

  const legacyTeacherNumber = Number(cleanCell(row[6]));
  const legacyIdMatch = Number.isFinite(legacyTeacherNumber)
    ? employeesByLegacyId.get(legacyTeacherNumber)
    : undefined;
  const exactName = exactTeacherByName.get(normalizeAttendanceName(row[6]));
  const card = normalizeAttendanceCard(row[5]);
  const cardMatch = card ? teacherByCard.get(card) : undefined;
  const teacher = legacyIdMatch ?? exactName ?? cardMatch;
  if (!teacher) return { unmatched: true };

  const status = mapLegacyAttendanceStatus(row[4], time);
  const matchedBy = legacyIdMatch
    ? "legacy_id"
    : exactName
      ? "teacher_name"
      : "cardid_from_name_seed";
  const clockOut = isClockOutStatus(status);

  return {
    log: {
      employeeId: teacher.id,
      employeeType: "teacher",
      date,
      ...(clockOut ? { timeOut: time } : { timeIn: time }),
      status,
      readerId: cleanCell(row[0]) || undefined,
      readerName: cleanCell(row[1]) || undefined,
      cardId: cleanCell(row[5]) || undefined,
      note: legacyRawNote({ row, matchedBy, status }),
    },
  };
}

function buildCurrentTemplateLog(
  row: string[],
  employeesByName: Map<string, EmployeeAttendance>,
): { log?: AttendanceUploadLog; invalid?: boolean; unmatched?: boolean } {
  const [name, dateValue, timeInValue, timeOutValue, statusValue, note] = row;
  const employee = employeesByName.get(normalizeAttendanceName(name));
  if (!employee) return { unmatched: true };

  const date = parseLegacyDate(dateValue);
  if (!date) return { invalid: true };

  const timeIn = parseLegacyTime(timeInValue) ?? undefined;
  const timeOut = parseLegacyTime(timeOutValue) ?? undefined;
  const status = mapLegacyAttendanceStatus(statusValue, timeIn ?? timeOut ?? null);

  return {
    log: {
      employeeId: employee.id,
      employeeType: employeeTypeFor(employee.role),
      date,
      timeIn,
      timeOut,
      status: status ?? "CHECK_IN",
      readerName: employee.employeeName,
      note: cleanCell(note) || undefined,
    },
  };
}

function buildAttendanceLogsFromCsv(
  rows: string[][],
  employees: EmployeeAttendance[],
): CsvParseResult {
  const dataRows = rows.filter((row) => !isHeaderRow(row));
  const legacyRows = dataRows.filter(isLegacyScannerRow);
  const employeesByName = uniqueNameMap(employees);
  const teachers = employees.filter((employee) => employee.role === "Teacher");
  const exactTeacherByName = uniqueNameMap(teachers);
  const employeesByLegacyId = new Map<number, EmployeeAttendance>();
  for (const teacher of teachers) {
    if (typeof teacher.legacyId === "number") {
      employeesByLegacyId.set(teacher.legacyId, teacher);
    }
  }
  const teacherByCard = buildCardSeedMap(legacyRows, exactTeacherByName);

  let skipped = 0;
  let unmatched = 0;
  let invalid = 0;
  let legacyCount = 0;
  let templateCount = 0;
  const logs: AttendanceUploadLog[] = [];

  for (const row of dataRows) {
    const parsed = isLegacyScannerRow(row)
      ? buildLegacyScannerLog(
          row,
          employeesByLegacyId,
          exactTeacherByName,
          teacherByCard,
        )
      : buildCurrentTemplateLog(row, employeesByName);

    if (parsed.log) {
      logs.push(parsed.log);
      if (isLegacyScannerRow(row)) {
        legacyCount++;
      } else {
        templateCount++;
      }
      continue;
    }

    skipped++;
    if (parsed.unmatched) unmatched++;
    if (parsed.invalid) invalid++;
  }

  return {
    format:
      legacyCount > 0 && templateCount > 0
        ? "mixed"
        : legacyCount > 0
          ? "legacy-scanner"
          : "current-template",
    logs,
    skipped,
    unmatched,
    invalid,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttendanceClient({
  employees,
  branches,
}: AttendanceClientProps) {
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const [dateFilter, setDateFilter] = useState(today);
  const [branchFilter, setBranchFilter] = useState("ALL");

  // Attendance entries keyed by employee ID
  const [entries, setEntries] = useState<Map<string, AttendanceEntry>>(new Map());

  // CSV upload state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

  // Result feedback
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((a) => {
      if (branchFilter !== "ALL" && a.branch !== branchFilter) return false;
      if (!a.isActive) return false;
      return true;
    });
  }, [branchFilter, employees]);

  // Get or create entry
  const getEntry = useCallback(
    (employeeId: string): AttendanceEntry => {
      return (
        entries.get(employeeId) ?? {
          employeeId,
          status: "present",
          timeIn: "",
          timeOut: "",
          note: "",
        }
      );
    },
    [entries]
  );

  const updateEntry = useCallback(
    (employeeId: string, partial: Partial<AttendanceEntry>) => {
      setEntries((prev) => {
        const next = new Map(prev);
        const current =
          prev.get(employeeId) ?? {
            employeeId,
            status: "present",
            timeIn: "",
            timeOut: "",
            note: "",
          };
        next.set(employeeId, { ...current, ...partial });
        return next;
      });
    },
    []
  );

  // Submit manual attendance
  function handleSubmitAttendance() {
    const logsToCreate = filtered.map((emp) => {
      const entry = getEntry(emp.id);
      return {
        employeeId: emp.id,
        employeeType: emp.role.toLowerCase(),
        date: dateFilter,
        timeIn: entry.timeIn || undefined,
        timeOut: entry.timeOut || undefined,
        status:
          entry.status === "late"
            ? ("LATE" as const)
            : entry.status === "present"
              ? ("CHECK_IN" as const)
              : undefined,
        readerName: emp.employeeName,
        note: entry.status === "absent" ? "Absent" : entry.note || undefined,
      };
    });

    startTransition(async () => {
      const result = await bulkCreateAttendanceLogs(logsToCreate);
      if (result.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = (result.data as any)?.count ?? 0;
        setResultMessage({
          type: "success",
          text: `Successfully uploaded ${count} attendance records for ${dateFilter}`,
        });
        setEntries(new Map());
      } else {
        setResultMessage({
          type: "error",
          text: result.error ?? "Failed to upload attendance",
        });
      }
    });
  }

  // CSV file handler
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setResultMessage({ type: "error", text: "Please upload a CSV file only" });
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setCsvPreview(rows.slice(0, 10)); // Preview first 10 rows
      setCsvDialogOpen(true);
    };
    reader.readAsText(file);
  }

  // Process CSV upload
  function handleCsvUpload() {
    if (!csvFile) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      const parsed = buildAttendanceLogsFromCsv(rows, employees);

      if (parsed.logs.length === 0) {
        setResultMessage({
          type: "error",
          text:
            parsed.skipped > 0
              ? `No valid rows found. ${parsed.unmatched} unmatched, ${parsed.invalid} invalid.`
              : "No valid rows found in the CSV file.",
        });
        setCsvDialogOpen(false);
        return;
      }

      startTransition(async () => {
        const result = await bulkCreateAttendanceLogs(parsed.logs);
        if (result.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const count = (result.data as any)?.count ?? 0;
          const skipped =
            parsed.skipped > 0
              ? ` ${parsed.skipped} skipped (${parsed.unmatched} unmatched, ${parsed.invalid} invalid).`
              : "";
          setResultMessage({
            type: "success",
            text: `Successfully uploaded ${count} ${parsed.format === "legacy-scanner" ? "legacy scanner" : "attendance"} records from CSV.${skipped}`,
          });
        } else {
          setResultMessage({
            type: "error",
            text: result.error ?? "Failed to upload CSV data",
          });
        }
        setCsvDialogOpen(false);
        setCsvFile(null);
        setCsvPreview([]);
      });
    };
    reader.readAsText(csvFile);
  }

  // Table columns
  const columns: ColumnDef<EmployeeAttendance>[] = useMemo(
    () => [
      {
        accessorKey: "employeeName",
        header: "Employee",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <UserCheck className="size-4 text-primary" />
            <span className="font-medium">{row.original.employeeName}</span>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge
            className={
              roleColors[row.original.role] ?? "bg-gray-100 text-gray-700"
            }
          >
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "branch",
        header: "Branch",
      },
      {
        id: "present",
        header: "Present",
        cell: ({ row }) => {
          const entry = getEntry(row.original.id);
          return (
            <Checkbox
              checked={entry.status === "present"}
              onCheckedChange={() =>
                updateEntry(row.original.id, { status: "present" })
              }
            />
          );
        },
      },
      {
        id: "absent",
        header: "Absent",
        cell: ({ row }) => {
          const entry = getEntry(row.original.id);
          return (
            <Checkbox
              checked={entry.status === "absent"}
              onCheckedChange={() =>
                updateEntry(row.original.id, { status: "absent" })
              }
            />
          );
        },
      },
      {
        id: "late",
        header: "Late",
        cell: ({ row }) => {
          const entry = getEntry(row.original.id);
          return (
            <Checkbox
              checked={entry.status === "late"}
              onCheckedChange={() =>
                updateEntry(row.original.id, { status: "late" })
              }
            />
          );
        },
      },
      {
        id: "timeIn",
        header: "Time In",
        cell: ({ row }) => {
          const entry = getEntry(row.original.id);
          return (
            <Input
              type="time"
              className="w-[120px] h-8 text-sm"
              value={entry.timeIn}
              onChange={(e) =>
                updateEntry(row.original.id, { timeIn: e.target.value })
              }
            />
          );
        },
      },
      {
        id: "timeOut",
        header: "Time Out",
        cell: ({ row }) => {
          const entry = getEntry(row.original.id);
          return (
            <Input
              type="time"
              className="w-[120px] h-8 text-sm"
              value={entry.timeOut}
              onChange={(e) =>
                updateEntry(row.original.id, { timeOut: e.target.value })
              }
            />
          );
        },
      },
    ],
    [getEntry, updateEntry],
  );

  return (
    <>
      <PageHeader
        title="Employee Attendance"
        breadcrumbs={[
          { label: "Employees", href: "/employees/teachers" },
          { label: "Attendance" },
        ]}
      />
      <div className="space-y-4 p-4 md:p-6">
        {/* Result message */}
        {resultMessage && (
          <div
            className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
              resultMessage.type === "success"
                ? "border-[#059669]/20 bg-[#059669]/10 text-[#059669]"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {resultMessage.type === "success" ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <AlertCircle className="size-4" />
            )}
            {resultMessage.text}
            <button
              className="ml-auto text-xs underline"
              onClick={() => setResultMessage(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* CSV Upload section */}
        <div className="rounded-md border border-border border-t-4 border-t-primary bg-white shadow-sm">
          <div className="border-b border-border bg-muted/50 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              Teachers Attendance Upload
            </h3>
          </div>
          <div className="p-4">
            <div className="rounded-md bg-[#f8f9fa] p-4 space-y-3">
              <p className="text-sm font-medium text-foreground">
                Form Allowed: <span className="text-muted-foreground">CSV ONLY</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Legacy scanner columns: Reader ID, Reader Name, Date, Time,
                Status, Card ID, Teacher, Default. Current template columns:
                EmployeeName, Date, TimeIn, TimeOut, Status, Note.
              </p>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="size-4" />
                  Choose CSV
                </Button>
                {csvFile && (
                  <span className="text-sm text-muted-foreground">{csvFile.name}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters + actions */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground whitespace-nowrap">
                Date
              </Label>
              <Input
                type="date"
                className="w-[calc(50%-0.25rem)] sm:w-[180px]"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[180px]">
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

          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={handleSubmitAttendance}
            disabled={isPending || filtered.length === 0}
          >
            <Upload className="size-4" />
            {isPending ? "Uploading..." : "Upload Attendance"}
          </Button>
        </div>

        {/* Attendance table */}
        <DataTable
          columns={columns}
          data={filtered}
          searchKey="employeeName"
          searchPlaceholder="Search employees..."
          emptyState={
            employees.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No employees yet"
                description="Add employees to start tracking attendance. Once you have staff registered, you can record daily attendance here."
                action={{ label: "Manage Employees", href: "/employees/teachers" }}
              />
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No attendance records for this period"
                description="No active employees match your current filters. Try adjusting the branch or date filters above."
              />
            )
          }
        />
      </div>

      {/* CSV Preview Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>CSV Preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-auto">
            {csvPreview.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {csvPreview[0].map((header, i) => (
                      <th
                        key={i}
                        className="px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground"
                      >
                        {header || `Col ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvPreview.slice(1).map((row, ri) => (
                    <tr key={ri} className="border-b">
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-2 py-1.5 text-foreground"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No data to preview
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCsvDialogOpen(false);
                setCsvFile(null);
                setCsvPreview([]);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleCsvUpload}
              disabled={isPending}
            >
              <Save className="size-4" />
              {isPending ? "Uploading..." : "Upload CSV Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
