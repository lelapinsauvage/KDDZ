"use client";

import { useState, useMemo, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  GraduationCap,
  Users,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  Camera,
  ImageIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { createClass, updateClass, deleteClass } from "@/lib/actions/classes";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ClassItem {
  id: string;
  name: string;
  branchId: string;
  branchName: string;
  language: string | null;
  ageFrom: number | null;
  ageTo: number | null;
  ageFromUnit: "YEARS" | "MONTHS" | null;
  ageToUnit: "YEARS" | "MONTHS" | null;
  cameraNumber: number | null;
  maxStudents: number;
  studentCount: number;
  imageUrl: string | null;
  isActive: boolean;
}

export interface BranchOption {
  id: string;
  name: string;
}

interface ClassesClientProps {
  classes: ClassItem[];
  branches: BranchOption[];
  /** When set, hides PageHeader and branch filter (used inside branch detail) */
  branchId?: string;
}

// ── Avatar colors ──────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  { bg: "bg-[#C17C5A]/15", text: "text-[#A0613E]" },
  { bg: "bg-[#A0784C]/15", text: "text-[#8B6537]" },
  { bg: "bg-[#6B8F71]/15", text: "text-[#567352]" },
  { bg: "bg-[#B07D62]/15", text: "text-[#9A664A]" },
  { bg: "bg-[#8B7355]/15", text: "text-[#755F45]" },
  { bg: "bg-[#9B8579]/15", text: "text-[#7D6A5E]" },
  { bg: "bg-[#7A8B6E]/15", text: "text-[#636F58]" },
  { bg: "bg-[#C4956A]/15", text: "text-[#A07A52]" },
  { bg: "bg-[#8E7B6D]/15", text: "text-[#756457]" },
  { bg: "bg-[#A89080]/15", text: "text-[#8A7466]" },
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatAge(value: number | null, unit: "YEARS" | "MONTHS" | null) {
  if (value === null || value === undefined) return null;
  if (unit === "MONTHS") {
    const years = Math.floor(value / 12);
    const months = value % 12;
    if (years > 0 && months > 0) return `${years}yr ${months}mo`;
    if (years > 0) return `${years}yr`;
    return `${months}mo`;
  }
  return `${value}yr`;
}

// ── Empty form state ───────────────────────────────────────────────────────

interface ClassFormState {
  name: string;
  branchId: string;
  language: string;
  ageFromYears: string;
  ageFromMonths: string;
  ageToYears: string;
  ageToMonths: string;
  cameraNumber: string;
  maxStudents: string;
  imageUrl: string;
  isActive: boolean;
}

function emptyForm(branchId?: string): ClassFormState {
  return {
    name: "",
    branchId: branchId ?? "",
    language: "",
    ageFromYears: "",
    ageFromMonths: "",
    ageToYears: "",
    ageToMonths: "",
    cameraNumber: "",
    maxStudents: "",
    imageUrl: "",
    isActive: true,
  };
}

function decomposeAge(
  value: number | null,
  unit: "YEARS" | "MONTHS" | null,
): { years: string; months: string } {
  if (value === null) return { years: "", months: "" };
  const totalMonths = unit === "YEARS" ? value * 12 : value;
  return {
    years: Math.floor(totalMonths / 12).toString(),
    months: (totalMonths % 12).toString(),
  };
}

function formAgeToStorage(
  years: string,
  months: string,
): { value: number | null; unit: "MONTHS" | null } {
  const y = years ? parseInt(years) : 0;
  const m = months ? parseInt(months) : 0;
  const total = y * 12 + m;
  if (total === 0 && !years && !months) return { value: null, unit: null };
  return { value: total, unit: "MONTHS" };
}

function classToForm(cls: ClassItem): ClassFormState {
  const from = decomposeAge(cls.ageFrom, cls.ageFromUnit);
  const to = decomposeAge(cls.ageTo, cls.ageToUnit);
  return {
    name: cls.name,
    branchId: cls.branchId,
    language: cls.language ?? "",
    ageFromYears: from.years,
    ageFromMonths: from.months,
    ageToYears: to.years,
    ageToMonths: to.months,
    cameraNumber: cls.cameraNumber?.toString() ?? "",
    maxStudents: cls.maxStudents.toString(),
    imageUrl: cls.imageUrl ?? "",
    isActive: cls.isActive,
  };
}

// ── Form Component ─────────────────────────────────────────────────────────

function ClassForm({
  form,
  setForm,
  branches,
  hideBranch,
}: {
  form: ClassFormState;
  setForm: React.Dispatch<React.SetStateAction<ClassFormState>>;
  branches: BranchOption[];
  hideBranch?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setForm((f) => ({ ...f, imageUrl: url }));
  }

  return (
    <div className="grid gap-4">
      {/* Class Image — drag-drop upload */}
      <div className="space-y-2">
        <Label>Class Image</Label>
        <div
          className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleImageFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          {form.imageUrl ? (
            <div className="relative">
              <img
                src={form.imageUrl}
                alt="Class"
                className="size-24 rounded-xl object-cover"
              />
              <button
                type="button"
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-white text-xs hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  setForm((f) => ({ ...f, imageUrl: "" }));
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <ImageIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Drop an image or click to browse
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
          />
        </div>
      </div>

      {!hideBranch && (
        <div className="space-y-2">
          <Label>Branch *</Label>
          <Select
            value={form.branchId}
            onValueChange={(v) => setForm((f) => ({ ...f, branchId: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Class Name *</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Butterfly Room"
        />
      </div>

      <div className="space-y-2">
        <Label>Class Language</Label>
        <Select
          value={form.language}
          onValueChange={(v) => setForm((f) => ({ ...f, language: v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="French">French</SelectItem>
            <SelectItem value="Arabic">Arabic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Age From — Years + Months */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Age From</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                value={form.ageFromYears}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ageFromYears: e.target.value }))
                }
                placeholder="0"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Years
              </span>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                max={11}
                value={form.ageFromMonths}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ageFromMonths: e.target.value }))
                }
                placeholder="0"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Months
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Age To</Label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                value={form.ageToYears}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ageToYears: e.target.value }))
                }
                placeholder="0"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Years
              </span>
            </div>
            <div className="flex-1">
              <Input
                type="number"
                min={0}
                max={11}
                value={form.ageToMonths}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ageToMonths: e.target.value }))
                }
                placeholder="0"
              />
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Months
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Camera Number</Label>
          <Input
            type="number"
            min={0}
            value={form.cameraNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, cameraNumber: e.target.value }))
            }
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Students</Label>
          <Input
            type="number"
            min={0}
            value={form.maxStudents}
            onChange={(e) =>
              setForm((f) => ({ ...f, maxStudents: e.target.value }))
            }
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="class-active"
          checked={form.isActive}
          onCheckedChange={(checked) =>
            setForm((f) => ({ ...f, isActive: checked === true }))
          }
        />
        <Label htmlFor="class-active" className="cursor-pointer">
          Active
        </Label>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function ClassesClient({
  classes,
  branches,
  branchId,
}: ClassesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [branchFilter, setBranchFilter] = useState("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);

  const [form, setForm] = useState<ClassFormState>(() => emptyForm(branchId));

  const filteredClasses = useMemo(() => {
    if (branchId) return classes.filter((c) => c.branchId === branchId);
    if (branchFilter === "ALL") return classes;
    return classes.filter((c) => c.branchId === branchFilter);
  }, [branchFilter, branchId, classes]);

  const totalClasses = filteredClasses.length;
  const totalStudents = filteredClasses.reduce(
    (sum, c) => sum + c.studentCount,
    0,
  );
  const totalCapacity = filteredClasses.reduce(
    (sum, c) => sum + c.maxStudents,
    0,
  );

  // ── Handlers ──

  function openAdd() {
    setForm(emptyForm(branchId));
    setAddOpen(true);
  }

  function openEdit(cls: ClassItem) {
    setForm(classToForm(cls));
    setEditTarget(cls);
  }

  function handleAdd() {
    if (!form.name.trim() || !form.branchId) {
      toast.error("Class name and branch are required");
      return;
    }
    startTransition(async () => {
      const ageFrom = formAgeToStorage(form.ageFromYears, form.ageFromMonths);
      const ageTo = formAgeToStorage(form.ageToYears, form.ageToMonths);
      const result = await createClass({
        name: form.name.trim(),
        branchId: form.branchId,
        language: form.language || null,
        ageFrom: ageFrom.value,
        ageTo: ageTo.value,
        ageFromUnit: ageFrom.unit,
        ageToUnit: ageTo.unit,
        cameraNumber: form.cameraNumber ? parseInt(form.cameraNumber) : null,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : 0,
        imageUrl: form.imageUrl || null,
        isActive: form.isActive,
      });
      if (result.success) {
        toast.success(`"${form.name}" created`);
        setAddOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to create class");
      }
    });
  }

  function handleEdit() {
    if (!editTarget) return;
    if (!form.name.trim()) {
      toast.error("Class name is required");
      return;
    }
    startTransition(async () => {
      const ageFrom = formAgeToStorage(form.ageFromYears, form.ageFromMonths);
      const ageTo = formAgeToStorage(form.ageToYears, form.ageToMonths);
      const result = await updateClass(editTarget.id, {
        name: form.name.trim(),
        branchId: form.branchId,
        language: form.language || null,
        ageFrom: ageFrom.value,
        ageTo: ageTo.value,
        ageFromUnit: ageFrom.unit,
        ageToUnit: ageTo.unit,
        cameraNumber: form.cameraNumber ? parseInt(form.cameraNumber) : null,
        maxStudents: form.maxStudents ? parseInt(form.maxStudents) : 0,
        imageUrl: form.imageUrl || null,
        isActive: form.isActive,
      });
      if (result.success) {
        toast.success(`"${form.name}" updated`);
        setEditTarget(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update class");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteClass(deleteTarget.id);
      if (result.success) {
        toast.success(`"${deleteTarget.name}" deleted`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to delete class");
      }
      setDeleteTarget(null);
    });
  }

  // ── Render ──

  return (
    <>
      {!branchId && (
        <PageHeader
          title="Classes Management"
          breadcrumbs={[
            { label: "Home", href: "/dashboard" },
            { label: "Classes Management" },
          ]}
        />
      )}

      <div className="space-y-6 p-4 md:p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="rounded-2xl py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#A0784C]/10">
                <GraduationCap className="size-5 text-[#A0784C]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Classes</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalClasses}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#C17C5A]/10">
                <Users className="size-5 text-[#C17C5A]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalStudents}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl py-4 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[#6B8F71]/10">
                <Users className="size-5 text-[#6B8F71]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Capacity</p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalCapacity}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {!branchId && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[200px]">
                <SelectValue placeholder="All Branches" />
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
          )}
          <div className="flex-1" />
          <Button onClick={openAdd}>
            <Plus className="mr-1 size-4" />
            Add Class
          </Button>
        </div>

        {/* Card Grid */}
        {filteredClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-16">
            <GraduationCap className="size-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No classes found
            </p>
            <Button variant="outline" className="mt-4" onClick={openAdd}>
              <Plus className="mr-1 size-4" />
              Add your first class
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredClasses.map((cls) => {
              const color = getAvatarColor(cls.name);
              const ageFrom = formatAge(cls.ageFrom, cls.ageFromUnit);
              const ageTo = formatAge(cls.ageTo, cls.ageToUnit);
              const ageRange =
                ageFrom && ageTo
                  ? `${ageFrom} – ${ageTo}`
                  : ageFrom ?? ageTo ?? null;

              return (
                <Card
                  key={cls.id}
                  className="relative overflow-hidden rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <CardHeader className="flex-row items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl text-lg font-bold ${color.bg} ${color.text}`}
                    >
                      {cls.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">
                        {cls.name}
                      </CardTitle>
                      {!branchId && (
                        <p className="text-xs text-muted-foreground truncate">
                          {cls.branchName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        className={
                          cls.isActive
                            ? "bg-[#6B8F71]/15 text-[#567352] border-[#6B8F71]/25"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {cls.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(cls)}>
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setDeleteTarget(cls)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {cls.language && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="size-4 shrink-0" />
                        {cls.language}
                      </div>
                    )}
                    {ageRange && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="size-4 shrink-0" />
                        Age: {ageRange}
                      </div>
                    )}
                    {cls.cameraNumber !== null && cls.cameraNumber > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Camera className="size-4 shrink-0" />
                        Camera #{cls.cameraNumber}
                      </div>
                    )}

                    {/* Stats footer */}
                    <div className="border-t pt-3 mt-1">
                      <div className="flex items-center justify-between">
                        <div className="text-center flex-1">
                          <p className="text-lg font-semibold text-foreground">
                            {cls.studentCount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Students
                          </p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center flex-1">
                          <p className="text-lg font-semibold text-foreground">
                            {cls.maxStudents}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Max Capacity
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Add Class Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
            <DialogDescription>
              Create a new class for your daycare.
            </DialogDescription>
          </DialogHeader>
          <ClassForm
            form={form}
            setForm={setForm}
            branches={branches}
            hideBranch={!!branchId}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isPending}>
              {isPending ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Class Dialog ── */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update the details for this class.
            </DialogDescription>
          </DialogHeader>
          <ClassForm
            form={form}
            setForm={setForm}
            branches={branches}
            hideBranch={!!branchId}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
