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
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createProvince,
  updateProvince,
  deleteProvince,
} from "@/lib/actions/settings";

interface Zone {
  id: string;
  name: string;
  regionCount: number;
}

interface ZonesClientProps {
  initialZones: Zone[];
}

export default function ZonesClient({ initialZones }: ZonesClientProps) {
  const [zones, setZones] = useState(initialZones);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [zoneName, setZoneName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setDialogMode("add");
    setZoneName("");
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(zone: Zone) {
    setDialogMode("edit");
    setZoneName(zone.name);
    setEditingId(zone.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!zoneName.trim()) return;
    startTransition(async () => {
      if (dialogMode === "add") {
        const result = await createProvince(zoneName.trim());
        if (result.success && result.data) {
          const newZone = result.data as { id: string; name: string };
          setZones([...zones, { id: newZone.id, name: newZone.name, regionCount: 0 }]);
        }
      } else if (editingId) {
        const result = await updateProvince(editingId, zoneName.trim());
        if (result.success) {
          setZones(zones.map((z) => (z.id === editingId ? { ...z, name: zoneName.trim() } : z)));
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteProvince(id);
      if (result.success) {
        setZones(zones.filter((z) => z.id !== id));
      }
    });
  }

  const columns: ColumnDef<Zone>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Zone Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "regionCount",
        header: "Region Count",
        cell: ({ row }) => row.original.regionCount,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(row.original)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zones]
  );

  return (
    <>
      <PageHeader
        title="Zones Management"
        breadcrumbs={[
          { label: "Settings", href: "/settings/zones" },
          { label: "Zones Management" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between">
          <div />
          <Button className="bg-[#1caf9a] text-white hover:bg-[#18a08d]" onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            Add Zone
          </Button>
        </div>

        <DataTable columns={columns} data={zones} searchKey="name" searchPlaceholder="Search zones..." />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Zone" : "Edit Zone"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Zone name"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSave}
              disabled={!zoneName.trim() || isPending}
            >
              {isPending ? "Saving..." : dialogMode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
