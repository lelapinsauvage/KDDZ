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

interface AttendanceEntry {
  employeeId: string;
  status: AttendanceStatus;
  timeIn: string;
  timeOut: string;
  note: string;
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
      const rows = text
        .split("\n")
        .map((row) => row.split(",").map((c) => c.trim()))
        .filter((row) => row.some((c) => c.length > 0));
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
      const rows = text
        .split("\n")
        .map((row) => row.split(",").map((c) => c.trim()))
        .filter((row) => row.some((c) => c.length > 0));

      // Expected CSV format: EmployeeName, Date, TimeIn, TimeOut, Status, Note
      // Skip header row
      const dataRows = rows.slice(1);

      // Try to match employee names to IDs
      const empMap = new Map<string, EmployeeAttendance>();
      for (const emp of employees) {
        empMap.set(emp.employeeName.toLowerCase(), emp);
      }

      const logs = dataRows
        .map((row) => {
          const [name, date, timeIn, timeOut, status, note] = row;
          const emp = empMap.get(name?.toLowerCase() ?? "");
          if (!emp || !date) return null;
          return {
            employeeId: emp.id,
            employeeType: emp.role.toLowerCase(),
            date,
            timeIn: timeIn || undefined,
            timeOut: timeOut || undefined,
            status:
              status?.toUpperCase() === "LATE"
                ? ("LATE" as const)
                : status?.toUpperCase() === "CHECK_OUT"
                  ? ("CHECK_OUT" as const)
                  : ("CHECK_IN" as const),
            readerName: name,
            note: note || undefined,
          };
        })
        .filter(Boolean) as Array<{
        employeeId: string;
        employeeType: string;
        date: string;
        timeIn?: string;
        timeOut?: string;
        status: "CHECK_IN" | "CHECK_OUT" | "LATE";
        readerName: string;
        note?: string;
      }>;

      if (logs.length === 0) {
        setResultMessage({
          type: "error",
          text: "No valid rows found. Ensure CSV format: EmployeeName, Date, TimeIn, TimeOut, Status, Note",
        });
        setCsvDialogOpen(false);
        return;
      }

      startTransition(async () => {
        const result = await bulkCreateAttendanceLogs(logs);
        if (result.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const count = (result.data as any)?.count ?? 0;
          setResultMessage({
            type: "success",
            text: `Successfully uploaded ${count} records from CSV`,
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
                ? "border-[#6B8F71]/20 bg-[#6B8F71]/10 text-[#6B8F71]"
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
                Expected CSV format: EmployeeName, Date (YYYY-MM-DD), TimeIn
                (HH:MM), TimeOut (HH:MM), Status (CHECK_IN/LATE), Note
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
            className="bg-primary hover:bg-primary/90 text-white"
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
              className="bg-primary hover:bg-primary/90 text-white"
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
