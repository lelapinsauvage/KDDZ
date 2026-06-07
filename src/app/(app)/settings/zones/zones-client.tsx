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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createProvince,
  updateProvince,
  deleteProvince,
} from "@/lib/actions/settings";
import type { ExportColumn } from "@/lib/export";

interface Zone {
  id: string;
  name: string;
  referenceNumber: string;
  createdAt: string;
  regionCount: number;
}

interface ZonesClientProps {
  initialZones: Zone[];
  initialSearchQuery?: string;
}

const zoneExportColumns: ExportColumn[] = [
  { header: "#", key: "rowNumber" },
  { header: "Name", key: "name" },
  { header: "Ref. Number", key: "referenceNumber" },
  { header: "Created Date", key: "createdAt" },
];

export function ZonesClient({ initialZones, initialSearchQuery }: ZonesClientProps) {
  const [zones, setZones] = useState(initialZones);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [zoneName, setZoneName] = useState("");
  const [zoneRef, setZoneRef] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function openAdd() {
    setDialogMode("add");
    setZoneName("");
    setZoneRef("");
    setEditingId(null);
    setDialogOpen(true);
  }

  const openEdit = useCallback((zone: Zone) => {
    setDialogMode("edit");
    setZoneName(zone.name);
    setZoneRef(zone.referenceNumber);
    setEditingId(zone.id);
    setDialogOpen(true);
  }, []);

  function handleSave() {
    if (!zoneName.trim()) return;
    startTransition(async () => {
      if (dialogMode === "add") {
        const result = await createProvince(zoneName.trim(), zoneRef.trim() || undefined);
        if (result.success && result.data) {
          const newZone = result.data as { id: string; name: string; referenceNumber: string | null; createdAt: string };
          setZones((prev) => [
            ...prev,
            {
              id: newZone.id,
              name: newZone.name,
              referenceNumber: newZone.referenceNumber ?? "",
              createdAt: new Date(newZone.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              regionCount: 0,
            },
          ]);
          toast.success("Mouhafaza created successfully.");
        } else {
          toast.error("Failed to create Mouhafaza.");
        }
      } else if (editingId) {
        const result = await updateProvince(editingId, zoneName.trim(), zoneRef.trim() || undefined);
        if (result.success) {
          setZones((prev) =>
            prev.map((z) =>
              z.id === editingId ? { ...z, name: zoneName.trim(), referenceNumber: zoneRef.trim() } : z
            )
          );
          toast.success("Mouhafaza updated successfully.");
        } else {
          toast.error("Failed to update Mouhafaza.");
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteProvince(deleteTarget.id);
      if (result.success) {
        setZones((prev) => prev.filter((z) => z.id !== deleteTarget.id));
        toast.success(`Mouhafaza "${deleteTarget.name}" deleted.`);
      } else {
        toast.error("Failed to delete Mouhafaza.");
      }
      setDeleteTarget(null);
    });
  }

  const columns: ColumnDef<Zone>[] = useMemo(
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
        header: "Ref. Number",
      },
      {
        accessorKey: "createdAt",
        header: "Created Date",
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => openEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8 text-destructive hover:bg-destructive/10"
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
        title="Mouhafazat"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Mouhafazat" },
        ]}
        actions={
          <Button onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            New Mouhafaza
          </Button>
        }
      />

      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={zones}
              searchKey="name"
              searchPlaceholder="Search mouhafazat..."
              initialSearchValue={initialSearchQuery}
              searchMode="global"
              exportOptions={{
                filename: "mouhafazat",
                sheetName: "Mouhafazat",
                columns: zoneExportColumns,
                mapRow: (zone, index) => ({
                  rowNumber: index + 1,
                  name: zone.name,
                  referenceNumber: zone.referenceNumber,
                  createdAt: zone.createdAt,
                }),
              }}
              printOptions={{ label: "Print" }}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Create Mouhafaza" : "Edit Mouhafaza"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-1.5">Mouhafaza Name</Label>
              <Input
                placeholder="Mouhafaza name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5">Reference Number</Label>
              <Input
                placeholder="Reference number"
                value={zoneRef}
                onChange={(e) => setZoneRef(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!zoneName.trim() || isPending}
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
            <AlertDialogTitle>Delete Mouhafaza</AlertDialogTitle>
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
