"use client";

import { useState, useMemo, useTransition } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  createDistrict,
  updateDistrict,
  deleteDistrict,
} from "@/lib/actions/settings";

interface Area {
  id: string;
  name: string;
  zone: string;
  zoneId: string;
}

interface ZoneOption {
  id: string;
  name: string;
}

interface AreasClientProps {
  initialAreas: Area[];
  zoneOptions: ZoneOption[];
}

export default function AreasClient({ initialAreas, zoneOptions }: AreasClientProps) {
  const [areas, setAreas] = useState(initialAreas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [areaName, setAreaName] = useState("");
  const [areaZoneId, setAreaZoneId] = useState(zoneOptions[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openAdd() {
    setDialogMode("add");
    setAreaName("");
    setAreaZoneId(zoneOptions[0]?.id ?? "");
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(area: Area) {
    setDialogMode("edit");
    setAreaName(area.name);
    setAreaZoneId(area.zoneId);
    setEditingId(area.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!areaName.trim()) return;
    startTransition(async () => {
      if (dialogMode === "add") {
        const result = await createDistrict(areaName.trim(), areaZoneId);
        if (result.success && result.data) {
          const newArea = result.data as { id: string; name: string };
          const zoneName = zoneOptions.find((z) => z.id === areaZoneId)?.name ?? "";
          setAreas([...areas, { id: newArea.id, name: newArea.name, zone: zoneName, zoneId: areaZoneId }]);
        }
      } else if (editingId) {
        const result = await updateDistrict(editingId, areaName.trim());
        if (result.success) {
          setAreas(areas.map((a) => (a.id === editingId ? { ...a, name: areaName.trim() } : a)));
        }
      }
      setDialogOpen(false);
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteDistrict(id);
      if (result.success) {
        setAreas(areas.filter((a) => a.id !== id));
      }
    });
  }

  const columns: ColumnDef<Area>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Area Name",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "zone",
        header: "Zone",
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
    [areas]
  );

  return (
    <>
      <PageHeader
        title="Areas Management"
        breadcrumbs={[
          { label: "Settings", href: "/settings/areas" },
          { label: "Areas Management" },
        ]}
      />

      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div />
          <Button className="bg-[#1caf9a] text-white hover:bg-[#18a08d]" onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            Add Area
          </Button>
        </div>

        <DataTable columns={columns} data={areas} searchKey="name" searchPlaceholder="Search areas..." />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add Area" : "Edit Area"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Area Name</label>
              <Input
                placeholder="Area name"
                value={areaName}
                onChange={(e) => setAreaName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Zone</label>
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
              style={{ background: "#1caf9a" }}
              className="text-white"
              onClick={handleSave}
              disabled={!areaName.trim() || isPending}
            >
              {isPending ? "Saving..." : dialogMode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
