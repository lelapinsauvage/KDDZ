"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Loader2,
  List,
  LayoutGrid,
} from "lucide-react";
import {
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/lib/actions/settings";
import {
  holidaySchema,
  type HolidayFormValues,
} from "@/lib/validations/settings";

interface Holiday {
  id: string;
  name: string;
  description: string;
  date: string;
  endDate: string;
  repeated: boolean;
  type: string;
  isActive: boolean;
  notificationTitle: string;
  notificationMessage: string;
  daysBefore: number;
  branch: string;
  branchId: string | null;
}

interface BranchOption {
  id: string;
  name: string;
}

interface HolidaysClientProps {
  holidays: Holiday[];
  branches: BranchOption[];
}

// ── Calendar helpers ────────────────────────────
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateToString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DEFAULT_VALUES: HolidayFormValues = {
  name: "",
  description: "",
  date: "",
  endDate: "",
  repeated: false,
  type: "HOLIDAY",
  isActive: true,
  notificationTitle: "",
  notificationMessage: "",
  daysBefore: 0,
  branchId: null,
};

export function HolidaysClient({ holidays: initialHolidays, branches }: HolidaysClientProps) {
  const [holidays, setHolidays] = useState(initialHolidays);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Holiday | null>(null);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  // Form
  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: DEFAULT_VALUES,
  });

  function openAdd(presetDate?: string) {
    setDialogMode("add");
    setEditingId(null);
    form.reset({ ...DEFAULT_VALUES, date: presetDate ?? "" });
    setDialogOpen(true);
  }

  function openEdit(h: Holiday) {
    setDialogMode("edit");
    setEditingId(h.id);
    form.reset({
      name: h.name,
      description: h.description,
      date: h.date,
      endDate: h.endDate,
      repeated: h.repeated,
      type: h.type,
      isActive: h.isActive,
      notificationTitle: h.notificationTitle,
      notificationMessage: h.notificationMessage,
      daysBefore: h.daysBefore,
      branchId: h.branchId,
    });
    setDialogOpen(true);
  }

  function openDelete(h: Holiday) {
    setDeletingItem(h);
    setDeleteDialogOpen(true);
  }

  function onSubmit(values: HolidayFormValues) {
    startTransition(async () => {
      const branchId = values.branchId || null;
      const branchName = branchId
        ? (branches.find((b) => b.id === branchId)?.name ?? "—")
        : "All Branches";

      if (dialogMode === "add") {
        const result = await createHoliday({
          name: values.name,
          description: values.description || null,
          date: values.date,
          endDate: values.endDate || null,
          repeated: values.repeated,
          type: values.type,
          isActive: values.isActive,
          notificationTitle: values.notificationTitle || null,
          notificationMessage: values.notificationMessage || null,
          daysBefore: values.daysBefore,
          branchId,
        });
        if (result.success && result.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newHol = result.data as any;
          setHolidays([
            ...holidays,
            {
              id: newHol.id,
              name: values.name,
              description: values.description,
              date: values.date,
              endDate: values.endDate,
              repeated: values.repeated,
              type: values.type,
              isActive: values.isActive,
              notificationTitle: values.notificationTitle,
              notificationMessage: values.notificationMessage,
              daysBefore: values.daysBefore,
              branch: branchName,
              branchId,
            },
          ]);
          toast.success("Holiday added successfully");
        } else {
          toast.error(result.error ?? "Failed to add holiday");
        }
      } else if (editingId) {
        const result = await updateHoliday(editingId, {
          name: values.name,
          description: values.description || null,
          date: values.date,
          endDate: values.endDate || null,
          repeated: values.repeated,
          type: values.type,
          isActive: values.isActive,
          notificationTitle: values.notificationTitle || null,
          notificationMessage: values.notificationMessage || null,
          daysBefore: values.daysBefore,
          branchId,
        });
        if (result.success) {
          setHolidays(
            holidays.map((h) =>
              h.id === editingId
                ? {
                    ...h,
                    name: values.name,
                    description: values.description,
                    date: values.date,
                    endDate: values.endDate,
                    repeated: values.repeated,
                    type: values.type,
                    isActive: values.isActive,
                    notificationTitle: values.notificationTitle,
                    notificationMessage: values.notificationMessage,
                    daysBefore: values.daysBefore,
                    branch: branchName,
                    branchId,
                  }
                : h
            )
          );
          toast.success("Holiday updated successfully");
        } else {
          toast.error(result.error ?? "Failed to update holiday");
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDeleteFromDialog() {
    if (!editingId) return;
    const item = holidays.find((h) => h.id === editingId);
    if (item) {
      setDialogOpen(false);
      openDelete(item);
    }
  }

  function handleDelete() {
    if (!deletingItem) return;
    startTransition(async () => {
      const result = await deleteHoliday(deletingItem.id);
      if (result.success) {
        setHolidays(holidays.filter((h) => h.id !== deletingItem.id));
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        toast.success("Holiday deleted");
      } else {
        toast.error(result.error ?? "Failed to delete holiday");
      }
    });
  }

  // Calendar navigation
  const prevMonth = useCallback(() => {
    if (calMonth <= 1) {
      setCalMonth(12);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }, [calMonth]);

  const nextMonth = useCallback(() => {
    if (calMonth >= 12) {
      setCalMonth(1);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }, [calMonth]);

  // Build calendar grid
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDayOfWeek = getFirstDayOfWeek(calYear, calMonth);

  const calendarWeeks = useMemo(() => {
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [daysInMonth, firstDayOfWeek]);

  // Build a set of dates covered by each holiday (including ranges)
  const holidaysByDate = useMemo(() => {
    const map: Record<string, Holiday[]> = {};
    for (const h of holidays) {
      const start = new Date(h.date + "T00:00:00");
      const end = h.endDate ? new Date(h.endDate + "T00:00:00") : start;
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = dateToString(cursor);
        if (!map[key]) map[key] = [];
        map[key].push(h);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [holidays]);

  // For bar rendering: determine position of each holiday within a week row
  type BarSegment = {
    holiday: Holiday;
    startCol: number; // 0-6
    span: number; // 1-7
  };

  const barsByWeek = useMemo(() => {
    const result: BarSegment[][] = [];
    for (const week of calendarWeeks) {
      const bars: BarSegment[] = [];
      const seen = new Set<string>();

      for (let col = 0; col < 7; col++) {
        const day = week[col];
        if (day === null) continue;
        const dateKey = toISODate(calYear, calMonth, day);
        const dayHolidays = holidaysByDate[dateKey] ?? [];

        for (const h of dayHolidays) {
          if (seen.has(h.id)) continue;
          seen.add(h.id);

          // Calculate span within this week
          const hStart = new Date(h.date + "T00:00:00");
          const hEnd = h.endDate ? new Date(h.endDate + "T00:00:00") : hStart;
          let spanEnd = col;

          for (let nextCol = col + 1; nextCol < 7; nextCol++) {
            const nextDay = week[nextCol];
            if (nextDay === null) break;
            const nextDate = new Date(toISODate(calYear, calMonth, nextDay) + "T00:00:00");
            if (nextDate >= hStart && nextDate <= hEnd) {
              spanEnd = nextCol;
            } else {
              break;
            }
          }

          bars.push({
            holiday: h,
            startCol: col,
            span: spanEnd - col + 1,
          });
        }
      }
      result.push(bars);
    }
    return result;
  }, [calendarWeeks, calYear, calMonth, holidaysByDate]);

  const columns: ColumnDef<Holiday>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Holiday Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="font-medium">{row.original.name}</span>
            {!row.original.isActive && (
              <Badge variant="outline" className="text-muted-foreground text-[10px]">Inactive</Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => {
          const start = new Date(row.original.date + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          });
          if (row.original.endDate) {
            const end = new Date(row.original.endDate + "T00:00:00").toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
            });
            return `${start} — ${end}`;
          }
          return start;
        },
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant={row.original.type === "HOLIDAY" ? "default" : "secondary"} className="font-normal">
            {row.original.type === "HOLIDAY" ? "Holiday" : "Event"}
          </Badge>
        ),
      },
      {
        accessorKey: "branch",
        header: "Branch",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {row.original.branch}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => openEdit(row.original)}
              disabled={isPending}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => openDelete(row.original)}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [holidays, isPending]
  );

  return (
    <>
      <PageHeader
        title="Holiday Calendar"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Holidays" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border p-0.5">
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className={viewMode === "calendar" ? "text-white" : ""}
                onClick={() => setViewMode("calendar")}
              >
                <LayoutGrid className="mr-1 size-4" />
                Calendar
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className={viewMode === "list" ? "text-white" : ""}
                onClick={() => setViewMode("list")}
              >
                <List className="mr-1 size-4" />
                List
              </Button>
            </div>
            <Button
              className="bg-primary text-white hover:bg-primary/90"
              onClick={() => openAdd()}
              disabled={isPending}
            >
              <Plus className="mr-1 size-4" />
              Add Holiday
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {viewMode === "calendar" ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* Calendar header */}
              <div className="flex flex-wrap items-center justify-between border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <h3 className="text-base font-semibold text-foreground min-w-[180px] text-center">
                    {MONTH_NAMES[calMonth - 1]} {calYear}
                  </h3>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded bg-[#6B8F71]" />
                    Holiday
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block size-3 rounded bg-blue-500" />
                    Event
                  </span>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {DAY_NAMES.map((day) => (
                        <th
                          key={day}
                          className="border-b bg-muted/50 px-2 py-2 text-center text-xs font-semibold uppercase text-muted-foreground w-[14.28%]"
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {calendarWeeks.map((week, weekIdx) => (
                      <tr key={weekIdx} className="relative">
                        {week.map((day, dayIdx) => {
                          if (day === null) {
                            return (
                              <td
                                key={dayIdx}
                                className="border-b border-r last:border-r-0 bg-gray-50/50 p-1.5 align-top h-[90px]"
                              />
                            );
                          }

                          const dateKey = toISODate(calYear, calMonth, day);
                          const dayHolidays = holidaysByDate[dateKey] ?? [];
                          const hasHolidays = dayHolidays.length > 0;
                          const isToday =
                            calYear === now.getFullYear() &&
                            calMonth === now.getMonth() + 1 &&
                            day === now.getDate();

                          return (
                            <td
                              key={dayIdx}
                              className={`border-b border-r last:border-r-0 p-1.5 align-top h-[90px] cursor-pointer transition-colors hover:bg-primary/5 group ${
                                isToday ? "ring-2 ring-inset ring-primary/40" : ""
                              }`}
                              onClick={() => openAdd(dateKey)}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <span
                                  className={`inline-flex size-6 items-center justify-center rounded-full text-sm font-medium ${
                                    isToday
                                      ? "bg-primary text-primary-foreground"
                                      : hasHolidays
                                        ? "text-[#6B8F71] font-semibold"
                                        : "text-foreground"
                                  }`}
                                >
                                  {day}
                                </span>
                                {!hasHolidays && (
                                  <span className="flex size-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="size-3" />
                                  </span>
                                )}
                              </div>
                              {/* Inline bar segments for this cell */}
                              <div className="space-y-0.5">
                                {barsByWeek[weekIdx]
                                  ?.filter((b) => b.startCol === dayIdx)
                                  .map((bar) => {
                                    const isEvent = bar.holiday.type === "EVENT";
                                    return (
                                      <div
                                        key={bar.holiday.id}
                                        className={`truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight cursor-pointer transition-colors ${
                                          isEvent
                                            ? "bg-blue-500 text-white hover:bg-blue-600"
                                            : "bg-[#6B8F71] text-white hover:bg-[#5A7A5E]"
                                        } ${!bar.holiday.isActive ? "opacity-50" : ""}`}
                                        style={
                                          bar.span > 1
                                            ? {
                                                position: "relative",
                                                zIndex: 10,
                                                width: `calc(${bar.span * 100}% + ${(bar.span - 1) * 0.5}rem)`,
                                              }
                                            : undefined
                                        }
                                        title={`${bar.holiday.name}${bar.holiday.endDate ? ` (${bar.holiday.date} — ${bar.holiday.endDate})` : ""}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEdit(bar.holiday);
                                        }}
                                      >
                                        {bar.holiday.name}
                                      </div>
                                    );
                                  })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <DataTable columns={columns} data={holidays} searchKey="name" searchPlaceholder="Search holidays..." />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[540px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Holiday" : "Edit Holiday"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Holiday Name</label>
              <Input placeholder="e.g. Independence Day" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <Input placeholder="Brief description (optional)" {...form.register("description")} />
            </div>

            {/* Type + Active row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Type</label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HOLIDAY">Holiday</SelectItem>
                        <SelectItem value="EVENT">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-end pb-2">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  )}
                />
              </div>
            </div>

            {/* Repeated radio */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Recurrence</label>
              <Controller
                control={form.control}
                name="repeated"
                render={({ field }) => (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repeated"
                        checked={!field.value}
                        onChange={() => field.onChange(false)}
                        className="accent-primary"
                      />
                      <span className="text-sm">One Time</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repeated"
                        checked={field.value}
                        onChange={() => field.onChange(true)}
                        className="accent-primary"
                      />
                      <span className="text-sm">Repeated Yearly</span>
                    </label>
                  </div>
                )}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Start Date</label>
                <Input type="date" {...form.register("date")} />
                {form.formState.errors.date && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">End Date</label>
                <Input type="date" {...form.register("endDate")} />
              </div>
            </div>

            {/* Branch */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">Branch</label>
              <Controller
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "ALL"}
                    onValueChange={(v) => field.onChange(v === "ALL" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Branches</SelectItem>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Notification section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">Parent Notification</h4>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Notification Title</label>
                  <Input placeholder="e.g. Upcoming Holiday" {...form.register("notificationTitle")} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Notification Message</label>
                  <Textarea
                    placeholder="Message to send to parents..."
                    rows={3}
                    {...form.register("notificationMessage")}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Days Before (send notification)</label>
                  <Input
                    type="number"
                    min={0}
                    {...form.register("daysBefore", { valueAsNumber: true })}
                    className="w-32"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between pt-2">
              {dialogMode === "edit" && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteFromDialog}
                  disabled={isPending}
                  className="gap-1.5 sm:mr-auto"
                >
                  <Trash2 className="size-3.5" />
                  Remove
                </Button>
              )}
              <div className="flex gap-2 sm:ml-auto">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
                <Button
                  type="submit"
                  className="text-white"
                  disabled={isPending}
                >
                  {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
                  {dialogMode === "add" ? "Add" : "Update"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.name}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
