"use client";

import { useMemo, useState, useTransition } from "react";
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
import { Clock, Pencil, X, Upload } from "lucide-react";
import { updateAttendanceLog } from "@/lib/actions/employee-events";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttendanceLog {
  id: string;
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
  createdAt: string;
}

interface EmployeeOption {
  id: string;
  name: string;
  role: string;
}

interface AttendanceLogsClientProps {
  logs: AttendanceLog[];
  employees: EmployeeOption[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  CHECK_IN: "bg-emerald-100 text-emerald-700",
  CHECK_OUT: "bg-blue-100 text-blue-700",
  LATE: "bg-amber-100 text-amber-700",
  EARLY_LEAVE: "bg-red-100 text-red-700",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AttendanceLogsClient({
  logs: initialLogs,
  employees,
}: AttendanceLogsClientProps) {
  const [isPending, startTransition] = useTransition();

  const [logs, setLogs] = useState(initialLogs);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [editTimeIn, setEditTimeIn] = useState("");
  const [editTimeOut, setEditTimeOut] = useState("");
  const [editNote, setEditNote] = useState("");

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (dateFrom && log.date < dateFrom) return false;
      if (dateTo && log.date > dateTo) return false;
      if (employeeFilter !== "ALL" && log.employeeId !== employeeFilter)
        return false;
      if (statusFilter !== "ALL" && log.status !== statusFilter) return false;
      return true;
    });
  }, [logs, dateFrom, dateTo, employeeFilter, statusFilter]);

  function openEditDialog(log: AttendanceLog) {
    setEditingLog(log);
    setEditTimeIn(log.timeIn ?? "");
    setEditTimeOut(log.timeOut ?? "");
    setEditNote(log.note ?? "");
    setEditDialogOpen(true);
  }

  function handleUpdate() {
    if (!editingLog) return;

    startTransition(async () => {
      const result = await updateAttendanceLog(editingLog.id, {
        timeIn: editTimeIn || null,
        timeOut: editTimeOut || null,
        note: editNote || null,
      });

      if (result.success) {
        setLogs((prev) =>
          prev.map((l) =>
            l.id === editingLog.id
              ? {
                  ...l,
                  timeIn: editTimeIn || null,
                  timeOut: editTimeOut || null,
                  note: editNote || null,
                }
              : l,
          ),
        );
      }
      setEditDialogOpen(false);
    });
  }

  function clearFilters() {
    setDateFrom("");
    setDateTo("");
    setEmployeeFilter("ALL");
    setStatusFilter("ALL");
  }

  const hasFilters =
    dateFrom || dateTo || employeeFilter !== "ALL" || statusFilter !== "ALL";

  const columns: ColumnDef<AttendanceLog>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Log",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.id.slice(0, 8)}
          </span>
        ),
      },
      {
        accessorKey: "employeeName",
        header: "Employee",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.employeeName}</span>
        ),
      },
      {
        accessorKey: "employeeType",
        header: "Role",
        cell: ({ row }) => (
          <Badge className="bg-[#eef0f3] text-[#6f7b8a] font-normal capitalize">
            {row.original.employeeType}
          </Badge>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => (
          <span className="text-sm">
            {new Date(row.original.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        ),
      },
      {
        accessorKey: "timeIn",
        header: "Time In",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.timeIn ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "timeOut",
        header: "Time Out",
        cell: ({ row }) => (
          <span className="font-mono text-sm">
            {row.original.timeOut ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          if (!status)
            return <span className="text-muted-foreground">—</span>;
          return (
            <Badge
              className={statusColors[status] ?? "bg-gray-100 text-gray-700"}
            >
              {status.replace("_", " ")}
            </Badge>
          );
        },
      },
      {
        accessorKey: "cardId",
        header: "Card ID",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.cardId ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: "Note",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground truncate max-w-[150px] block">
            {row.original.note ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Datetime",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">
              {new Date(row.original.createdAt).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
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
        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">
              From
            </Label>
            <Input
              type="date"
              className="w-[130px] sm:w-[160px]"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">
              To
            </Label>
            <Input
              type="date"
              className="w-[130px] sm:w-[160px]"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[200px]">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Employees</SelectItem>
              {employees.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name} ({e.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="CHECK_IN">Check In</SelectItem>
              <SelectItem value="CHECK_OUT">Check Out</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="EARLY_LEAVE">Early Leave</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Data table */}
        {filteredLogs.length > 0 ? (
          <DataTable
            columns={columns}
            data={filteredLogs}
            searchKey="employeeName"
            searchPlaceholder="Search logs..."
          />
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No attendance log entries found.
            {hasFilters
              ? " Try adjusting your filters."
              : " Upload attendance data from the Attendance page to see logs here."}
          </div>
        )}
      </div>

      {/* Edit Log Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Log Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Employee</Label>
              <Input value={editingLog?.employeeName ?? ""} disabled />
            </div>
            <div>
              <Label>Date</Label>
              <Input value={editingLog?.date ?? ""} disabled />
            </div>
            <div>
              <Label>Time In</Label>
              <Input
                type="time"
                value={editTimeIn}
                onChange={(e) => setEditTimeIn(e.target.value)}
              />
            </div>
            <div>
              <Label>Time Out</Label>
              <Input
                type="time"
                value={editTimeOut}
                onChange={(e) => setEditTimeOut(e.target.value)}
              />
            </div>
            <div>
              <Label>Note</Label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
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
