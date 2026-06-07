"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from "@/lib/actions/settings";
import type { ExportColumn } from "@/lib/export";

interface Area {
  id: string;
  name: string;
  referenceNumber: string;
  zone: string;
  zoneId: string;
  createdAt: string;
}

interface MouhafazaOption {
  id: string;
  name: string;
}

interface AreasClientProps {
  initialAreas: Area[];
  zoneOptions: MouhafazaOption[];
  initialSearchQuery?: string;
}

const areaExportColumns: ExportColumn[] = [
  { header: "#", key: "rowNumber" },
  { header: "Name", key: "name" },
  { header: "Reference Number", key: "referenceNumber" },
  { header: "Mouhafaza", key: "zone" },
  { header: "Datetime", key: "createdAt" },
];

export function AreasClient({ initialAreas, zoneOptions, initialSearchQuery }: AreasClientProps) {
  const [areas, setAreas] = useState(initialAreas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [areaName, setAreaName] = useState("");
  const [areaRef, setAreaRef] = useState("");
  const [areaZoneId, setAreaZoneId] = useState(zoneOptions[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function openAdd() {
    setDialogMode("add");
    setAreaName("");
    setAreaRef("");
    setAreaZoneId(zoneOptions[0]?.id ?? "");
    setEditingId(null);
    setDialogOpen(true);
  }

  const openEdit = useCallback((area: Area) => {
    setDialogMode("edit");
    setAreaName(area.name);
    setAreaRef(area.referenceNumber);
    setAreaZoneId(area.zoneId);
    setEditingId(area.id);
    setDialogOpen(true);
  }, []);

  function handleSave() {
    if (!areaName.trim()) return;
    startTransition(async () => {
      if (dialogMode === "add") {
        const result = await createDistrict(areaName.trim(), areaZoneId, areaRef.trim() || undefined);
        if (result.success && result.data) {
          const newArea = result.data as { id: string; name: string; referenceNumber: string | null; createdAt: string };
          const zoneName = zoneOptions.find((z) => z.id === areaZoneId)?.name ?? "";
          setAreas((prev) => [
            ...prev,
            {
              id: newArea.id,
              name: newArea.name,
              referenceNumber: newArea.referenceNumber ?? "",
              zone: zoneName,
              zoneId: areaZoneId,
              createdAt: new Date(newArea.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
            },
          ]);
          toast.success("Quadaa created successfully.");
        } else {
          toast.error("Failed to create Quadaa.");
        }
      } else if (editingId) {
        const result = await updateDistrict(editingId, areaName.trim(), areaRef.trim() || undefined);
        if (result.success) {
          setAreas((prev) =>
            prev.map((a) =>
              a.id === editingId ? { ...a, name: areaName.trim(), referenceNumber: areaRef.trim() } : a
            )
          );
          toast.success("Quadaa updated successfully.");
        } else {
          toast.error("Failed to update Quadaa.");
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteDistrict(deleteTarget.id);
      if (result.success) {
        setAreas((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        toast.success(`Quadaa "${deleteTarget.name}" deleted.`);
      } else {
        toast.error("Failed to delete Quadaa.");
      }
      setDeleteTarget(null);
    });
  }

  const columns: ColumnDef<Area>[] = useMemo(
    () => [
      {
        id: "rowNumber",
        header: "#",
        cell: ({ row }) => row.index + 1,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "referenceNumber",
        header: "Reference Number",
      },
      {
        accessorKey: "zone",
        header: "Mouhafaza",
      },
      {
        accessorKey: "createdAt",
        header: "Datetime",
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => setDeleteTarget({ id: row.original.id, name: row.original.name })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openEdit]
  );

  return (
    <>
      <PageHeader
        title="Quadaa Management"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Quadaa" },
        ]}
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            New Quadaa
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <DataTable
          columns={columns}
          data={areas}
          searchKey="name"
          searchPlaceholder="Search quadaa..."
          initialSearchValue={initialSearchQuery}
          searchMode="global"
          exportOptions={{
            filename: "quadaa",
            sheetName: "Quadaa",
            columns: areaExportColumns,
            mapRow: (area, index) => ({
              rowNumber: index + 1,
              name: area.name,
              referenceNumber: area.referenceNumber,
              zone: area.zone,
              createdAt: area.createdAt,
            }),
          }}
          printOptions={{ label: "Print" }}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "New Quadaa" : "Update Quadaa"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-1.5">Name</Label>
              <Input
                placeholder="Name"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Reference Number</Label>
              <Input
                placeholder="Reference number"
                value={areaRef}
                onChange={(e) => setAreaRef(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5">Mouhafaza</Label>
              <Select value={areaZoneId} onValueChange={setAreaZoneId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zoneOptions.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
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
              onClick={handleSave}
              disabled={!areaName.trim() || isPending}
            >
              {isPending ? "Saving..." : dialogMode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quadaa</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isPending} onClick={handleDeleteConfirm}>
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
