"use client";

import { useState, useTransition } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  districtId: string;
  _count?: { childAddresses: number };
}

interface DistrictItem {
  id: string;
  name: string;
  provinceId: string;
  regions: RegionItem[];
  _count?: { regions: number };
}

interface ProvinceItem {
  id: string;
  name: string;
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
  const [dialogValue, setDialogValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedProvince = provinces.find((p) => p.id === selectedProvinceId);
  const filteredDistricts = selectedProvince?.districts ?? [];
  const selectedDistrict = filteredDistricts.find((d) => d.id === selectedDistrictId);
  const filteredRegions = selectedDistrict?.regions ?? [];

  function openAddDialog(type: "province" | "district" | "region") {
    setDialogType(type);
    setDialogMode("add");
    setDialogValue("");
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditDialog(type: "province" | "district" | "region", id: string, name: string) {
    setDialogType(type);
    setDialogMode("edit");
    setDialogValue(name);
    setEditingId(id);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!dialogValue.trim()) return;

    startTransition(async () => {
      if (dialogType === "province") {
        if (dialogMode === "add") {
          const result = await createProvince(dialogValue.trim());
          if (result.success && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newProv = result.data as any;
            setProvinces([...provinces, { id: newProv.id, name: newProv.name, districts: [] }]);
          }
        } else if (editingId) {
          const result = await updateProvince(editingId, dialogValue.trim());
          if (result.success) {
            setProvinces(provinces.map((p) => (p.id === editingId ? { ...p, name: dialogValue.trim() } : p)));
          }
        }
      } else if (dialogType === "district") {
        if (dialogMode === "add" && selectedProvinceId) {
          const result = await createDistrict(dialogValue.trim(), selectedProvinceId);
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
                        { id: newDist.id, name: newDist.name, provinceId: selectedProvinceId, regions: [] },
                      ],
                    }
                  : p
              )
            );
          }
        } else if (editingId) {
          const result = await updateDistrict(editingId, dialogValue.trim());
          if (result.success) {
            setProvinces(
              provinces.map((p) => ({
                ...p,
                districts: p.districts.map((d) =>
                  d.id === editingId ? { ...d, name: dialogValue.trim() } : d
                ),
              }))
            );
          }
        }
      } else if (dialogType === "region") {
        if (dialogMode === "add" && selectedDistrictId) {
          const result = await createRegion(dialogValue.trim(), selectedDistrictId);
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
                          { id: newReg.id, name: newReg.name, districtId: selectedDistrictId },
                        ],
                      }
                    : d
                ),
              }))
            );
          }
        } else if (editingId) {
          const result = await updateRegion(editingId, dialogValue.trim());
          if (result.success) {
            setProvinces(
              provinces.map((p) => ({
                ...p,
                districts: p.districts.map((d) => ({
                  ...d,
                  regions: d.regions.map((r) =>
                    r.id === editingId ? { ...r, name: dialogValue.trim() } : r
                  ),
                })),
              }))
            );
          }
        }
      }

      setDialogOpen(false);
    });
  }

  function handleDelete(type: "province" | "district" | "region", id: string) {
    startTransition(async () => {
      if (type === "province") {
        const result = await deleteProvince(id);
        if (result.success) {
          setProvinces(provinces.filter((p) => p.id !== id));
          if (selectedProvinceId === id) {
            setSelectedProvinceId(null);
            setSelectedDistrictId(null);
          }
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
        }
      }
    });
  }

  const dialogLabel = dialogType === "province" ? "Province" : dialogType === "district" ? "District" : "Region";

  return (
    <>
      <PageHeader
        title="Regions Management"
        breadcrumbs={[
          { label: "Settings", href: "/settings/regions" },
          { label: "Regions Management" },
        ]}
      />

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* ── Provinces Column ─────────────── */}
          <div className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b bg-[#f1f3f6] px-4 py-3">
              <h2 className="text-sm font-semibold uppercase text-[#6f7b8a]">Provinces</h2>
              <Button
                size="sm"
                className="h-7 bg-[#1caf9a] text-white hover:bg-[#18a08d]"
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
                    <MapPin className="size-4 text-[#1caf9a]" />
                    <span className="text-sm font-medium">{prov.name}</span>
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
                        openEditDialog("province", prov.id, prov.name);
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
                        handleDelete("province", prov.id);
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
            <div className="flex items-center justify-between border-b bg-[#f1f3f6] px-4 py-3">
              <h2 className="text-sm font-semibold uppercase text-[#6f7b8a]">Districts</h2>
              <Button
                size="sm"
                className="h-7 bg-[#1caf9a] text-white hover:bg-[#18a08d]"
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
                        <span className="text-sm font-medium">{dist.name}</span>
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
                            openEditDialog("district", dist.id, dist.name);
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
                            handleDelete("district", dist.id);
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
            <div className="flex items-center justify-between border-b bg-[#f1f3f6] px-4 py-3">
              <h2 className="text-sm font-semibold uppercase text-[#6f7b8a]">Regions</h2>
              <Button
                size="sm"
                className="h-7 bg-[#1caf9a] text-white hover:bg-[#18a08d]"
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
                        <span className="text-sm font-medium">{reg.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => openEditDialog("region", reg.id, reg.name)}
                          disabled={isPending}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive"
                          onClick={() => handleDelete("region", reg.id)}
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
          <div className="py-4">
            <Input
              placeholder={`${dialogLabel} name`}
              value={dialogValue}
              onChange={(e) => setDialogValue(e.target.value)}
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
              disabled={!dialogValue.trim() || isPending}
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
