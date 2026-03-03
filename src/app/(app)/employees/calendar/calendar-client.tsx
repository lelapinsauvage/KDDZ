"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
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
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  createEmployeeEvent,
  updateEmployeeEvent,
  deleteEmployeeEvent,
} from "@/lib/actions/employee-events";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeOption {
  id: string;
  name: string;
  role: string;
  type: string;
}

interface CalendarEvent {
  id: string;
  employeeId: string;
  employeeType: string;
  status: string;
  date: string;
  referenceNumber: string | null;
  notes: string | null;
}

interface CalendarClientProps {
  employees: EmployeeOption[];
  events: CalendarEvent[];
  initialYear: number;
  initialMonth: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_OPTIONS = [
  { value: "SICK", label: "Sick" },
  { value: "ABSENT", label: "Absent" },
  { value: "DAY_OFF", label: "Day Off" },
  { value: "WARNING", label: "Warning" },
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  SICK: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  ABSENT: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500" },
  DAY_OFF: { bg: "bg-[#059669]/15", text: "text-[#059669]", dot: "bg-[#059669]" },
  WARNING: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CalendarClient({
  employees,
  events: initialEvents,
  initialYear,
  initialMonth,
}: CalendarClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const now = new Date();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  // Local event state (optimistic)
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  // Filter by employee
  const [employeeFilter, setEmployeeFilter] = useState("ALL");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Form fields
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formStatus, setFormStatus] = useState<string>("");
  const [formDate, setFormDate] = useState("");
  const [formRefNb, setFormRefNb] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  // Filtered events
  const filteredEvents = useMemo(() => {
    if (employeeFilter === "ALL") return events;
    return events.filter((e) => e.employeeId === employeeFilter);
  }, [events, employeeFilter]);

  // Build week rows
  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    let currentRow: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) currentRow.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      currentRow.push(d);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) {
      while (currentRow.length < 7) currentRow.push(null);
      rows.push(currentRow);
    }
    return rows;
  }, [daysInMonth, firstDay]);

  // Employee lookup
  const employeeLookup = useMemo(() => {
    const map = new Map<string, EmployeeOption>();
    for (const e of employees) map.set(e.id, e);
    return map;
  }, [employees]);

  const navigateMonth = useCallback(
    (delta: number) => {
      let newMonth = month + delta;
      let newYear = year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      setMonth(newMonth);
      setYear(newYear);
      // Fetch events for new month via navigation
      startTransition(() => {
        router.push(`/employees/calendar?year=${newYear}&month=${newMonth}`);
      });
    },
    [month, year, router],
  );

  const monthName = new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Open create dialog
  function openCreateDialog(day: number) {
    const dateStr = formatDate(year, month, day);
    setEditingEvent(null);
    setFormEmployeeId(employees[0]?.id ?? "");
    setFormStatus("");
    setFormDate(dateStr);
    setFormRefNb("");
    setFormError(null);
    setDialogOpen(true);
  }

  // Open edit dialog
  function openEditDialog(event: CalendarEvent) {
    setEditingEvent(event);
    setFormEmployeeId(event.employeeId);
    setFormStatus(event.status);
    setFormDate(event.date);
    setFormRefNb(event.referenceNumber ?? "");
    setFormError(null);
    setDialogOpen(true);
  }

  // Save event
  function handleSave() {
    if (!formStatus) {
      setFormError("Please select a status");
      return;
    }
    if (!formEmployeeId) {
      setFormError("Please select an employee");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      if (editingEvent) {
        const result = await updateEmployeeEvent(editingEvent.id, {
          status: formStatus as "SICK" | "ABSENT" | "DAY_OFF" | "WARNING",
          referenceNumber: formRefNb || null,
        });
        if (!result.success) {
          setFormError(result.error ?? "Failed to update");
          return;
        }
        // Update local state
        setEvents((prev) =>
          prev.map((e) =>
            e.id === editingEvent.id
              ? { ...e, status: formStatus, referenceNumber: formRefNb || null }
              : e,
          ),
        );
      } else {
        const emp = employeeLookup.get(formEmployeeId);
        const result = await createEmployeeEvent({
          employeeId: formEmployeeId,
          employeeType: emp?.type ?? "teacher",
          status: formStatus as "SICK" | "ABSENT" | "DAY_OFF" | "WARNING",
          date: formDate,
          referenceNumber: formRefNb || undefined,
        });
        if (!result.success) {
          setFormError(result.error ?? "Failed to create");
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const created = result.data as any;
        setEvents((prev) => [
          ...prev,
          {
            id: created.id,
            employeeId: formEmployeeId,
            employeeType: emp?.type ?? "teacher",
            status: formStatus,
            date: formDate,
            referenceNumber: formRefNb || null,
            notes: null,
          },
        ]);
      }
      setDialogOpen(false);
    });
  }

  // Delete event
  function handleDelete() {
    if (!deletingEventId) return;
    startTransition(async () => {
      const result = await deleteEmployeeEvent(deletingEventId);
      if (result.success) {
        setEvents((prev) => prev.filter((e) => e.id !== deletingEventId));
      }
      setDeleteConfirmOpen(false);
      setDeletingEventId(null);
    });
  }

  return (
    <>
      <PageHeader
        title="Tasks"
        breadcrumbs={[
          { label: "Employees", href: "/employees/teachers" },
          { label: "Calendar" },
        ]}
      />

      <div className="p-4 md:p-6 space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {STATUS_OPTIONS.map((s) => (
            <div key={s.value} className="flex items-center gap-1.5">
              <div className={`size-4 rounded ${STATUS_COLORS[s.value].dot}`} />
              <span className="text-sm">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Month navigation + filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => navigateMonth(-1)}
              disabled={isPending}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[180px] text-center">
              {monthName}
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => navigateMonth(1)}
              disabled={isPending}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
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
        </div>

        {/* Calendar grid */}
        <div className="rounded-lg border bg-card overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-muted/50">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="border-r last:border-r-0 px-2 py-2 text-center text-xs font-semibold uppercase text-muted-foreground"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-t">
              {week.map((day, di) => {
                const dayStr = day ? formatDate(year, month, day) : "";
                const dayEvents = day
                  ? filteredEvents.filter((e) => e.date === dayStr)
                  : [];
                const isTodayCell = isCurrentMonth && day === today;

                return (
                  <div
                    key={di}
                    className={`min-h-[100px] border-r last:border-r-0 p-1.5 transition-colors ${
                      day === null ? "bg-muted/30" : "hover:bg-muted/10 cursor-pointer"
                    } ${isTodayCell ? "bg-primary/5" : ""}`}
                    onClick={() => day && openCreateDialog(day)}
                  >
                    {day !== null && (
                      <>
                        <div
                          className={`text-sm font-medium mb-1 ${
                            isTodayCell ? "text-primary font-bold" : "text-foreground"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.map((evt) => {
                            const emp = employeeLookup.get(evt.employeeId);
                            const colors = STATUS_COLORS[evt.status] ?? STATUS_COLORS.WARNING;
                            return (
                              <div
                                key={evt.id}
                                className={`group flex items-center justify-between rounded px-1.5 py-0.5 text-[11px] leading-tight ${colors.bg} ${colors.text}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(evt);
                                }}
                              >
                                <span className="truncate">
                                  {emp?.name ?? "Unknown"}: {evt.status.replace("_", " ")}
                                </span>
                                <button
                                  className="hidden group-hover:flex items-center shrink-0 ml-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingEventId(evt.id);
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Update Task" : "Create Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!editingEvent && (
              <div>
                <Label>Employee</Label>
                <Select value={formEmployeeId} onValueChange={setFormEmployeeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Status</Label>
              <Select value={formStatus} onValueChange={setFormStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formStatus && formStatus !== "DAY_OFF" && (
              <div>
                <Label>Reference Number</Label>
                <Input
                  placeholder="Reference Number"
                  value={formRefNb}
                  onChange={(e) => setFormRefNb(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Date</Label>
              <Input type="date" value={formDate} disabled />
            </div>

            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending
                ? "Saving..."
                : editingEvent
                  ? "Update"
                  : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDelete}
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
