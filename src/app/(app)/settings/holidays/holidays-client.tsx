"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, CalendarDays, Loader2 } from "lucide-react";
import {
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "@/lib/actions/settings";

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

export function HolidaysClient({ holidays: initialHolidays, branches }: HolidaysClientProps) {
  const [holidays, setHolidays] = useState(initialHolidays);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [holName, setHolName] = useState("");
  const [holDate, setHolDate] = useState("");
  const [holBranchId, setHolBranchId] = useState("ALL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setDialogMode("add");
    setHolName("");
    setHolDate("");
    setHolBranchId("ALL");
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(h: Holiday) {
    setDialogMode("edit");
    setHolName(h.name);
    setHolDate(h.date);
    setHolBranchId(h.branchId ?? "ALL");
    setEditingId(h.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!holName.trim() || !holDate) return;

    startTransition(async () => {
      const branchId = holBranchId === "ALL" ? null : holBranchId;
      const branchName = branchId
        ? (branches.find((b) => b.id === branchId)?.name ?? "—")
        : "All Branches";

      if (dialogMode === "add") {
        const result = await createHoliday({
          name: holName.trim(),
          date: holDate,
          branchId,
        });
        if (result.success && result.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newHol = result.data as any;
          setHolidays([
            ...holidays,
            {
              id: newHol.id,
              name: holName.trim(),
              date: holDate,
              branch: branchName,
              branchId,
            },
          ]);
        }
      } else if (editingId) {
        const result = await updateHoliday(editingId, {
          name: holName.trim(),
          date: holDate,
          branchId,
        });
        if (result.success) {
          setHolidays(
            holidays.map((h) =>
              h.id === editingId
                ? { ...h, name: holName.trim(), date: holDate, branch: branchName, branchId }
                : h
            )
          );
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteHoliday(id);
      if (result.success) {
        setHolidays(holidays.filter((h) => h.id !== id));
      }
    });
  }

  const columns: ColumnDef<Holiday>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Holiday Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-[#1caf9a]" />
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
    [holidays, isPending]
  );

  return (
    <>
      <PageHeader
        title="Holiday Calendar"
        breadcrumbs={[
          { label: "Settings", href: "/settings/holidays" },
          { label: "Holiday Calendar" },
        ]}
      />

      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div />
          <Button className="bg-[#1caf9a] text-white hover:bg-[#18a08d]" onClick={openAdd} disabled={isPending}>
            <Plus className="mr-1 size-4" />
            Add Holiday
          </Button>
        </div>

        <DataTable columns={columns} data={holidays} searchKey="name" searchPlaceholder="Search holidays..." />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Holiday" : "Edit Holiday"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Holiday Name</label>
              <Input placeholder="e.g. Independence Day" value={holName} onChange={(e) => setHolName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date</label>
              <Input type="date" value={holDate} onChange={(e) => setHolDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Branch</label>
              <Select value={holBranchId} onValueChange={setHolBranchId}>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSave}
              disabled={!holName.trim() || !holDate || isPending}
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
