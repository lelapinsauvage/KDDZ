"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  date: string;
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

export function HolidaysClient({ holidays: initialHolidays, branches }: HolidaysClientProps) {
  const [holidays, setHolidays] = useState(initialHolidays);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
    defaultValues: { name: "", date: "", branchId: null },
  });

  function openAdd(presetDate?: string) {
    setDialogMode("add");
    setEditingId(null);
    form.reset({ name: "", date: presetDate ?? "", branchId: null });
    setDialogOpen(true);
  }

  function openEdit(h: Holiday) {
    setDialogMode("edit");
    setEditingId(h.id);
    form.reset({ name: h.name, date: h.date, branchId: h.branchId });
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
          date: values.date,
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
              date: values.date,
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
          date: values.date,
          branchId,
        });
        if (result.success) {
          setHolidays(
            holidays.map((h) =>
              h.id === editingId
                ? { ...h, name: values.name, date: values.date, branch: branchName, branchId }
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

  // Map holidays by date for calendar display
  const holidaysByDate = useMemo(() => {
    const map: Record<string, Holiday[]> = {};
    for (const h of holidays) {
      if (!map[h.date]) {
        map[h.date] = [];
      }
      map[h.date].push(h);
    }
    return map;
  }, [holidays]);

  const columns: ColumnDef<Holiday>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Holiday Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) =>
          new Date(row.original.date + "T00:00:00").toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
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
          <Button
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => openAdd()}
            disabled={isPending}
          >
            <Plus className="mr-1 size-4" />
            Add Holiday
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Calendar View */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            {/* Calendar header */}
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <h3 className="text-base font-semibold text-foreground min-w-[160px] text-center">
                  {MONTH_NAMES[calMonth - 1]} {calYear}
                </h3>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
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
                    <tr key={weekIdx}>
                      {week.map((day, dayIdx) => {
                        if (day === null) {
                          return (
                            <td
                              key={dayIdx}
                              className="border-b border-r last:border-r-0 bg-gray-50/50 p-2 align-top h-[80px]"
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
                            className={`border-b border-r last:border-r-0 p-2 align-top h-[80px] cursor-pointer transition-colors hover:bg-primary/5 ${
                              hasHolidays ? "bg-red-50/60" : "bg-white"
                            }`}
                            onClick={() => openAdd(dateKey)}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <span
                                className={`text-sm font-medium ${
                                  isToday
                                    ? "bg-primary text-white rounded-full size-6 flex items-center justify-center"
                                    : hasHolidays
                                      ? "text-red-600"
                                      : "text-foreground"
                                }`}
                              >
                                {day}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {dayHolidays.map((h) => (
                                <div
                                  key={h.id}
                                  className="truncate rounded bg-red-100 px-1 py-0.5 text-[10px] font-medium text-red-700 leading-tight cursor-pointer hover:bg-red-200"
                                  title={`${h.name} (${h.branch})`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(h);
                                  }}
                                >
                                  {h.name}
                                </div>
                              ))}
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

        {/* Data Table */}
        <DataTable columns={columns} data={holidays} searchKey="name" searchPlaceholder="Search holidays..." />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Holiday" : "Edit Holiday"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Holiday Name</label>
              <Input placeholder="e.g. Independence Day" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date</label>
              <Input type="date" {...form.register("date")} />
              {form.formState.errors.date && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.date.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Branch</label>
              <Select
                value={form.watch("branchId") ?? "ALL"}
                onValueChange={(v) => form.setValue("branchId", v === "ALL" ? null : v)}
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
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
                {dialogMode === "add" ? "Add" : "Save"}
              </Button>
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
