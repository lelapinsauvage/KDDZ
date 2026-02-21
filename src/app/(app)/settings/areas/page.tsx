"use client";

import { useState, useMemo } from "react";
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

interface Area {
  id: string;
  name: string;
  zone: string;
}

const zoneOptions = ["Zone A", "Zone B", "Zone C", "Zone D"];

const initialAreas: Area[] = [
  { id: "area-1", name: "Achrafieh", zone: "Zone A" },
  { id: "area-2", name: "Hamra", zone: "Zone A" },
  { id: "area-3", name: "Jounieh", zone: "Zone B" },
  { id: "area-4", name: "Baabda", zone: "Zone B" },
  { id: "area-5", name: "Sin el Fil", zone: "Zone C" },
  { id: "area-6", name: "Verdun", zone: "Zone D" },
];

export default function AreasManagementPage() {
  const [areas, setAreas] = useState(initialAreas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [areaName, setAreaName] = useState("");
  const [areaZone, setAreaZone] = useState(zoneOptions[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  function openAdd() {
    setDialogMode("add");
    setAreaName("");
    setAreaZone(zoneOptions[0]);
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(area: Area) {
    setDialogMode("edit");
    setAreaName(area.name);
    setAreaZone(area.zone);
    setEditingId(area.id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!areaName.trim()) return;
    if (dialogMode === "add") {
      setAreas([...areas, { id: `area-${Date.now()}`, name: areaName.trim(), zone: areaZone }]);
    } else if (editingId) {
      setAreas(areas.map((a) => (a.id === editingId ? { ...a, name: areaName.trim(), zone: areaZone } : a)));
    }
    setDialogOpen(false);
  }

  function handleDelete(id: string) {
    setAreas(areas.filter((a) => a.id !== id));
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
              <Select value={areaZone} onValueChange={setAreaZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zoneOptions.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
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
              disabled={!areaName.trim()}
            >
              {dialogMode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
