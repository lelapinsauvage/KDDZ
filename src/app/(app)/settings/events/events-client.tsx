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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/actions/settings";
import {
  eventSchema,
  type EventFormValues,
} from "@/lib/validations/settings";

// ── Types ──────────────────────────────────
interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string | null;
  eventTypeId: string | null;
  eventTypeColor: string;
  eventTypeName: string;
  branchId: string | null;
  branchName: string;
  isActive: boolean;
}

interface EventTypeOption {
  id: string;
  name: string;
  color: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface EventsClientProps {
  events: EventItem[];
  eventTypes: EventTypeOption[];
  branches: BranchOption[];
}

// ── Calendar helpers ────────────────────────
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

// ── Component ───────────────────────────────
export function EventsClient({ events: initialEvents, eventTypes, branches }: EventsClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [isPending, startTransition] = useTransition();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<EventItem | null>(null);

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);

  // Form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      endDate: "",
      eventTypeId: null,
      branchId: null,
      isActive: true,
    },
  });

  // ── Dialog handlers ─────────────────────────
  function openAdd(presetDate?: string) {
    setDialogMode("add");
    setEditingId(null);
    form.reset({
      title: "",
      description: "",
      date: presetDate ?? "",
      endDate: "",
      eventTypeId: null,
      branchId: null,
      isActive: true,
    });
    setDialogOpen(true);
  }

  function openEdit(ev: EventItem) {
    setDialogMode("edit");
    setEditingId(ev.id);
    form.reset({
      title: ev.title,
      description: ev.description,
      date: ev.date,
      endDate: ev.endDate ?? "",
      eventTypeId: ev.eventTypeId,
      branchId: ev.branchId,
      isActive: ev.isActive,
    });
    setDialogOpen(true);
  }

  function openDelete(ev: EventItem) {
    setDeletingItem(ev);
    setDeleteDialogOpen(true);
  }

  function onSubmit(values: EventFormValues) {
    startTransition(async () => {
      const eventTypeId = values.eventTypeId || null;
      const branchId = values.branchId || null;
      const branchName = branchId
        ? (branches.find((b) => b.id === branchId)?.name ?? "—")
        : "All Branches";
      const eventType = eventTypeId
        ? eventTypes.find((et) => et.id === eventTypeId)
        : null;

      if (dialogMode === "add") {
        const result = await createEvent({
          title: values.title,
          description: values.description || null,
          date: values.date,
          endDate: values.endDate || null,
          eventTypeId,
          branchId,
          isActive: values.isActive,
        });
        if (result.success && result.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newEv = result.data as any;
          setEvents([
            ...events,
            {
              id: newEv.id,
              title: values.title,
              description: values.description || "",
              date: values.date,
              endDate: values.endDate || null,
              eventTypeId,
              eventTypeColor: eventType?.color ?? "#14B8A6",
              eventTypeName: eventType?.name ?? "—",
              branchId,
              branchName,
              isActive: values.isActive,
            },
          ]);
          toast.success("Event created successfully");
        } else {
          toast.error(result.error ?? "Failed to create event");
        }
      } else if (editingId) {
        const result = await updateEvent(editingId, {
          title: values.title,
          description: values.description || null,
          date: values.date,
          endDate: values.endDate || null,
          eventTypeId,
          branchId,
          isActive: values.isActive,
        });
        if (result.success) {
          setEvents(
            events.map((e) =>
              e.id === editingId
                ? {
                    ...e,
                    title: values.title,
                    description: values.description || "",
                    date: values.date,
                    endDate: values.endDate || null,
                    eventTypeId,
                    eventTypeColor: eventType?.color ?? "#14B8A6",
                    eventTypeName: eventType?.name ?? "—",
                    branchId,
                    branchName,
                    isActive: values.isActive,
                  }
                : e
            )
          );
          toast.success("Event updated successfully");
        } else {
          toast.error(result.error ?? "Failed to update event");
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDelete() {
    if (!deletingItem) return;
    startTransition(async () => {
      const result = await deleteEvent(deletingItem.id);
      if (result.success) {
        setEvents(events.filter((e) => e.id !== deletingItem.id));
        setDeleteDialogOpen(false);
        setDeletingItem(null);
        toast.success("Event deleted");
      } else {
        toast.error(result.error ?? "Failed to delete event");
      }
    });
  }

  // ── Calendar navigation ─────────────────────
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

  // Map events by date for calendar
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  // ── Table columns ───────────────────────────
  const columns: ColumnDef<EventItem>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: row.original.eventTypeColor }}
            />
            <span className="font-medium">{row.original.title}</span>
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
        accessorKey: "eventTypeName",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-normal">
            {row.original.eventTypeName}
          </Badge>
        ),
      },
      {
        accessorKey: "branchName",
        header: "Branch",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }
          >
            {row.original.isActive ? "Active" : "Inactive"}
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
    [events, isPending]
  );

  return (
    <>
      <PageHeader
        title="Events Calendar"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Events" },
        ]}
        actions={
          <Button
            className="bg-primary text-white hover:bg-primary/90"
            onClick={() => openAdd()}
            disabled={isPending}
          >
            <Plus className="mr-1 size-4" />
            Add Event
          </Button>
        }
      />

      <div className="space-y-6 p-4 md:p-6">
        {/* Calendar View */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            {/* Calendar header */}
            <div className="mb-4 flex flex-wrap items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <h3 className="min-w-[160px] text-center text-base font-semibold text-foreground">
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
                        className="w-[14.28%] border-b bg-muted/50 px-2 py-2 text-center text-xs font-semibold uppercase text-muted-foreground"
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
                              className="h-[80px] border-b border-r bg-gray-50/50 p-2 align-top last:border-r-0"
                            />
                          );
                        }

                        const dateKey = toISODate(calYear, calMonth, day);
                        const dayEvents = eventsByDate[dateKey] ?? [];
                        const hasEvents = dayEvents.length > 0;
                        const isToday =
                          calYear === now.getFullYear() &&
                          calMonth === now.getMonth() + 1 &&
                          day === now.getDate();

                        return (
                          <td
                            key={dayIdx}
                            className={`h-[80px] cursor-pointer border-b border-r p-2 align-top transition-colors last:border-r-0 hover:bg-primary/5 ${
                              hasEvents ? "bg-blue-50/40" : "bg-white"
                            }`}
                            onClick={() => openAdd(dateKey)}
                          >
                            <div className="mb-1 flex items-start justify-between">
                              <span
                                className={`text-sm font-medium ${
                                  isToday
                                    ? "flex size-6 items-center justify-center rounded-full bg-primary text-white"
                                    : "text-foreground"
                                }`}
                              >
                                {day}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {dayEvents.slice(0, 2).map((ev) => (
                                <div
                                  key={ev.id}
                                  className="cursor-pointer truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight text-white"
                                  style={{ backgroundColor: ev.eventTypeColor }}
                                  title={`${ev.title} (${ev.eventTypeName})`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(ev);
                                  }}
                                >
                                  {ev.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="px-1 text-[10px] text-muted-foreground">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
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
        <DataTable
          columns={columns}
          data={events}
          searchKey="title"
          searchPlaceholder="Search events..."
        />
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Event" : "Edit Event"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <Input
                placeholder="e.g. Parent-Teacher Meeting"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <Textarea
                placeholder="Event description (optional)"
                {...form.register("description")}
                rows={3}
              />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Event Type</label>
                <Select
                  value={form.watch("eventTypeId") ?? "NONE"}
                  onValueChange={(v) => form.setValue("eventTypeId", v === "NONE" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No Type</SelectItem>
                    {eventTypes.map((et) => (
                      <SelectItem key={et.id} value={et.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-3 rounded-full"
                            style={{ backgroundColor: et.color }}
                          />
                          {et.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={form.watch("isActive")}
                onCheckedChange={(v) => form.setValue("isActive", !!v)}
              />
              Active
            </label>
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
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.title}&quot;?
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
