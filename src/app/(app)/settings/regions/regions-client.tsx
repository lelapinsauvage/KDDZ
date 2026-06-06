"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { createRegion, deleteRegion, updateRegion } from "@/lib/actions/settings";

interface RegionRow {
  id: string;
  name: string;
  referenceNumber: string;
  quadaa: string;
  quadaaId: string;
  createdAt: string;
  createdDate: string;
}

interface NumberedRegionRow extends RegionRow {
  rowNumber: number;
}

interface QuadaaOption {
  id: string;
  name: string;
}

interface RegionsClientProps {
  initialRegions: RegionRow[];
  quadaaOptions: QuadaaOption[];
}

interface RegionFilters {
  rowNumber: string;
  name: string;
  referenceNumber: string;
  quadaa: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: RegionFilters = {
  rowNumber: "",
  name: "",
  referenceNumber: "",
  quadaa: "",
  dateFrom: "",
  dateTo: "",
};

function formatDisplayDate(value: string | Date | null | undefined) {
  if (!value) {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateFilterValue(value: string | Date | null | undefined) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function includesFilter(value: string | number, filter: string) {
  return String(value).toLowerCase().includes(filter.trim().toLowerCase());
}

export function RegionsClient({ initialRegions, quadaaOptions }: RegionsClientProps) {
  const [regions, setRegions] = useState(initialRegions);
  const [filters, setFilters] = useState<RegionFilters>(emptyFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [regionName, setRegionName] = useState("");
  const [regionRef, setRegionRef] = useState("");
  const [regionQuadaaId, setRegionQuadaaId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function updateFilter(key: keyof RegionFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function openAdd() {
    setDialogMode("add");
    setRegionName("");
    setRegionRef("");
    setRegionQuadaaId("");
    setEditingId(null);
    setDialogOpen(true);
  }

  const openEdit = useCallback((region: RegionRow) => {
    setDialogMode("edit");
    setRegionName(region.name);
    setRegionRef(region.referenceNumber);
    setRegionQuadaaId(region.quadaaId);
    setEditingId(region.id);
    setDialogOpen(true);
  }, []);

  function handleSave() {
    const trimmedName = regionName.trim();
    const trimmedRef = regionRef.trim();

    if (!trimmedName || !trimmedRef || !regionQuadaaId) {
      toast.error("Please fill all fields.");
      return;
    }

    const quadaaName = quadaaOptions.find((q) => q.id === regionQuadaaId)?.name ?? "";

    startTransition(async () => {
      if (dialogMode === "add") {
        const result = await createRegion(trimmedName, regionQuadaaId, trimmedRef);

        if (result.success && result.data) {
          const newRegion = result.data as {
            id: string;
            name: string;
            referenceNumber: string | null;
            districtId: string;
            createdAt: string | Date;
          };

          setRegions((prev) => [
            ...prev,
            {
              id: newRegion.id,
              name: newRegion.name,
              referenceNumber: newRegion.referenceNumber ?? "",
              quadaa: quadaaName,
              quadaaId: newRegion.districtId,
              createdAt: formatDisplayDate(newRegion.createdAt),
              createdDate: formatDateFilterValue(newRegion.createdAt),
            },
          ]);
          toast.success("Region created successfully.");
          setDialogOpen(false);
        } else {
          toast.error("Failed to create Region.");
        }
      } else if (editingId) {
        const result = await updateRegion(editingId, trimmedName, trimmedRef, regionQuadaaId);

        if (result.success) {
          setRegions((prev) =>
            prev.map((region) =>
              region.id === editingId
                ? {
                    ...region,
                    name: trimmedName,
                    referenceNumber: trimmedRef,
                    quadaa: quadaaName,
                    quadaaId: regionQuadaaId,
                  }
                : region
            )
          );
          toast.success("Region updated successfully.");
          setDialogOpen(false);
        } else {
          toast.error("Failed to update Region.");
        }
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteRegion(deleteTarget.id);

      if (result.success) {
        setRegions((prev) => prev.filter((region) => region.id !== deleteTarget.id));
        toast.success(`Region "${deleteTarget.name}" deleted.`);
      } else {
        toast.error("Failed to delete Region.");
      }

      setDeleteTarget(null);
    });
  }

  const numberedRegions = useMemo<NumberedRegionRow[]>(
    () => regions.map((region, index) => ({ ...region, rowNumber: index + 1 })),
    [regions],
  );

  const filteredRegions = useMemo(
    () =>
      numberedRegions.filter((region) => {
        if (filters.rowNumber && !includesFilter(region.rowNumber, filters.rowNumber)) return false;
        if (filters.name && !includesFilter(region.name, filters.name)) return false;
        if (filters.referenceNumber && !includesFilter(region.referenceNumber, filters.referenceNumber)) return false;
        if (filters.quadaa && !includesFilter(region.quadaa, filters.quadaa)) return false;
        if (filters.dateFrom && region.createdDate < filters.dateFrom) return false;
        if (filters.dateTo && region.createdDate > filters.dateTo) return false;

        return true;
      }),
    [filters, numberedRegions],
  );

  const columns: ColumnDef<NumberedRegionRow>[] = useMemo(
    () => [
      {
        accessorKey: "rowNumber",
        header: "#",
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
        accessorKey: "quadaa",
        header: "Quadaa",
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
    [openEdit],
  );

  return (
    <>
      <PageHeader
        title="Regions"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Regions" },
        ]}
        actions={
          <Button onClick={openAdd} disabled={quadaaOptions.length === 0}>
            <Plus className="mr-1 size-4" />
            New Region
          </Button>
        }
      />

      <div className="space-y-4 p-4 md:p-6">
        <div className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-muted-foreground">Regions Listing</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFilters(emptyFilters)}>
              <X className="mr-1 size-3.5" />
              Clear
            </Button>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
            <Input
              aria-label="Filter by row number"
              placeholder="#"
              value={filters.rowNumber}
              onChange={(event) => updateFilter("rowNumber", event.target.value)}
            />
            <Input
              aria-label="Filter by name"
              placeholder="Name"
              value={filters.name}
              onChange={(event) => updateFilter("name", event.target.value)}
            />
            <Input
              aria-label="Filter by reference number"
              placeholder="Reference Number"
              value={filters.referenceNumber}
              onChange={(event) => updateFilter("referenceNumber", event.target.value)}
            />
            <Input
              aria-label="Filter by Quadaa"
              placeholder="Quadaa"
              value={filters.quadaa}
              onChange={(event) => updateFilter("quadaa", event.target.value)}
            />
            <Input
              aria-label="Filter from date"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => updateFilter("dateFrom", event.target.value)}
            />
            <Input
              aria-label="Filter to date"
              type="date"
              value={filters.dateTo}
              onChange={(event) => updateFilter("dateTo", event.target.value)}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredRegions}
          searchKey="name"
          searchPlaceholder="Search regions..."
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "New Region" : "Update Region"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-1.5">Name</Label>
              <Input
                placeholder="Name"
                value={regionName}
                onChange={(event) => setRegionName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSave();
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5">Reference Number</Label>
              <Input
                placeholder="Reference Number"
                value={regionRef}
                onChange={(event) => setRegionRef(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSave();
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5">Quadaa</Label>
              <Select value={regionQuadaaId} onValueChange={setRegionQuadaaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Quadaa.." />
                </SelectTrigger>
                <SelectContent>
                  {quadaaOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
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
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : dialogMode === "add" ? "Add" : "Update"}
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
            <AlertDialogTitle>Delete Region</AlertDialogTitle>
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
