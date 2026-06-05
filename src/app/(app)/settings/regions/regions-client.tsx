"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
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
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  createProvince,
  updateProvince,
  deleteProvince,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  createRegion,
  updateRegion,
  deleteRegion,
} from "@/lib/actions/settings";

// ── Types ──────────────────────────────────
interface RegionItem {
  id: string;
  name: string;
  referenceNumber: string;
  createdAt: string;
  districtId: string;
  _count?: { childAddresses: number };
}

interface DistrictItem {
  id: string;
  name: string;
  referenceNumber: string;
  createdAt: string;
  provinceId: string;
  regions: RegionItem[];
  _count?: { regions: number };
}

interface ProvinceItem {
  id: string;
  name: string;
  referenceNumber: string;
  createdAt: string;
  districts: DistrictItem[];
}

interface RegionsClientProps {
  provinces: ProvinceItem[];
}

export function RegionsClient({ provinces: initialProvinces }: RegionsClientProps) {
  const [provinces, setProvinces] = useState(initialProvinces);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(
    initialProvinces[0]?.id ?? null
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    initialProvinces[0]?.districts[0]?.id ?? null
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"province" | "district" | "region">("province");
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [dialogName, setDialogName] = useState("");
  const [dialogRef, setDialogRef] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "province" | "district" | "region";
    id: string;
    name: string;
  } | null>(null);

  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId);
  const filteredDistricts = selectedProvince?.districts ?? [];
  const selectedDistrict = filteredDistricts.find((d) => d.id === selectedDistrictId);
  const filteredRegions = selectedDistrict?.regions ?? [];

  function formatCreatedAt(value: string | Date | null | undefined) {
    if (!value) return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function openAddDialog(type: "province" | "district" | "region") {
    setDialogType(type);
    setDialogMode("add");
    setDialogName("");
    setDialogRef("");
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditDialog(type: "province" | "district" | "region", id: string, name: string, refNum: string) {
    setDialogType(type);
    setDialogMode("edit");
    setDialogName(name);
    setDialogRef(refNum);
    setEditingId(id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!dialogName.trim()) return;

    startTransition(async () => {
      const refVal = dialogRef.trim() || undefined;
      const typeLabel = dialogType === "province" ? "Province" : dialogType === "district" ? "District" : "Region";

      if (dialogType === "province") {
        if (dialogMode === "add") {
          const result = await createProvince(dialogName.trim(), refVal);
          if (result.success && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newProv = result.data as any;
            setProvinces([
              ...provinces,
              {
                id: newProv.id,
                name: newProv.name,
                referenceNumber: newProv.referenceNumber ?? "",
                createdAt: formatCreatedAt(newProv.createdAt),
                districts: [],
              },
            ]);
            toast.success(`${typeLabel} created successfully.`);
          } else {
            toast.error(`Failed to create ${typeLabel.toLowerCase()}.`);
          }
        } else if (editingId) {
          const result = await updateProvince(editingId, dialogName.trim(), refVal);
          if (result.success) {
            setProvinces(provinces.map((p) => (p.id === editingId ? { ...p, name: dialogName.trim(), referenceNumber: dialogRef.trim() } : p)));
            toast.success(`${typeLabel} updated successfully.`);
          } else {
            toast.error(`Failed to update ${typeLabel.toLowerCase()}.`);
          }
        }
      } else if (dialogType === "district") {
        if (dialogMode === "add" && selectedProvinceId) {
          const result = await createDistrict(dialogName.trim(), selectedProvinceId, refVal);
          if (result.success && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newDist = result.data as any;
            setProvinces(
              provinces.map((p) =>
                p.id === selectedProvinceId
                  ? {
                      ...p,
                      districts: [
                        ...p.districts,
                        {
                          id: newDist.id,
                          name: newDist.name,
                          referenceNumber: newDist.referenceNumber ?? "",
                          createdAt: formatCreatedAt(newDist.createdAt),
                          provinceId: selectedProvinceId,
                          regions: [],
                        },
                      ],
                    }
                  : p
              )
            );
            toast.success(`${typeLabel} created successfully.`);
          } else {
            toast.error(`Failed to create ${typeLabel.toLowerCase()}.`);
          }
        } else if (editingId) {
          const result = await updateDistrict(editingId, dialogName.trim(), refVal);
          if (result.success) {
            setProvinces(
              provinces.map((p) => ({
                ...p,
                districts: p.districts.map((d) =>
                  d.id === editingId ? { ...d, name: dialogName.trim(), referenceNumber: dialogRef.trim() } : d
                ),
              }))
            );
            toast.success(`${typeLabel} updated successfully.`);
          } else {
            toast.error(`Failed to update ${typeLabel.toLowerCase()}.`);
          }
        }
      } else if (dialogType === "region") {
        if (dialogMode === "add" && selectedDistrictId) {
          const result = await createRegion(dialogName.trim(), selectedDistrictId, refVal);
          if (result.success && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newReg = result.data as any;
            setProvinces(
              provinces.map((p) => ({
                ...p,
                districts: p.districts.map((d) =>
                  d.id === selectedDistrictId
                    ? {
                        ...d,
                        regions: [
                          ...d.regions,
                          {
                            id: newReg.id,
                            name: newReg.name,
                            referenceNumber: newReg.referenceNumber ?? "",
                            createdAt: formatCreatedAt(newReg.createdAt),
                            districtId: selectedDistrictId,
                          },
                        ],
                      }
                    : d
                ),
              }))
            );
            toast.success(`${typeLabel} created successfully.`);
          } else {
            toast.error(`Failed to create ${typeLabel.toLowerCase()}.`);
          }
        } else if (editingId) {
          const result = await updateRegion(editingId, dialogName.trim(), refVal);
          if (result.success) {
            setProvinces(
              provinces.map((p) => ({
                ...p,
                districts: p.districts.map((d) => ({
                  ...d,
                  regions: d.regions.map((r) =>
                    r.id === editingId ? { ...r, name: dialogName.trim(), referenceNumber: dialogRef.trim() } : r
                  ),
                })),
              }))
            );
            toast.success(`${typeLabel} updated successfully.`);
          } else {
            toast.error(`Failed to update ${typeLabel.toLowerCase()}.`);
          }
        }
      }

      setDialogOpen(false);
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;
    const typeLabel = type === "province" ? "Province" : type === "district" ? "District" : "Region";

    startTransition(async () => {
      if (type === "province") {
        const result = await deleteProvince(id);
        if (result.success) {
          setProvinces(provinces.filter((p) => p.id !== id));
          if (selectedProvinceId === id) {
            setSelectedProvinceId(null);
            setSelectedDistrictId(null);
          }
          toast.success(`${typeLabel} "${name}" deleted.`);
        } else {
          toast.error(`Failed to delete ${typeLabel.toLowerCase()}.`);
        }
      } else if (type === "district") {
        const result = await deleteDistrict(id);
        if (result.success) {
          setProvinces(
            provinces.map((p) => ({
              ...p,
              districts: p.districts.filter((d) => d.id !== id),
            }))
          );
          if (selectedDistrictId === id) setSelectedDistrictId(null);
          toast.success(`${typeLabel} "${name}" deleted.`);
        } else {
          toast.error(`Failed to delete ${typeLabel.toLowerCase()}.`);
        }
      } else {
        const result = await deleteRegion(id);
        if (result.success) {
          setProvinces(
            provinces.map((p) => ({
              ...p,
              districts: p.districts.map((d) => ({
                ...d,
                regions: d.regions.filter((r) => r.id !== id),
              })),
            }))
          );
          toast.success(`${typeLabel} "${name}" deleted.`);
        } else {
          toast.error(`Failed to delete ${typeLabel.toLowerCase()}.`);
        }
      }
      setDeleteTarget(null);
    });
  }

  const dialogLabel = dialogType === "province" ? "Province" : dialogType === "district" ? "District" : "Region";

  return (
    <>
      <PageHeader
        title="Regions Management"
        breadcrumbs={[
          { label: "Settings", href: "/settings/nursery" },
          { label: "Regions" },
        ]}
      />

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* ── Provinces Column ─────────────── */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Provinces</h2>
              <Button
                size="sm"
                className="h-7"
                onClick={() => openAddDialog("province")}
                disabled={isPending}
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </div>
            <div className="divide-y">
              {provinces.map((prov) => (
                <div
                  key={prov.id}
                  className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 ${
                    selectedProvinceId === prov.id ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    setSelectedProvinceId(prov.id);
                    setSelectedDistrictId(null);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-primary" />
                    <div>
                      <span className="text-sm font-medium">{prov.name}</span>
                      {prov.referenceNumber && (
                        <span className="ml-2 text-xs text-muted-foreground">#{prov.referenceNumber}</span>
                      )}
                      <p className="text-xs text-muted-foreground">Created {prov.createdAt}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({prov.districts.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog("province", prov.id, prov.name, prov.referenceNumber);
                      }}
                      disabled={isPending}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({ type: "province", id: prov.id, name: prov.name });
                      }}
                      disabled={isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
              {provinces.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No provinces yet.</p>
              )}
            </div>
          </div>

          {/* ── Districts Column ─────────────── */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Districts</h2>
              <Button
                size="sm"
                className="h-7"
                onClick={() => openAddDialog("district")}
                disabled={!selectedProvinceId || isPending}
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </div>
            <div className="divide-y">
              {selectedProvinceId ? (
                filteredDistricts.length > 0 ? (
                  filteredDistricts.map((dist) => (
                    <div
                      key={dist.id}
                      className={`flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 ${
                        selectedDistrictId === dist.id ? "bg-muted" : ""
                      }`}
                      onClick={() => setSelectedDistrictId(dist.id)}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-blue-500" />
                        <div>
                          <span className="text-sm font-medium">{dist.name}</span>
                          {dist.referenceNumber && (
                            <span className="ml-2 text-xs text-muted-foreground">#{dist.referenceNumber}</span>
                          )}
                          <p className="text-xs text-muted-foreground">Created {dist.createdAt}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({dist.regions.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog("district", dist.id, dist.name, dist.referenceNumber);
                          }}
                          disabled={isPending}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ type: "district", id: dist.id, name: dist.name });
                          }}
                          disabled={isPending}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">No districts in this province.</p>
                )
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">Select a province first.</p>
              )}
            </div>
          </div>

          {/* ── Regions Column ──────────────── */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">Regions</h2>
              <Button
                size="sm"
                className="h-7"
                onClick={() => openAddDialog("region")}
                disabled={!selectedDistrictId || isPending}
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </div>
            <div className="divide-y">
              {selectedDistrictId ? (
                filteredRegions.length > 0 ? (
                  filteredRegions.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-orange-500" />
                        <div>
                          <span className="text-sm font-medium">{reg.name}</span>
                          {reg.referenceNumber && (
                            <span className="ml-2 text-xs text-muted-foreground">#{reg.referenceNumber}</span>
                          )}
                          <p className="text-xs text-muted-foreground">Created {reg.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => openEditDialog("region", reg.id, reg.name, reg.referenceNumber)}
                          disabled={isPending}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => setDeleteTarget({ type: "region", id: reg.id, name: reg.name })}
                          disabled={isPending}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">No regions in this district.</p>
                )
              ) : (
                <p className="p-4 text-center text-sm text-muted-foreground">Select a district first.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Dialog ────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? `Add ${dialogLabel}` : `Edit ${dialogLabel}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-1.5">{dialogLabel} Name</Label>
              <Input
                placeholder={`${dialogLabel} name`}
                value={dialogName}
                onChange={(e) => setDialogName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
            <div>
              <Label className="mb-1.5">Reference Number</Label>
              <Input
                placeholder="Reference number"
                value={dialogRef}
                onChange={(e) => setDialogRef(e.target.value)}
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
              disabled={!dialogName.trim() || isPending}
            >
              {isPending && <Loader2 className="mr-1 size-4 animate-spin" />}
              {dialogMode === "add" ? "Add" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget?.type === "province" ? "Province" : deleteTarget?.type === "district" ? "District" : "Region"}
            </AlertDialogTitle>
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
