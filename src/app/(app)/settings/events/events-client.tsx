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
  customSubject: string;
  customBody: string;
  date: string;
  endDate: string | null;
  eventTypeId: string | null;
  eventTypeColor: string;
  eventTypeName: string;
  branchId: string | null;
  branchName: string;
  notificationBranchIds: string[];
  notificationDaysBefore: number[];
  isActive: boolean;
}

interface EventTypeOption {
  id: string;
  name: string;
  color: string;
  defaultSubject: string;
  defaultMessage: string;
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
const REMINDER_DAY_OPTIONS = Array.from({ length: 10 }, (_, index) => index + 1);

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
      customSubject: "",
      customBody: "",
      date: "",
      endDate: "",
      eventTypeId: null,
      branchId: null,
      notificationBranchIds: [],
      notificationDaysBefore: [1, 3, 7],
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
      customSubject: "",
      customBody: "",
      date: presetDate ?? "",
      endDate: "",
      eventTypeId: null,
      branchId: null,
      notificationBranchIds: [],
      notificationDaysBefore: [1, 3, 7],
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
      customSubject: ev.customSubject,
      customBody: ev.customBody,
      date: ev.date,
      endDate: ev.endDate ?? "",
      eventTypeId: ev.eventTypeId,
      branchId: ev.branchId,
      notificationBranchIds: ev.notificationBranchIds,
      notificationDaysBefore: ev.notificationDaysBefore.length
        ? ev.notificationDaysBefore
        : [1, 3, 7],
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
      const notificationBranchIds = values.notificationBranchIds;
      const branchId =
        values.branchId ||
        (notificationBranchIds.length === 1 ? notificationBranchIds[0] : null);
      const selectedBranchNames = notificationBranchIds
        .map((id) => branches.find((branch) => branch.id === id)?.name)
        .filter((name): name is string => Boolean(name));
      const branchName = selectedBranchNames.length
        ? selectedBranchNames.join(" & ")
        : branchId
          ? (branches.find((b) => b.id === branchId)?.name ?? "Unknown")
          : "All Branches";
      const eventType = eventTypeId
        ? eventTypes.find((et) => et.id === eventTypeId)
        : null;
      const notificationTitle =
        values.title || values.customSubject || eventType?.name || "Notification";
      const customSubject = values.customSubject || notificationTitle;
      const customBody = values.customBody || values.description || null;

      if (dialogMode === "add") {
        const result = await createEvent({
          title: notificationTitle,
          description: values.description || null,
          customSubject,
          customBody,
          date: values.date,
          endDate: values.endDate || null,
          eventTypeId,
          branchId,
          notificationBranchIds,
          notificationDaysBefore: values.notificationDaysBefore,
          isActive: values.isActive,
        });
        if (result.success && result.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newEv = result.data as any;
          setEvents([
            ...events,
            {
              id: newEv.id,
              title: notificationTitle,
              description: values.description || "",
              customSubject,
              customBody: customBody || "",
              date: values.date,
              endDate: values.endDate || null,
              eventTypeId,
              eventTypeColor: eventType?.color ?? "#0B9178",
              eventTypeName: eventType?.name ?? "No Type",
              branchId,
              branchName,
              notificationBranchIds,
              notificationDaysBefore: values.notificationDaysBefore,
              isActive: values.isActive,
            },
          ]);
          toast.success("Event created successfully");
        } else {
          toast.error(result.error ?? "Failed to create event");
        }
      } else if (editingId) {
        const result = await updateEvent(editingId, {
          title: notificationTitle,
          description: values.description || null,
          customSubject,
          customBody,
          date: values.date,
          endDate: values.endDate || null,
          eventTypeId,
          branchId,
          notificationBranchIds,
          notificationDaysBefore: values.notificationDaysBefore,
          isActive: values.isActive,
        });
        if (result.success) {
          setEvents(
            events.map((e) =>
              e.id === editingId
                ? {
                    ...e,
                    title: notificationTitle,
                    description: values.description || "",
                    customSubject,
                    customBody: customBody || "",
                    date: values.date,
                    endDate: values.endDate || null,
                    eventTypeId,
                    eventTypeColor: eventType?.color ?? "#0B9178",
                    eventTypeName: eventType?.name ?? "No Type",
                    branchId,
                    branchName,
                    notificationBranchIds,
                    notificationDaysBefore: values.notificationDaysBefore,
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

  function handleEventTypeChange(value: string) {
    const eventTypeId = value === "NONE" ? null : value;
    form.setValue("eventTypeId", eventTypeId);

    const eventType = eventTypes.find((option) => option.id === eventTypeId);
    if (!eventType) return;

    if (!form.getValues("title")) {
      form.setValue("title", eventType.name);
    }
    if (!form.getValues("customSubject") && eventType.defaultSubject) {
      form.setValue("customSubject", eventType.defaultSubject);
    }
    if (!form.getValues("customBody") && eventType.defaultMessage) {
      form.setValue("customBody", eventType.defaultMessage);
    }
  }

  function toggleBranch(branchId: string, checked: boolean) {
    const selected = form.getValues("notificationBranchIds");
    const next = checked
      ? Array.from(new Set([...selected, branchId]))
      : selected.filter((id) => id !== branchId);

    form.setValue("notificationBranchIds", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("branchId", next.length === 1 ? next[0] : null);
  }

  function toggleReminderDay(day: number, checked: boolean) {
    const selected = form.getValues("notificationDaysBefore");
    const next = checked
      ? Array.from(new Set([...selected, day])).sort((a, b) => a - b)
      : selected.filter((selectedDay) => selectedDay !== day);

    form.setValue("notificationDaysBefore", next, {
      shouldDirty: true,
      shouldValidate: true,
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
        header: "Branches",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: "notificationDaysBefore",
        header: "Reminders",
        cell: ({ row }) => {
          const days = row.original.notificationDaysBefore;
          return (
            <span className="text-muted-foreground">
              {days.length ? `${days.join(", ")} day(s)` : "None"}
            </span>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.isActive
                ? "bg-[#059669]/15 text-[#059669]"
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
        title="Alerts & Notifications"
        description="Here You Can Schedule Messages/Alerts prior of events"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Events Calendar" },
        ]}
        actions={
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => openAdd()}
            disabled={isPending}
          >
            <Plus className="mr-1 size-4" />
            Add A Notification
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
                                  style={{
                                    backgroundColor: ev.isActive
                                      ? ev.eventTypeColor
                                      : "#60778a",
                                  }}
                                  title={`${ev.title} (${ev.eventTypeName}) - Branches: ${ev.branchName}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(ev);
                                  }}
                                >
                                  {ev.title}
                                  <span className="block truncate font-normal opacity-90">
                                    Branches: {ev.branchName}
                                  </span>
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
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add A Notification" : "Edit Notification"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <input type="hidden" {...form.register("title")} />
            <input type="hidden" {...form.register("description")} />
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Cause</label>
                <Select
                  value={form.watch("eventTypeId") ?? "NONE"}
                  onValueChange={handleEventTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">-</SelectItem>
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
                <label className="mb-1.5 block text-sm font-medium">Event Date</label>
                <Input type="date" {...form.register("date")} />
                {form.formState.errors.date && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>
            </div>
            <input type="hidden" {...form.register("endDate")} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Subject</label>
              <Input
                placeholder="Notification subject"
                {...form.register("customSubject")}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Body</label>
              <Textarea
                placeholder="Notification body"
                {...form.register("customBody")}
                rows={3}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                Characters Count: {form.watch("customBody")?.length ?? 0}{" "}
                <span className="opacity-70">(155 per SMS)</span>
              </div>
              {form.formState.errors.customBody && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.customBody.message}
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Branches</label>
                <div className="grid max-h-[152px] gap-2 overflow-auto rounded-md border p-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.watch("notificationBranchIds").length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          form.setValue("notificationBranchIds", [], {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          form.setValue("branchId", null);
                        }
                      }}
                    />
                    All Branches
                  </label>
                  {branches.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.watch("notificationBranchIds").includes(branch.id)}
                        onCheckedChange={(checked) => toggleBranch(branch.id, !!checked)}
                      />
                      {branch.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Days Before</label>
                  <div className="grid grid-cols-2 gap-2 rounded-md border p-3 sm:grid-cols-5">
                    {REMINDER_DAY_OPTIONS.map((day) => (
                      <label key={day} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.watch("notificationDaysBefore").includes(day)}
                          onCheckedChange={(checked) => toggleReminderDay(day, !!checked)}
                        />
                        {day} Days
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={form.watch("isActive")}
                    onCheckedChange={(v) => form.setValue("isActive", !!v)}
                  />
                  Active
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Close
              </Button>
              <Button
                type="submit"
                className="text-primary-foreground"
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
                Save
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
