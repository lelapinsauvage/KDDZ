"use client";

import { useState, useMemo, useCallback, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  TableIcon,
  X,
  Sparkles,
  Filter,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getChildrenColumns, getInitials, getAvatarColor, type ChildRow } from "@/components/children/children-columns";
import {
  bulkUpdateChildrenBranchClass,
  deleteChild,
  toggleChildActive,
  updateChildClass,
} from "@/lib/actions/children";
import type { LegacyChildActionPermissions } from "@/lib/legacy-child-action-permissions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

// ── Types ────────────────────────────────────────

function getChildAge(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  let months = now.getMonth() - d.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < d.getDate())) {
    years--;
    months += 12;
  }
  if (now.getDate() < d.getDate()) {
    months--;
    if (months < 0) months += 12;
  }
  if (years > 0) return `${years}y ${months}m`;
  return `${months}m`;
}

interface BranchItem {
  id: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
  branchId: string;
}

interface Filters {
  search: string;
  branch: string;
  class: string;
  gender: string;
  status: string;
  childNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  createdFrom: string;
  createdTo: string;
  page: number;
  pageSize: number;
  sort: string;
  order: "asc" | "desc";
}

interface ChildrenPageClientProps {
  childrenList: ChildRow[];
  total: number;
  branches: BranchItem[];
  classes: ClassItem[];
  filters: Filters;
  actionPermissions?: LegacyChildActionPermissions;
  title?: string;
  printTitle?: string;
  lockedBranchId?: string;
  lockedBranchName?: string;
  addChildHref?: string;
}

const childrenExportColumns: ExportColumn[] = [
  { header: "S.N.", key: "childNumber" },
  { header: "First Name", key: "firstName" },
  { header: "Last Name", key: "lastName" },
  {
    header: "Date of Birth",
    key: "dateOfBirth",
    transform: (v) => {
      if (!v) return "";
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB");
    },
  },
  {
    header: "Branch",
    key: "branch",
    transform: (v) => (v as { name: string } | null)?.name ?? "",
  },
  {
    header: "Class",
    key: "class",
    transform: (v) => (v as { name: string } | null)?.name ?? "",
  },
  { header: "Nationality", key: "nationality" },
  { header: "Gender", key: "gender" },
  {
    header: "Created Date",
    key: "createdAt",
    transform: (v) => {
      if (!v) return "";
      const d = new Date(v as string);
      return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB");
    },
  },
  {
    header: "Status",
    key: "isActive",
    transform: (v, row) => {
      if (row.isDraft) return "Draft";
      return v ? "Active" : "Inactive";
    },
  },
  { header: "Blood Type", key: "bloodType" },
];

const legacyFilterKeys = [
  "childNumber",
  "firstName",
  "lastName",
  "dateOfBirth",
  "nationality",
  "createdFrom",
  "createdTo",
] as const;

export function ChildrenPageClient({
  childrenList,
  total,
  branches,
  classes,
  filters,
  actionPermissions = {
    canAddChild: true,
    canUpdateChild: true,
    canDeleteChild: true,
  },
  title = "Children",
  printTitle = title,
  lockedBranchId,
  lockedBranchName,
  addChildHref = "/children/new",
}: ChildrenPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkBranchId, setBulkBranchId] = useState("");
  const [bulkClassId, setBulkClassId] = useState("");
  const { canAddChild, canUpdateChild, canDeleteChild } = actionPermissions;

  // Debounced search state (local, synced to URL on change)
  const [searchValue, setSearchValue] = useState(filters.search);
  const [legacyFilters, setLegacyFilters] = useState(() => ({
    childNumber: filters.childNumber,
    firstName: filters.firstName,
    lastName: filters.lastName,
    dateOfBirth: filters.dateOfBirth,
    nationality: filters.nationality,
    createdFrom: filters.createdFrom,
    createdTo: filters.createdTo,
  }));
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // ── URL param helpers ──────────────────────────

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (!value || value === "ALL" || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      // Reset to page 1 when filters change (unless page itself is being set)
      if (!("page" in updates)) {
        params.delete("page");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

  // Classes filtered by selected branch (for cascading filter)
  const availableClasses = useMemo(() => {
    if (filters.branch === "ALL") return classes;
    return classes.filter((c) => c.branchId === filters.branch);
  }, [filters.branch, classes]);

  const pageChildIds = useMemo(
    () => childrenList.map((child) => child.id),
    [childrenList]
  );
  const selectedCount = selectedIds.size;
  const allPageRowsSelected =
    pageChildIds.length > 0 && pageChildIds.every((id) => selectedIds.has(id));
  const somePageRowsSelected = pageChildIds.some((id) => selectedIds.has(id));
  const bulkBranchOptions = lockedBranchId
    ? branches.filter((branch) => branch.id === lockedBranchId)
    : branches;
  const bulkClassOptions = bulkBranchId
    ? classes.filter((item) => item.branchId === bulkBranchId)
    : [];

  // ── Active filter pills ────────────────────────
  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; value: string }[] = [];
    if (filters.search) pills.push({ key: "search", label: "Search", value: filters.search });
    if (filters.branch !== "ALL" && !lockedBranchId) {
      const b = branches.find((b) => b.id === filters.branch);
      pills.push({ key: "branch", label: "Branch", value: b?.name ?? filters.branch });
    }
    if (filters.class !== "ALL") {
      const c = classes.find((c) => c.id === filters.class);
      pills.push({ key: "class", label: "Class", value: c?.name ?? filters.class });
    }
    if (filters.gender !== "ALL") {
      pills.push({ key: "gender", label: "Gender", value: filters.gender === "MALE" ? "Boy" : "Girl" });
    }
    if (filters.status !== "ALL") {
      pills.push({ key: "status", label: "Status", value: filters.status.charAt(0) + filters.status.slice(1).toLowerCase() });
    }
    if (filters.childNumber) {
      pills.push({ key: "childNumber", label: "S.N.", value: filters.childNumber });
    }
    if (filters.firstName) {
      pills.push({ key: "firstName", label: "F Name", value: filters.firstName });
    }
    if (filters.lastName) {
      pills.push({ key: "lastName", label: "L Name", value: filters.lastName });
    }
    if (filters.dateOfBirth) {
      pills.push({ key: "dateOfBirth", label: "DOB", value: filters.dateOfBirth });
    }
    if (filters.nationality) {
      pills.push({ key: "nationality", label: "Nationality", value: filters.nationality });
    }
    if (filters.createdFrom) {
      pills.push({ key: "createdFrom", label: "Created from", value: filters.createdFrom });
    }
    if (filters.createdTo) {
      pills.push({ key: "createdTo", label: "Created to", value: filters.createdTo });
    }
    return pills;
  }, [filters, branches, classes, lockedBranchId]);

  const clearFilter = useCallback(
    (key: string) => {
      if (key === "branch" && lockedBranchId) return;
      if (key === "search") {
        setSearchValue("");
      }
      if (legacyFilterKeys.includes(key as (typeof legacyFilterKeys)[number])) {
        setLegacyFilters((current) => ({ ...current, [key]: "" }));
      }
      updateParams({ [key]: "" });
    },
    [lockedBranchId, updateParams]
  );

  const clearAllFilters = useCallback(() => {
    setSearchValue("");
    setLegacyFilters({
      childNumber: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "",
      createdFrom: "",
      createdTo: "",
    });
    updateParams({
      search: "",
      branch: lockedBranchId ? lockedBranchId : "",
      class: "",
      gender: "",
      status: "",
      childNumber: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "",
      createdFrom: "",
      createdTo: "",
    });
  }, [lockedBranchId, updateParams]);

  // ── Handlers ───────────────────────────────────

  // Debounced instant search — triggers on typing
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    // Skip the initial render where searchValue matches filters.search
    if (searchValue === filters.search) return;

    searchDebounceRef.current = setTimeout(() => {
      updateParams({ search: searchValue });
    }, 350);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBranchChange = useCallback(
    (value: string) => {
      if (lockedBranchId) return;
      updateParams({ branch: value, class: "" });
    },
    [lockedBranchId, updateParams]
  );

  const handleClassChange = useCallback(
    (value: string) => {
      updateParams({ class: value });
    },
    [updateParams]
  );

  const handleGenderChange = useCallback(
    (value: string) => {
      updateParams({ gender: value });
    },
    [updateParams]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      updateParams({ status: value });
    },
    [updateParams]
  );

  const handleLegacyFilterChange = useCallback(
    (key: keyof typeof legacyFilters, value: string) => {
      setLegacyFilters((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const applyLegacyFilters = useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();
      updateParams(legacyFilters);
    },
    [legacyFilters, updateParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ page: String(newPage) });
    },
    [updateParams]
  );

  const handlePageSizeChange = useCallback(
    (newSize: string) => {
      updateParams({ pageSize: newSize, page: "" });
    },
    [updateParams]
  );

  const toggleRowSelection = useCallback((id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const togglePageSelection = useCallback(
    (checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        for (const id of pageChildIds) {
          if (checked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
        return next;
      });
    },
    [pageChildIds]
  );

  const openBulkDialog = useCallback(() => {
    if (selectedIds.size === 0) {
      toast.error("No children selected");
      return;
    }

    const firstSelected = childrenList.find((child) => selectedIds.has(child.id));
    const initialBranchId =
      lockedBranchId ??
      (filters.branch !== "ALL" ? filters.branch : firstSelected?.branchId) ??
      branches[0]?.id ??
      "";
    const initialClassId =
      firstSelected?.branchId === initialBranchId
        ? firstSelected.classId ?? ""
        : "";

    setBulkBranchId(initialBranchId);
    setBulkClassId(
      initialClassId && classes.some((item) => item.id === initialClassId)
        ? initialClassId
        : ""
    );
    setBulkDialogOpen(true);
  }, [branches, childrenList, classes, filters.branch, lockedBranchId, selectedIds]);

  const handleBulkBranchChange = useCallback((branchId: string) => {
    setBulkBranchId(branchId);
    setBulkClassId("");
  }, []);

  const handleBulkUpdate = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      toast.error("No children selected");
      return;
    }
    if (!bulkBranchId || !bulkClassId) {
      toast.error("Branch and class are required");
      return;
    }

    startTransition(async () => {
      const result = await bulkUpdateChildrenBranchClass(ids, bulkBranchId, bulkClassId);
      if (result.success) {
        toast.success(
          `${result.updatedCount} ${result.updatedCount === 1 ? "child" : "children"} updated.`
        );
        setSelectedIds(new Set());
        setBulkDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }, [bulkBranchId, bulkClassId, router, selectedIds]);

  // ── Sorting ────────────────────────────────────

  const sorting: SortingState = useMemo(
    () => filters.sort
      ? [{ id: filters.sort, desc: filters.order === "desc" }]
      : [],
    [filters.sort, filters.order]
  );

  const handleSortingChange = useCallback(
    (updaterOrValue: SortingState | ((prev: SortingState) => SortingState)) => {
      const newSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (newSorting.length === 0) {
        updateParams({ sort: "", order: "" });
      } else {
        updateParams({
          sort: newSorting[0].id,
          order: newSorting[0].desc ? "desc" : "asc",
        });
      }
    },
    [sorting, updateParams]
  );

  // ── Delete ─────────────────────────────────────

  const handleDeleteRequest = useCallback((id: string, name: string) => {
    setDeleteTarget({ id, name });
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    const { id, name } = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await deleteChild(id);
      if (result.success) {
        toast.success(`${name} has been deactivated.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }, [deleteTarget, router]);

  const handleToggleActive = useCallback(
    (child: ChildRow) => {
      const nextActive = child.isDraft ? true : !child.isActive;
      startTransition(async () => {
        const result = await toggleChildActive(child.id, nextActive);
        if (result.success) {
          toast.success(
            `${child.firstName} ${child.lastName} marked as ${
              nextActive ? "Active" : "Inactive"
            }.`
          );
          router.refresh();
        } else {
          toast.error(result.error);
        }
      });
    },
    [router]
  );

  const handleChangeClass = useCallback(
    async (child: ChildRow, classId: string) => {
      const result = await updateChildClass(child.id, classId);
      if (result.success) {
        const nextClass = classes.find((item) => item.id === classId);
        toast.success(
          `${child.firstName} ${child.lastName} moved to ${
            nextClass?.name ?? "the selected class"
          }.`
        );
        router.refresh();
        return true;
      }

      toast.error(result.error ?? "Failed to update child class");
      return false;
    },
    [classes, router]
  );

  // ── Table setup ────────────────────────────────

  const selectionColumn = useMemo<ColumnDef<ChildRow>>(
    () => ({
      id: "select",
      header: () => (
        <Checkbox
          checked={allPageRowsSelected || (somePageRowsSelected ? "indeterminate" : false)}
          onCheckedChange={(checked) => togglePageSelection(checked === true)}
          aria-label="Select all children in page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={(checked) => toggleRowSelection(row.original.id, checked === true)}
          aria-label={`Select ${row.original.firstName} ${row.original.lastName}`}
          onClick={(event) => event.stopPropagation()}
        />
      ),
      enableSorting: false,
    }),
    [
      allPageRowsSelected,
      selectedIds,
      somePageRowsSelected,
      togglePageSelection,
      toggleRowSelection,
    ]
  );

  const baseColumns = useMemo(
    () =>
      getChildrenColumns({
        onDelete: handleDeleteRequest,
        onToggleActive: handleToggleActive,
        onChangeClass: handleChangeClass,
        classOptions: classes,
        enableClassReassignment: canUpdateChild,
        canUpdate: canUpdateChild,
        canDelete: canDeleteChild,
      }),
    [
      canDeleteChild,
      canUpdateChild,
      classes,
      handleChangeClass,
      handleDeleteRequest,
      handleToggleActive,
    ]
  );
  const columns = useMemo(
    () => (canUpdateChild ? [selectionColumn, ...baseColumns] : baseColumns),
    [baseColumns, canUpdateChild, selectionColumn]
  );

  const table = useReactTable({
    data: childrenList,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    onSortingChange: handleSortingChange,
    state: { sorting },
    pageCount: Math.ceil(total / filters.pageSize),
  });

  // ── Pagination helpers ─────────────────────────

  const pageCount = Math.ceil(total / filters.pageSize);
  const canPreviousPage = filters.page > 1;
  const canNextPage = filters.page < pageCount;

  return (
    <>
      {/* Print-only header */}
      <div className="hidden print:block print:mb-4 print:text-center">
        <h1 className="text-2xl font-bold text-black">{printTitle}</h1>
        <p className="text-sm text-gray-500">
          {total} children &mdash; Printed on {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <Card className="m-4 md:m-6 print:m-0 print:border-none print:shadow-none">
        <CardHeader className="print:hidden">
          <CardTitle className="text-lg">{title}</CardTitle>
          {canAddChild ? (
            <CardAction>
              <Button asChild>
                <Link href={addChildHref}>
                  <Plus className="mr-1 size-4" />
                  Add Child
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 print:p-0 print:space-y-0">
        {/* ── Toolbar ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
          {/* Search — instant debounced filter */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue("");
                  updateParams({ search: "" });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Branch filter */}
          <Select
            value={lockedBranchId ? lockedBranchId : filters.branch}
            onValueChange={handleBranchChange}
            disabled={!!lockedBranchId}
          >
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[180px]">
              <SelectValue placeholder={lockedBranchName ?? "All Branches"} />
            </SelectTrigger>
            <SelectContent>
              {!lockedBranchId ? <SelectItem value="ALL">All Branches</SelectItem> : null}
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class filter */}
          <Select value={filters.class} onValueChange={handleClassChange}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[170px]">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Classes</SelectItem>
              {availableClasses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Gender filter */}
          <Select value={filters.gender} onValueChange={handleGenderChange}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[140px]">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Genders</SelectItem>
              <SelectItem value="MALE">Boy</SelectItem>
              <SelectItem value="FEMALE">Girl</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[150px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>

          {/* Spacer */}
          <div className="flex-1" />

          {/* View toggle */}
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

          {canUpdateChild ? (
            <Button
              type="button"
              variant="outline"
              onClick={openBulkDialog}
              disabled={isPending}
            >
              <ArrowRightLeft className="size-4" />
              Change Branch & Class
              {selectedCount > 0 ? <span className="ml-1">({selectedCount})</span> : null}
            </Button>
          ) : null}

          {/* Export */}
          <ExportButton
            filename="children"
            sheetName="Children"
            columns={childrenExportColumns}
            data={childrenList as unknown as Record<string, unknown>[]}
          />

        </div>

        <form
          onSubmit={applyLegacyFilters}
          className="grid gap-2 rounded border border-border/60 bg-muted/20 p-3 print:hidden sm:grid-cols-2 lg:grid-cols-[0.75fr_1fr_1fr_1fr_1fr_1fr_1fr_auto_auto]"
        >
          <Input
            value={legacyFilters.childNumber}
            onChange={(event) => handleLegacyFilterChange("childNumber", event.target.value)}
            placeholder="S.N."
            className="h-9"
          />
          <Input
            value={legacyFilters.firstName}
            onChange={(event) => handleLegacyFilterChange("firstName", event.target.value)}
            placeholder="F Name"
            className="h-9"
          />
          <Input
            value={legacyFilters.lastName}
            onChange={(event) => handleLegacyFilterChange("lastName", event.target.value)}
            placeholder="L Name"
            className="h-9"
          />
          <Input
            type="date"
            value={legacyFilters.dateOfBirth}
            onChange={(event) => handleLegacyFilterChange("dateOfBirth", event.target.value)}
            aria-label="Date of birth"
            className="h-9"
          />
          <Input
            value={legacyFilters.nationality}
            onChange={(event) => handleLegacyFilterChange("nationality", event.target.value)}
            placeholder="Nationality"
            className="h-9"
          />
          <Input
            type="date"
            value={legacyFilters.createdFrom}
            onChange={(event) => handleLegacyFilterChange("createdFrom", event.target.value)}
            aria-label="Created from"
            className="h-9"
          />
          <Input
            type="date"
            value={legacyFilters.createdTo}
            onChange={(event) => handleLegacyFilterChange("createdTo", event.target.value)}
            aria-label="Created to"
            className="h-9"
          />
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            <Filter className="size-4" />
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            disabled={isPending}
          >
            <X className="size-4" />
            Clear
          </Button>
        </form>

        {/* ── Active Filter Pills ──────────────────── */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 print:hidden">
            <span className="text-xs font-medium text-muted-foreground mr-1">Filters:</span>
            {activeFilters.map((f) => (
              <Badge
                key={f.key}
                variant="secondary"
                className="gap-1 pl-2 pr-1 py-0.5 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
              >
                <span className="font-medium">{f.label}:</span> {f.value}
                <button
                  onClick={() => clearFilter(f.key)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Data View ──────────────────────────── */}
        <div className="space-y-4">
          {viewMode === "cards" ? (
            /* Cards Grid */
            childrenList.length === 0 ? (
              <ChildrenEmptyState
                actionHref={addChildHref}
                canAddChild={canAddChild}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {childrenList.map((child) => {
                  const status = child.isDraft
                    ? "DRAFT"
                    : child.isActive
                    ? "ACTIVE"
                    : "INACTIVE";
                  const statusColor =
                    status === "ACTIVE"
                      ? "bg-[#008200] text-white border-transparent"
                      : status === "DRAFT"
                      ? "bg-[#c29d0b] text-white border-transparent"
                      : "bg-[#d64635] text-white border-transparent";
                  const age = child.dateOfBirth ? getChildAge(child.dateOfBirth) : null;
                  const initials = getInitials(child.firstName, child.lastName);
                  const avatarBg = getAvatarColor(`${child.firstName} ${child.lastName}`);

                  return (
                    <Link key={child.id} href={`/children/${child.id}/dashboard`}>
                      <Card className="group transition-all hover:border-[#0B9178]/30 hover:shadow-[0_4px_20px_-4px_rgba(195,90,44,0.12)]">
                        <CardContent className="flex items-start gap-3.5 py-4">
                          <div
                            className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${avatarBg}`}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                              {child.firstName} {child.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {child.class?.name ?? "No class"}
                              {child.branch?.name ? ` · ${child.branch.name}` : ""}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge className={`text-[10px] px-1.5 py-0 border ${statusColor}`}>
                                {status === "ACTIVE" ? "Active" : status === "DRAFT" ? "Draft" : "Inactive"}
                              </Badge>
                              {child.gender && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                  <span
                                    className={`inline-block size-1.5 rounded-full ${
                                      child.gender === "MALE" ? "bg-[#4F46E5]" : "bg-[#E11D48]"
                                    }`}
                                  />
                                  {child.gender === "MALE" ? "Boy" : "Girl"}
                                </Badge>
                              )}
                              {age && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {age}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )
          ) : (
            /* Table View */
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm print:rounded-none print:border-gray-300 print:shadow-none">
              <div className="overflow-x-auto print:overflow-visible">
                <Table className="min-w-[940px] print:min-w-0 print:w-full print:text-[11px]">
                  <TableHeader className="sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="border-border/60 hover:bg-transparent">
                        {headerGroup.headers.map((header, idx) => (
                          <TableHead
                            key={header.id}
                            className={`bg-muted/60 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 sm:px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg ${
                              idx === 0
                                ? "sticky left-0 z-20 bg-muted/95 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border/50 md:after:hidden"
                                : ""
                            }`}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {isPending ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-muted-foreground"
                        >
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} className="group border-border/40 transition-colors duration-100 hover:bg-accent/40">
                          {row.getVisibleCells().map((cell, idx) => (
                            <TableCell
                              key={cell.id}
                              className={`px-3 sm:px-4 py-3 text-sm ${
                                idx === 0
                                  ? "sticky left-0 z-10 bg-card group-hover:bg-accent/40 transition-colors duration-100 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border/30 md:after:hidden"
                                  : ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columns.length}
                          className="h-40 text-center"
                        >
                          <ChildrenEmptyState
                            actionHref={addChildHref}
                            canAddChild={canAddChild}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ── Pagination ──────────────────────────── */}
          {total > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border/40 bg-card/50 px-4 py-3 print:hidden">
              <p className="text-sm text-muted-foreground">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {Math.min((filters.page - 1) * filters.pageSize + 1, total)}
                </span>
                {" "}&ndash;{" "}
                <span className="font-medium text-foreground">
                  {Math.min(filters.page * filters.pageSize, total)}
                </span>
                {" "}of{" "}
                <span className="font-medium text-foreground">{total}</span> children
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows:</span>
                <Select
                  value={String(filters.pageSize)}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 50, 100, 150].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 sm:size-8 border-border/60"
                    onClick={() => handlePageChange(1)}
                    disabled={!canPreviousPage}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 sm:size-8 border-border/60"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={!canPreviousPage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[5rem] text-center text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{filters.page}</span> / {pageCount || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 sm:size-8 border-border/60"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={!canNextPage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 sm:size-8 border-border/60"
                    onClick={() => handlePageChange(pageCount)}
                    disabled={!canNextPage}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        </CardContent>
      </Card>

      <Dialog
        open={bulkDialogOpen}
        onOpenChange={(open) => {
          setBulkDialogOpen(open);
          if (!open) {
            setBulkBranchId("");
            setBulkClassId("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Branch & Class</DialogTitle>
            <DialogDescription>
              Update {selectedCount} selected {selectedCount === 1 ? "child" : "children"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={bulkBranchId}
                onValueChange={handleBulkBranchChange}
                disabled={!!lockedBranchId || isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {bulkBranchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={bulkClassId}
                onValueChange={setBulkClassId}
                disabled={!bulkBranchId || isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {bulkClassOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              disabled={isPending}
            >
              Close
            </Button>
            <Button onClick={handleBulkUpdate} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightLeft className="size-4" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deactivation</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{deleteTarget?.name}</strong>? This will mark the child as
              inactive.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
            >
              {isPending ? "Deactivating..." : "Deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Warm Empty State ─────────────────────────

function ChildrenEmptyState({
  actionHref = "/children/new",
  canAddChild = true,
}: {
  actionHref?: string;
  canAddChild?: boolean;
}) {
  return (
    <EmptyState
      icon={Sparkles}
      title="No children found"
      description="Try adjusting your search or filters. Or start by enrolling a new child to the nursery."
      action={
        canAddChild
          ? { label: "Enroll a Child", href: actionHref, icon: Plus }
          : undefined
      }
    />
  );
}
