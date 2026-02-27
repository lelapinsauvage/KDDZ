"use client";

import { useState, useMemo, useTransition } from "react";
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
  { bg: "bg-rose-100", text: "text-rose-600" },
  { bg: "bg-sky-100", text: "text-sky-600" },
  { bg: "bg-amber-100", text: "text-amber-600" },
  { bg: "bg-emerald-100", text: "text-emerald-600" },
  { bg: "bg-violet-100", text: "text-violet-600" },
  { bg: "bg-teal-100", text: "text-teal-600" },
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-indigo-100", text: "text-indigo-600" },
  { bg: "bg-orange-100", text: "text-orange-600" },
  { bg: "bg-cyan-100", text: "text-cyan-600" },
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
  const label = unit === "MONTHS" ? "mo" : "yr";
  return `${value}${label}`;
}

// ── Empty form state ───────────────────────────────────────────────────────

interface ClassFormState {
  name: string;
  branchId: string;
  language: string;
  ageFrom: string;
  ageTo: string;
  ageFromUnit: "YEARS" | "MONTHS";
  ageToUnit: "YEARS" | "MONTHS";
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
    ageFrom: "",
    ageTo: "",
    ageFromUnit: "YEARS",
    ageToUnit: "YEARS",
    cameraNumber: "",
    maxStudents: "",
    imageUrl: "",
    isActive: true,
  };
}

function classToForm(cls: ClassItem): ClassFormState {
  return {
    name: cls.name,
    branchId: cls.branchId,
    language: cls.language ?? "",
    ageFrom: cls.ageFrom?.toString() ?? "",
    ageTo: cls.ageTo?.toString() ?? "",
    ageFromUnit: cls.ageFromUnit ?? "YEARS",
    ageToUnit: cls.ageToUnit ?? "YEARS",
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
  return (
    <div className="grid gap-4">
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
        <Label>Language</Label>
        <Input
          value={form.language}
          onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
          placeholder="e.g. English, French"
        />
      </div>

      {/* Age From / Age To */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Age From</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={form.ageFrom}
              onChange={(e) =>
                setForm((f) => ({ ...f, ageFrom: e.target.value }))
              }
              placeholder="0"
              className="flex-1"
            />
            <div className="flex rounded-md border">
              <button
                type="button"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-l-md transition-colors ${
                  form.ageFromUnit === "YEARS"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() =>
                  setForm((f) => ({ ...f, ageFromUnit: "YEARS" }))
                }
              >
                Yr
              </button>
              <button
                type="button"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-r-md transition-colors ${
                  form.ageFromUnit === "MONTHS"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() =>
                  setForm((f) => ({ ...f, ageFromUnit: "MONTHS" }))
                }
              >
                Mo
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Age To</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              value={form.ageTo}
              onChange={(e) =>
                setForm((f) => ({ ...f, ageTo: e.target.value }))
              }
              placeholder="0"
              className="flex-1"
            />
            <div className="flex rounded-md border">
              <button
                type="button"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-l-md transition-colors ${
                  form.ageToUnit === "YEARS"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() =>
                  setForm((f) => ({ ...f, ageToUnit: "YEARS" }))
                }
              >
                Yr
              </button>
              <button
                type="button"
                className={`px-2.5 py-1.5 text-xs font-medium rounded-r-md transition-colors ${
                  form.ageToUnit === "MONTHS"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() =>
                  setForm((f) => ({ ...f, ageToUnit: "MONTHS" }))
                }
              >
                Mo
              </button>
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

      <div className="space-y-2">
        <Label>Image</Label>
        <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <ImageIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 text-sm text-muted-foreground">
            Image upload coming soon
          </div>
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
      const result = await createClass({
        name: form.name.trim(),
        branchId: form.branchId,
        language: form.language || null,
        ageFrom: form.ageFrom ? parseInt(form.ageFrom) : null,
        ageTo: form.ageTo ? parseInt(form.ageTo) : null,
        ageFromUnit: form.ageFrom ? form.ageFromUnit : null,
        ageToUnit: form.ageTo ? form.ageToUnit : null,
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
      const result = await updateClass(editTarget.id, {
        name: form.name.trim(),
        branchId: form.branchId,
        language: form.language || null,
        ageFrom: form.ageFrom ? parseInt(form.ageFrom) : null,
        ageTo: form.ageTo ? parseInt(form.ageTo) : null,
        ageFromUnit: form.ageFrom ? form.ageFromUnit : null,
        ageToUnit: form.ageTo ? form.ageToUnit : null,
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
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100">
                <GraduationCap className="size-5 text-blue-600" />
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
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100">
                <Users className="size-5 text-amber-600" />
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
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100">
                <Users className="size-5 text-emerald-600" />
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
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
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
