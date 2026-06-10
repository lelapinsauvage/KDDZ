"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Filter,
  GraduationCap,
  Globe,
  ImageIcon,
  LayoutGrid,
  Pencil,
  Plus,
  Printer,
  Search,
  TableIcon,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/shared/export-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createClass, deleteClass, updateClass } from "@/lib/actions/classes";
import type { LegacyClassActionPermissions } from "@/lib/legacy-class-action-permissions";
import { uploadFileWithPresign } from "@/lib/uploads/client-upload";
import type { ExportColumn } from "@/lib/export";
import { toast } from "sonner";

export interface ClassItem {
  id: string;
  legacyId: number | null;
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
  createdAt: string;
}

export interface BranchOption {
  id: string;
  name: string;
}

interface ClassesClientProps {
  classes: ClassItem[];
  branches: BranchOption[];
  branchId?: string;
  branchName?: string;
  showBranchColumn?: boolean;
  initialSearchQuery?: string;
  initialLegacyFilters?: Partial<LegacyFilters>;
  initialEditClassId?: string;
  initialAddOpen?: boolean;
  actionPermissions?: LegacyClassActionPermissions;
}

interface ClassFormState {
  name: string;
  branchId: string;
  language: string;
  ageFrom: string;
  ageFromUnit: "YEARS" | "MONTHS";
  ageTo: string;
  ageToUnit: "YEARS" | "MONTHS";
  cameraNumber: string;
  maxStudents: string;
  imageUrl: string;
  isActive: boolean;
}

interface LegacyFilters {
  classNumber: string;
  name: string;
  language: string;
  maxStudents: string;
  createdFrom: string;
  createdTo: string;
}

const classExportColumns: ExportColumn[] = [
  { header: "S.N.", key: "legacyId" },
  { header: "Class", key: "name" },
  { header: "Language", key: "language" },
  { header: "Max Students", key: "maxStudents" },
  { header: "Branch", key: "branchName" },
  {
    header: "Date",
    key: "createdAt",
    transform: (value) => formatDate(value as string | null),
  },
];

const PAGE_SIZES = ["10", "20", "50", "100", "150", "ALL"] as const;
const DEFAULT_CLASS_PHOTO = "/images/ClassPhoto/default.jpg";

function emptyForm(branchId?: string): ClassFormState {
  return {
    name: "",
    branchId: branchId ?? "",
    language: "",
    ageFrom: "",
    ageFromUnit: "YEARS",
    ageTo: "",
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
    ageFromUnit: cls.ageFromUnit ?? "YEARS",
    ageTo: cls.ageTo?.toString() ?? "",
    ageToUnit: cls.ageToUnit ?? "YEARS",
    cameraNumber: cls.cameraNumber?.toString() ?? "",
    maxStudents: cls.maxStudents.toString(),
    imageUrl: cls.imageUrl ?? "",
    isActive: cls.isActive,
  };
}

function classPhotoSrc(imageUrl: string | null) {
  if (!imageUrl || imageUrl === "default.jpg") return DEFAULT_CLASS_PHOTO;
  if (/^https?:\/\//i.test(imageUrl) || imageUrl.startsWith("/")) return imageUrl;
  if (imageUrl.includes("/")) return `/${imageUrl.replace(/^\/+/, "")}`;
  return `/images/ClassPhoto/${imageUrl}`;
}

function formatDate(date: string | null) {
  if (!date) return "-";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dateValue(date: string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addOneDay(date: string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d.getTime();
}

function formatAge(value: number | null, unit: "YEARS" | "MONTHS" | null) {
  if (value == null) return null;
  const label = unit === "MONTHS" ? "month" : "year";
  return `${value} ${label}${value === 1 ? "" : "s"}`;
}

function statusClass(isActive: boolean) {
  return isActive
    ? "bg-[#008200] text-white border-transparent"
    : "bg-[#d64635] text-white border-transparent";
}

function ClassThumbnail({ cls, size = "table" }: { cls: ClassItem; size?: "table" | "card" }) {
  const [src, setSrc] = useState(classPhotoSrc(cls.imageUrl));
  const [previewOpen, setPreviewOpen] = useState(false);
  const dimension = size === "card" ? "size-14" : "size-16";

  return (
    <>
      <button
        type="button"
        className={`${dimension} overflow-hidden rounded-sm border bg-muted p-0 transition-opacity hover:opacity-85`}
        onClick={() => setPreviewOpen(true)}
        aria-label={`Preview ${cls.name} image`}
      >
        <Image
          src={src}
          alt={cls.name}
          width={size === "card" ? 56 : 64}
          height={size === "card" ? 56 : 64}
          className="h-full w-full object-cover"
          unoptimized
          onError={() => {
            if (src !== DEFAULT_CLASS_PHOTO) setSrc(DEFAULT_CLASS_PHOTO);
          }}
        />
      </button>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cls.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <Image
              src={src}
              alt={cls.name}
              width={520}
              height={390}
              className="max-h-[70vh] w-auto rounded-sm object-contain"
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClassForm({
  form,
  setForm,
  branches,
  hideBranch,
  imagePreviewUrl,
  imageFile,
  onImageFileChange,
  onClearImage,
}: {
  form: ClassFormState;
  setForm: Dispatch<SetStateAction<ClassFormState>>;
  branches: BranchOption[];
  hideBranch?: boolean;
  imagePreviewUrl: string | null;
  imageFile: File | null;
  onImageFileChange: (file: File) => void;
  onClearImage: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const displayImageUrl = imagePreviewUrl || (form.imageUrl ? classPhotoSrc(form.imageUrl) : null);

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    onImageFileChange(file);
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-2">
        <Label>Class Image</Label>
        <div
          className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed p-5 transition-colors ${
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files[0];
            if (file) handleImageFile(file);
          }}
        >
          {displayImageUrl ? (
            <div className="relative">
              <Image
                src={displayImageUrl}
                alt="Class"
                width={96}
                height={96}
                className="size-24 rounded-sm object-cover"
                unoptimized
              />
              <button
                type="button"
                className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600"
                onClick={(event) => {
                  event.stopPropagation();
                  onClearImage();
                }}
              >
                x
              </button>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-sm bg-muted">
                <ImageIcon className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Drop an image or click to browse</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImageFile(file);
              event.target.value = "";
            }}
          />
        </div>
        {imageFile && <p className="truncate text-xs text-muted-foreground">Selected: {imageFile.name}</p>}
      </div>

      {!hideBranch && (
        <div className="space-y-2">
          <Label>Branch *</Label>
          <Select value={form.branchId} onValueChange={(value) => setForm((current) => ({ ...current, branchId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Class Name *</Label>
          <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>Class Language *</Label>
          <Select value={form.language} onValueChange={(value) => setForm((current) => ({ ...current, language: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Arabic">Arabic</SelectItem>
              <SelectItem value="French">French</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Age From *</Label>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <Input
              type="number"
              min={0}
              value={form.ageFrom}
              onChange={(event) => setForm((current) => ({ ...current, ageFrom: event.target.value }))}
            />
            <Select
              value={form.ageFromUnit}
              onValueChange={(value) => setForm((current) => ({ ...current, ageFromUnit: value as "YEARS" | "MONTHS" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YEARS">Years</SelectItem>
                <SelectItem value="MONTHS">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Age To *</Label>
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <Input
              type="number"
              min={0}
              value={form.ageTo}
              onChange={(event) => setForm((current) => ({ ...current, ageTo: event.target.value }))}
            />
            <Select
              value={form.ageToUnit}
              onValueChange={(value) => setForm((current) => ({ ...current, ageToUnit: value as "YEARS" | "MONTHS" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YEARS">Years</SelectItem>
                <SelectItem value="MONTHS">Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Camera Number *</Label>
          <Input
            type="number"
            min={0}
            value={form.cameraNumber}
            onChange={(event) => setForm((current) => ({ ...current, cameraNumber: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Max Number Of Students *</Label>
          <Input
            type="number"
            min={1}
            value={form.maxStudents}
            onChange={(event) => setForm((current) => ({ ...current, maxStudents: event.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="class-active"
          checked={form.isActive}
          onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked === true }))}
        />
        <Label htmlFor="class-active" className="cursor-pointer">
          Active
        </Label>
      </div>
    </div>
  );
}

export function ClassesClient({
  classes,
  branches,
  branchId,
  branchName,
  showBranchColumn,
  initialSearchQuery = "",
  initialLegacyFilters,
  initialEditClassId,
  initialAddOpen = false,
  actionPermissions = {
    canAddClass: true,
    canUpdateClass: true,
    canDeleteClass: true,
  },
}: ClassesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { canAddClass, canUpdateClass, canDeleteClass } = actionPermissions;
  const initialEditTarget =
    canUpdateClass && initialEditClassId
      ? classes.find((cls) => cls.id === initialEditClassId) ?? null
      : null;

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [branchFilter, setBranchFilter] = useState(branchId ?? "ALL");
  const [statusFilter, setStatusFilter] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>("10");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [legacyFilters, setLegacyFilters] = useState<LegacyFilters>({
    classNumber: initialLegacyFilters?.classNumber ?? "",
    name: initialLegacyFilters?.name ?? "",
    language: initialLegacyFilters?.language ?? "",
    maxStudents: initialLegacyFilters?.maxStudents ?? "",
    createdFrom: initialLegacyFilters?.createdFrom ?? "",
    createdTo: initialLegacyFilters?.createdTo ?? "",
  });
  const branchColumnVisible = showBranchColumn ?? !branchId;
  const branchLabel =
    branchName ?? branches.find((branch) => branch.id === branchId)?.name ?? "Selected Branch";
  const tableColSpan = branchColumnVisible ? 9 : 8;

  const [addOpen, setAddOpen] = useState(
    initialAddOpen && !initialEditTarget && canAddClass,
  );
  const [editTarget, setEditTarget] = useState<ClassItem | null>(initialEditTarget);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);

  const [form, setForm] = useState<ClassFormState>(() =>
    initialEditTarget ? classToForm(initialEditTarget) : emptyForm(branchId)
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  function updateFilter<T>(setter: Dispatch<SetStateAction<T>>, value: T) {
    setter(value);
    setPage(1);
  }

  const filteredClasses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const from = legacyFilters.createdFrom ? dateValue(legacyFilters.createdFrom) : null;
    const to = legacyFilters.createdTo ? addOneDay(legacyFilters.createdTo) : null;

    return classes.filter((cls) => {
      if (branchId && cls.branchId !== branchId) return false;
      if (!branchId && branchFilter !== "ALL" && cls.branchId !== branchFilter) return false;
      if (statusFilter === "ACTIVE" && !cls.isActive) return false;
      if (statusFilter === "INACTIVE" && cls.isActive) return false;

      if (query) {
        const haystack = [cls.legacyId, cls.name, cls.language, cls.branchName, cls.maxStudents]
          .filter((item) => item != null)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (legacyFilters.classNumber) {
        const value = String(cls.legacyId ?? "");
        if (!value.includes(legacyFilters.classNumber.trim())) return false;
      }
      if (legacyFilters.name && !cls.name.toLowerCase().includes(legacyFilters.name.toLowerCase())) return false;
      if (legacyFilters.language && !(cls.language ?? "").toLowerCase().includes(legacyFilters.language.toLowerCase())) return false;
      if (legacyFilters.maxStudents && !String(cls.maxStudents).includes(legacyFilters.maxStudents.trim())) return false;

      const created = new Date(cls.createdAt).getTime();
      if (from !== null && created < from) return false;
      if (to !== null && created >= to) return false;

      return true;
    });
  }, [branchFilter, branchId, classes, legacyFilters, searchQuery, statusFilter]);

  const effectivePageSize = pageSize === "ALL" ? Math.max(filteredClasses.length, 1) : Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredClasses.length / effectivePageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedClasses =
    pageSize === "ALL"
      ? filteredClasses
      : filteredClasses.slice((currentPage - 1) * effectivePageSize, currentPage * effectivePageSize);

  const totalClasses = filteredClasses.length;
  const totalStudents = filteredClasses.reduce((sum, cls) => sum + cls.studentCount, 0);
  const totalCapacity = filteredClasses.reduce((sum, cls) => sum + cls.maxStudents, 0);
  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; value: string }[] = [];
    if (searchQuery) pills.push({ key: "search", label: "Search", value: searchQuery });
    if (!branchId && branchFilter !== "ALL") {
      const branch = branches.find((item) => item.id === branchFilter);
      pills.push({ key: "branch", label: "Branch", value: branch?.name ?? branchFilter });
    }
    if (statusFilter !== "ACTIVE") pills.push({ key: "status", label: "Status", value: statusFilter === "ALL" ? "All" : "Inactive" });
    if (legacyFilters.classNumber) pills.push({ key: "classNumber", label: "S.N.", value: legacyFilters.classNumber });
    if (legacyFilters.name) pills.push({ key: "name", label: "Class", value: legacyFilters.name });
    if (legacyFilters.language) pills.push({ key: "language", label: "Language", value: legacyFilters.language });
    if (legacyFilters.maxStudents) pills.push({ key: "maxStudents", label: "Max Students", value: legacyFilters.maxStudents });
    if (legacyFilters.createdFrom) pills.push({ key: "createdFrom", label: "Created from", value: legacyFilters.createdFrom });
    if (legacyFilters.createdTo) pills.push({ key: "createdTo", label: "Created to", value: legacyFilters.createdTo });
    return pills;
  }, [branchFilter, branchId, branches, legacyFilters, searchQuery, statusFilter]);

  const clearImageSelection = useCallback(() => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
  }, [imagePreviewUrl]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleImageFileChange(file: File) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleClearImage() {
    clearImageSelection();
    setForm((current) => ({ ...current, imageUrl: "" }));
  }

  function openAdd() {
    if (!canAddClass) return;
    clearImageSelection();
    setForm(emptyForm(branchId));
    setAddOpen(true);
  }

  const openEdit = useCallback((cls: ClassItem) => {
    if (!canUpdateClass) return;
    clearImageSelection();
    setForm(classToForm(cls));
    setEditTarget(cls);
  }, [canUpdateClass, clearImageSelection]);

  function validateFormState() {
    if (!form.branchId) return "Branch is required";
    if (!form.name.trim()) return "Class name is required";
    if (!form.language.trim()) return "Class language is required";
    if (form.ageFrom === "") return "Age from is required";
    if (form.ageTo === "") return "Age to is required";
    if (form.cameraNumber === "") return "Camera number is required";
    if (!form.maxStudents || Number(form.maxStudents) <= 0) return "Max students must be greater than zero";
    return null;
  }

  async function resolveImageUrlForSave(ownerId?: string) {
    if (!imageFile) return form.imageUrl || null;
    if (!form.branchId) {
      toast.error("Select a branch before uploading the class image");
      return undefined;
    }

    try {
      const uploaded = await uploadFileWithPresign({
        branchId: form.branchId,
        scope: "class",
        ownerId,
        file: imageFile,
      });
      return uploaded.publicUrl;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload class image");
      return undefined;
    }
  }

  function savePayload(imageUrl: string | null) {
    return {
      name: form.name.trim(),
      branchId: form.branchId,
      language: form.language.trim(),
      ageFrom: Number(form.ageFrom),
      ageTo: Number(form.ageTo),
      ageFromUnit: form.ageFromUnit,
      ageToUnit: form.ageToUnit,
      cameraNumber: Number(form.cameraNumber),
      maxStudents: Number(form.maxStudents),
      imageUrl,
      isActive: form.isActive,
    };
  }

  function handleAdd() {
    if (!canAddClass) {
      toast.error("Access denied");
      return;
    }

    const validationError = validateFormState();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    startTransition(async () => {
      const imageUrl = await resolveImageUrlForSave();
      if (imageUrl === undefined) return;
      const result = await createClass(savePayload(imageUrl));
      if (result.success) {
        toast.success(`"${form.name}" created`);
        setAddOpen(false);
        clearImageSelection();
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to create class");
      }
    });
  }

  function handleEdit() {
    if (!editTarget) return;
    if (!canUpdateClass) {
      toast.error("Access denied");
      return;
    }

    const validationError = validateFormState();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    startTransition(async () => {
      const imageUrl = await resolveImageUrlForSave(editTarget.id);
      if (imageUrl === undefined) return;
      const result = await updateClass(editTarget.id, savePayload(imageUrl));
      if (result.success) {
        toast.success(`"${form.name}" updated`);
        setEditTarget(null);
        clearImageSelection();
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update class");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    if (!canDeleteClass) {
      toast.error("Access denied");
      return;
    }

    startTransition(async () => {
      const result = await deleteClass(deleteTarget.id);
      if (result.success) {
        toast.success(`"${deleteTarget.name}" deactivated`);
        setSelectedIds((current) => {
          const next = new Set(current);
          next.delete(deleteTarget.id);
          return next;
        });
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to deactivate class");
      }
      setDeleteTarget(null);
    });
  }

  function clearFilter(key: string) {
    if (key === "search") setSearchQuery("");
    if (key === "branch" && !branchId) setBranchFilter("ALL");
    if (key === "status") setStatusFilter("ACTIVE");
    if (key in legacyFilters) {
      setLegacyFilters((current) => ({ ...current, [key]: "" }));
    }
    setPage(1);
  }

  function clearAllFilters() {
    setSearchQuery("");
    setBranchFilter(branchId ?? "ALL");
    setStatusFilter("ACTIVE");
    setLegacyFilters({
      classNumber: "",
      name: "",
      language: "",
      maxStudents: "",
      createdFrom: "",
      createdTo: "",
    });
    setPage(1);
  }

  function toggleSelectAllInPage(checked: boolean) {
    const pageIds = paginatedClasses.map((cls) => cls.id);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        pageIds.forEach((id) => next.add(id));
      } else {
        pageIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const pageIds = paginatedClasses.map((cls) => cls.id);
  const allPageRowsSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageRowsSelected = pageIds.some((id) => selectedIds.has(id));

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

      <div className="hidden print:block print:mb-4 print:text-center">
        <h1 className="text-2xl font-bold text-black">
          {branchId ? `Classes Management For Branch: ${branchLabel}` : "Classes Listing"}
        </h1>
        <p className="text-sm text-gray-500">
          {filteredClasses.length} classes - Printed on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="space-y-6 p-4 md:p-6 print:p-0">
        {branchId && (
          <div className="print:hidden">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Classes Management For Branch: {branchLabel}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {branchLabel} Branch Classes Listing
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 print:hidden sm:grid-cols-3">
          <div className="overflow-hidden rounded bg-[#327ad5] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{totalClasses}</p>
                <p className="text-xs text-white/80">Total Classes</p>
              </div>
              <GraduationCap className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="overflow-hidden rounded bg-[#1caf9a] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{totalStudents}</p>
                <p className="text-xs text-white/80">Total Students</p>
              </div>
              <Users className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
          <div className="overflow-hidden rounded bg-[#008200] shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{totalCapacity}</p>
                <p className="text-xs text-white/80">Total Capacity</p>
              </div>
              <Users className="size-14 text-white/20" strokeWidth={1.2} />
            </div>
          </div>
        </div>

        <Card className="print:border-none print:shadow-none">
          <CardHeader className="print:hidden">
            <CardTitle className="text-lg">
              {branchId ? `${branchLabel} Branch Classes Listing` : "Classes Listing"}
            </CardTitle>
            {canAddClass ? (
              <CardAction>
                <Button onClick={openAdd}>
                  <Plus className="mr-1 size-4" />
                  New Class
                </Button>
              </CardAction>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 print:p-0 print:space-y-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search classes..."
                  value={searchQuery}
                  onChange={(event) => updateFilter(setSearchQuery, event.target.value)}
                  className="pl-9 pr-8"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => updateFilter<string>(setSearchQuery, "")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {!branchId && (
                <Select value={branchFilter} onValueChange={(value) => updateFilter(setBranchFilter, value)}>
                  <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[200px]">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Branches</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={(value) => updateFilter(setStatusFilter, value as "ACTIVE" | "INACTIVE" | "ALL")}>
                <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex-1" />

              <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("table")}
                  className="h-7 w-7"
                >
                  <TableIcon className="size-3.5" />
                </Button>
                <Button
                  variant={viewMode === "cards" ? "secondary" : "ghost"}
                  size="icon-sm"
                  onClick={() => setViewMode("cards")}
                  className="h-7 w-7"
                >
                  <LayoutGrid className="size-3.5" />
                </Button>
              </div>

              <ExportButton
                filename={branchId ? `classes_${branchLabel}` : "classes"}
                sheetName="Classes"
                columns={classExportColumns}
                data={filteredClasses as unknown as Record<string, unknown>[]}
              />

              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-1 size-4" />
                Print
              </Button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
              }}
              className={
                branchId
                  ? "grid gap-2 rounded border border-border/60 bg-muted/20 p-3 print:hidden sm:grid-cols-2 lg:grid-cols-[0.75fr_1.2fr_1fr_1fr_1fr_1fr_1fr_auto_auto]"
                  : "grid gap-2 rounded border border-border/60 bg-muted/20 p-3 print:hidden sm:grid-cols-2 lg:grid-cols-[0.75fr_1.2fr_1fr_1fr_1fr_1fr_auto_auto]"
              }
            >
              <Input
                value={legacyFilters.classNumber}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, classNumber: event.target.value }))}
                placeholder="S.N."
                className="h-9"
              />
              <Input
                value={legacyFilters.name}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, name: event.target.value }))}
                placeholder="Class"
                className="h-9"
              />
              <Input
                value={legacyFilters.language}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, language: event.target.value }))}
                placeholder="Language"
                className="h-9"
              />
              <Input
                value={legacyFilters.maxStudents}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, maxStudents: event.target.value }))}
                placeholder="Max Students"
                className="h-9"
              />
              {branchId && (
                <Input
                  value={branchLabel}
                  readOnly
                  aria-label="Branch"
                  className="h-9 bg-muted/60"
                />
              )}
              <Input
                type="date"
                value={legacyFilters.createdFrom}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, createdFrom: event.target.value }))}
                aria-label="Created from"
                className="h-9"
              />
              <Input
                type="date"
                value={legacyFilters.createdTo}
                onChange={(event) => setLegacyFilters((current) => ({ ...current, createdTo: event.target.value }))}
                aria-label="Created to"
                className="h-9"
              />
              <Button type="submit" variant="outline" size="sm" disabled={isPending}>
                <Filter className="size-4" />
                Apply
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={clearAllFilters} disabled={isPending}>
                <X className="size-4" />
                Clear
              </Button>
            </form>

            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 print:hidden">
                <span className="mr-1 text-xs font-medium text-muted-foreground">Filters:</span>
                {activeFilters.map((filter) => (
                  <Badge
                    key={filter.key}
                    variant="secondary"
                    className="gap-1 border-primary/20 bg-primary/10 py-0.5 pl-2 pr-1 text-xs text-primary hover:bg-primary/15"
                  >
                    <span className="font-medium">{filter.label}:</span> {filter.value}
                    <button type="button" onClick={() => clearFilter(filter.key)} className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-primary/20">
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
                <button type="button" onClick={clearAllFilters} className="ml-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  Clear all
                </button>
              </div>
            )}

            {viewMode === "cards" ? (
              paginatedClasses.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-sm border border-dashed py-16">
                  <GraduationCap className="size-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No classes found</p>
                  {canAddClass ? (
                    <Button variant="outline" className="mt-4" onClick={openAdd}>
                      <Plus className="mr-1 size-4" />
                      New Class
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedClasses.map((cls) => {
                    const ageFrom = formatAge(cls.ageFrom, cls.ageFromUnit);
                    const ageTo = formatAge(cls.ageTo, cls.ageToUnit);
                    const ageRange = ageFrom && ageTo ? `${ageFrom} - ${ageTo}` : ageFrom ?? ageTo ?? null;

                    return (
                      <Card key={cls.id} className="rounded-sm transition-all hover:shadow-md">
                        <CardContent className="flex gap-3 py-4">
                          <ClassThumbnail cls={cls} size="card" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{cls.name}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {branchColumnVisible ? cls.branchName : cls.language ?? "No language"}
                                </p>
                              </div>
                              <Badge className={`text-[10px] ${statusClass(cls.isActive)}`}>{cls.isActive ? "Active" : "Inactive"}</Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                              {cls.language && <span className="inline-flex items-center gap-1"><Globe className="size-3" />{cls.language}</span>}
                              {ageRange && <span className="inline-flex items-center gap-1"><Users className="size-3" />{ageRange}</span>}
                              {cls.cameraNumber != null && <span className="inline-flex items-center gap-1"><Camera className="size-3" />Camera #{cls.cameraNumber}</span>}
                            </div>
                            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
                              <span><strong>{cls.studentCount}</strong> / {cls.maxStudents} students</span>
                              <div className="flex items-center gap-1">
                                <Button asChild variant="ghost" size="icon-sm">
                                  <Link href={`/classes/${cls.id}`}>
                                    <Eye className="size-4" />
                                  </Link>
                                </Button>
                                {canUpdateClass ? (
                                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cls)}>
                                    <Pencil className="size-4" />
                                  </Button>
                                ) : null}
                                {canDeleteClass ? (
                                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(cls)}>
                                    <Trash2 className="size-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm print:rounded-none print:border-gray-300 print:shadow-none">
                <div className="overflow-x-auto print:overflow-visible">
                  <Table className="min-w-[980px] print:min-w-0 print:w-full print:text-[11px]">
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableHead className="w-[52px] bg-muted/60 px-3 py-3 print:hidden">
                          <Checkbox
                            checked={allPageRowsSelected || (somePageRowsSelected ? "indeterminate" : false)}
                            onCheckedChange={(checked) => toggleSelectAllInPage(checked === true)}
                          />
                        </TableHead>
                        <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">S.N.</TableHead>
                        <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Image</TableHead>
                        <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Class</TableHead>
                        <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Language</TableHead>
                        <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Students</TableHead>
                        {branchColumnVisible && <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Branch</TableHead>}
                        <TableHead className="bg-muted/60 px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                        <TableHead className="bg-muted/60 px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground print:hidden">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isPending ? (
                        <TableRow>
                          <TableCell colSpan={tableColSpan} className="h-24 text-center text-muted-foreground">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : paginatedClasses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={tableColSpan} className="h-32 text-center text-muted-foreground">
                            No classes found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedClasses.map((cls, index) => (
                          <TableRow key={cls.id} className="group border-border/40 transition-colors hover:bg-accent/40">
                            <TableCell className="px-3 py-3 print:hidden">
                              <Checkbox checked={selectedIds.has(cls.id)} onCheckedChange={(checked) => toggleRow(cls.id, checked === true)} />
                            </TableCell>
                            <TableCell className="px-3 py-3 text-sm font-medium">{cls.legacyId ?? (currentPage - 1) * effectivePageSize + index + 1}</TableCell>
                            <TableCell className="px-3 py-3">
                              <ClassThumbnail cls={cls} />
                            </TableCell>
                            <TableCell className="px-3 py-3">
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{cls.name}</p>
                                {!cls.isActive && <Badge className={`text-[10px] ${statusClass(cls.isActive)}`}>Inactive</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-3 text-sm text-muted-foreground">{cls.language || "-"}</TableCell>
                            <TableCell className="px-3 py-3 text-sm text-muted-foreground">{cls.maxStudents}</TableCell>
                            {branchColumnVisible && <TableCell className="px-3 py-3 text-sm text-muted-foreground">{cls.branchName}</TableCell>}
                            <TableCell className="px-3 py-3 text-sm text-muted-foreground">{formatDate(cls.createdAt)}</TableCell>
                            <TableCell className="px-3 py-3 text-right print:hidden">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button asChild variant="ghost" size="icon-sm">
                                  <Link href={`/classes/${cls.id}`}>
                                    <Eye className="size-4 text-muted-foreground" />
                                  </Link>
                                </Button>
                                {canUpdateClass ? (
                                  <Button variant="ghost" size="icon-sm" onClick={() => openEdit(cls)}>
                                    <Pencil className="size-4 text-muted-foreground" />
                                  </Button>
                                ) : null}
                                {canDeleteClass ? (
                                  <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(cls)}>
                                    <Trash2 className="size-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {filteredClasses.length > 0 && (
              <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-card/50 px-4 py-3 print:hidden sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{Math.min((currentPage - 1) * effectivePageSize + 1, filteredClasses.length)}</span>
                  {" "}-{" "}
                  <span className="font-medium text-foreground">{Math.min(currentPage * effectivePageSize, filteredClasses.length)}</span>
                  {" "}of <span className="font-medium text-foreground">{filteredClasses.length}</span> classes
                  {selectedIds.size > 0 && <span className="ml-2">({selectedIds.size} selected)</span>}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rows:</span>
                  <Select
                    value={pageSize}
                    onValueChange={(value) => {
                      const nextSize = value as (typeof PAGE_SIZES)[number];
                      setPageSize(nextSize);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[82px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {PAGE_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size === "ALL" ? "All" : size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(1)} disabled={currentPage <= 1}>
                      <ChevronsLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="min-w-[5rem] text-center text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{currentPage}</span> / {pageCount}
                    </span>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount}>
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-9 border-border/60 sm:size-8" onClick={() => setPage(pageCount)} disabled={currentPage >= pageCount}>
                      <ChevronsRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Class</DialogTitle>
            <DialogDescription>Create a class using the legacy required fields.</DialogDescription>
          </DialogHeader>
          <ClassForm
            form={form}
            setForm={setForm}
            branches={branches}
            hideBranch={!!branchId}
            imagePreviewUrl={imagePreviewUrl}
            imageFile={imageFile}
            onImageFileChange={handleImageFileChange}
            onClearImage={handleClearImage}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Class</DialogTitle>
            <DialogDescription>Update branch, class info, age limits, camera, capacity, and image.</DialogDescription>
          </DialogHeader>
          <ClassForm
            form={form}
            setForm={setForm}
            branches={branches}
            hideBranch={!!branchId}
            imagePreviewUrl={imagePreviewUrl}
            imageFile={imageFile}
            onImageFileChange={handleImageFileChange}
            onClearImage={handleClearImage}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{deleteTarget?.name}</strong>? The class will be hidden from the active listing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
              {isPending ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
