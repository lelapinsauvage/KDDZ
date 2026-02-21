"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  createEventType,
  updateEventType,
  deleteEventType,
} from "@/lib/actions/settings";

interface EventType {
  id: string;
  name: string;
  color: string;
  eventCount: number;
}

interface EventsClientProps {
  eventTypes: EventType[];
}

const colorOptions = [
  { label: "Pink", value: "#ec4899" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Red", value: "#ef4444" },
  { label: "Teal", value: "#1caf9a" },
  { label: "Orange", value: "#f97316" },
  { label: "Purple", value: "#a855f7" },
  { label: "Yellow", value: "#eab308" },
];

export function EventsClient({ eventTypes: initialEventTypes }: EventsClientProps) {
  const [eventTypes, setEventTypes] = useState(initialEventTypes);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [etName, setEtName] = useState("");
  const [etColor, setEtColor] = useState("#1caf9a");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setDialogMode("add");
    setEtName("");
    setEtColor("#1caf9a");
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(et: EventType) {
    setDialogMode("edit");
    setEtName(et.name);
    setEtColor(et.color);
    setEditingId(et.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!etName.trim()) return;

    startTransition(async () => {
      if (dialogMode === "add") {
        const result = await createEventType({ name: etName.trim(), color: etColor });
        if (result.success && result.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newEt = result.data as any;
          setEventTypes([
            ...eventTypes,
            { id: newEt.id, name: etName.trim(), color: etColor, eventCount: 0 },
          ]);
        }
      } else if (editingId) {
        const result = await updateEventType(editingId, { name: etName.trim(), color: etColor });
        if (result.success) {
          setEventTypes(
            eventTypes.map((e) =>
              e.id === editingId ? { ...e, name: etName.trim(), color: etColor } : e
            )
          );
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteEventType(id);
      if (result.success) {
        setEventTypes(eventTypes.filter((e) => e.id !== id));
      }
    });
  }

  const columns: ColumnDef<EventType>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Event Type Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div
              className="size-4 rounded-full"
              style={{ backgroundColor: row.original.color }}
            />
            <span className="text-xs text-muted-foreground">{row.original.color}</span>
          </div>
        ),
      },
      {
        accessorKey: "eventCount",
        header: "Event Count",
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
              onClick={() => handleDelete(row.original.id)}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventTypes, isPending]
  );

  return (
    <>
      <PageHeader
        title="Event Types"
        breadcrumbs={[
          { label: "Settings", href: "/settings/events" },
          { label: "Event Types" },
        ]}
      />

      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div />
          <Button className="bg-[#1caf9a] text-white hover:bg-[#18a08d]" onClick={openAdd} disabled={isPending}>
            <Plus className="mr-1 size-4" />
            Add Event Type
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={eventTypes}
          searchKey="name"
          searchPlaceholder="Search event types..."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Add Event Type" : "Edit Event Type"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Event Type Name</label>
              <Input
                placeholder="e.g. Field Trip"
                value={etName}
                onChange={(e) => setEtName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Color</label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`size-8 rounded-full border-2 transition-all ${
                      etColor === c.value ? "border-[#333] scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setEtColor(c.value)}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSave}
              disabled={!etName.trim() || isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              {dialogMode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
