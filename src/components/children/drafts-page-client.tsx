"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { getChildrenColumns, type ChildRow } from "@/components/children/children-columns";
import { bulkUpdateChildrenBranchClass, deleteChild } from "@/lib/actions/children";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";
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

interface DraftsPageClientProps {
  childrenList: ChildRow[];
  total: number;
  branches: BranchItem[];
  classes: ClassItem[];
  filters: Filters;
}

const draftExportColumns: ExportColumn[] = [
  { header: "S.N.", key: "childNumber" },
  { header: "First Name", key: "firstName" },
  { header: "Last Name", key: "lastName" },
  {
    header: "Date of Birth",
    key: "dateOfBirth",
    transform: (value) => {
      if (!value) return "";
      const date = new Date(value as string);
      return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB");
    },
  },
  {
    header: "Branch",
    key: "branch",
    transform: (value) => (value as { name: string } | null)?.name ?? "",
  },
  {
    header: "Class",
    key: "class",
    transform: (value) => (value as { name: string } | null)?.name ?? "",
  },
  { header: "Nationality", key: "nationality" },
  { header: "Gender", key: "gender" },
  {
    header: "Date",
    key: "createdAt",
    transform: (value) => {
      if (!value) return "";
      const date = new Date(value as string);
      return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-GB");
    },
  },
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

export function DraftsPageClient({
  childrenList,
  total,
  branches,
  classes,
  filters,
}: DraftsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkBranchId, setBulkBranchId] = useState("");
  const [bulkClassId, setBulkClassId] = useState("");

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
      if (!("page" in updates)) {
        params.delete("page");
      }
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    },
    [searchParams, pathname, router]
  );

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
  const bulkClassOptions = bulkBranchId
    ? classes.filter((item) => item.branchId === bulkBranchId)
    : [];

  const activeFilters = useMemo(() => {
    const pills: { key: string; label: string; value: string }[] = [];
    if (filters.search) pills.push({ key: "search", label: "Search", value: filters.search });
    if (filters.branch !== "ALL") {
      const branch = branches.find((item) => item.id === filters.branch);
      pills.push({ key: "branch", label: "Branch", value: branch?.name ?? filters.branch });
    }
    if (filters.class !== "ALL") {
      const klass = classes.find((item) => item.id === filters.class);
      pills.push({ key: "class", label: "Class", value: klass?.name ?? filters.class });
    }
    if (filters.gender !== "ALL") {
      pills.push({ key: "gender", label: "Gender", value: filters.gender === "MALE" ? "Male" : "Female" });
    }
    if (filters.childNumber) pills.push({ key: "childNumber", label: "S.N.", value: filters.childNumber });
    if (filters.firstName) pills.push({ key: "firstName", label: "F Name", value: filters.firstName });
    if (filters.lastName) pills.push({ key: "lastName", label: "L Name", value: filters.lastName });
    if (filters.dateOfBirth) pills.push({ key: "dateOfBirth", label: "DOB", value: filters.dateOfBirth });
    if (filters.nationality) pills.push({ key: "nationality", label: "Nationality", value: filters.nationality });
    if (filters.createdFrom) pills.push({ key: "createdFrom", label: "Created from", value: filters.createdFrom });
    if (filters.createdTo) pills.push({ key: "createdTo", label: "Created to", value: filters.createdTo });
    return pills;
  }, [branches, classes, filters]);

  // ── Handlers ───────────────────────────────────

  const handleSearchSubmit = useCallback(() => {
    updateParams({ search: searchValue });
  }, [searchValue, updateParams]);

  const clearFilter = useCallback(
    (key: string) => {
      if (key === "search") {
        setSearchValue("");
      }
      if (legacyFilterKeys.includes(key as (typeof legacyFilterKeys)[number])) {
        setLegacyFilters((current) => ({ ...current, [key]: "" }));
      }
      updateParams({ [key]: "" });
    },
    [updateParams]
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
      branch: "",
      class: "",
      gender: "",
      childNumber: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      nationality: "",
      createdFrom: "",
      createdTo: "",
    });
  }, [updateParams]);

  const handleBranchChange = useCallback(
    (value: string) => {
      updateParams({ branch: value, class: "" });
    },
    [updateParams]
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
  }, [branches, childrenList, classes, filters.branch, selectedIds]);

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
          `${result.updatedCount} ${result.updatedCount === 1 ? "draft" : "drafts"} updated.`
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

  // ── Table setup ────────────────────────────────

  const selectionColumn = useMemo<ColumnDef<ChildRow>>(
    () => ({
      id: "select",
      header: () => (
        <Checkbox
          checked={allPageRowsSelected || (somePageRowsSelected ? "indeterminate" : false)}
          onCheckedChange={(checked) => togglePageSelection(checked === true)}
          aria-label="Select all drafts in page"
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
    () => getChildrenColumns({ onDelete: handleDeleteRequest, variant: "drafts" }),
    [handleDeleteRequest]
  );
  const columns = useMemo(
    () => [selectionColumn, ...baseColumns],
    [baseColumns, selectionColumn]
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

  const pageCount = Math.ceil(total / filters.pageSize);
  const canPreviousPage = filters.page > 1;
  const canNextPage = filters.page < pageCount;

  return (
    <>
      <PageHeader
        title="Children Drafts"
        breadcrumbs={[
          { label: "Children Management", href: "/children" },
          { label: "Children Drafts" },
        ]}
      />

      <div className="space-y-4 p-4 md:p-6">
        {/* ── Toolbar ─────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search */}
          <form
            className="relative w-full sm:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
          >
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onBlur={handleSearchSubmit}
              className="pl-9"
            />
          </form>

          {/* Branch filter */}
          <Select value={filters.branch} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-[calc(50%-0.25rem)] sm:w-[180px]">
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
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
            </SelectContent>
          </Select>

          {/* Spacer */}
          <div className="flex-1" />

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

          <ExportButton
            filename="children_drafts"
            sheetName="Children Drafts"
            columns={draftExportColumns}
            data={childrenList as unknown as Record<string, unknown>[]}
          />

          {/* Add Child button */}
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link href="/children/new">
              <Plus className="mr-1 size-4" />
              Add Child
            </Link>
          </Button>
        </div>

        <form
          onSubmit={applyLegacyFilters}
          className="grid gap-2 rounded border border-border/60 bg-card p-3 sm:grid-cols-2 lg:grid-cols-[0.75fr_1fr_1fr_1fr_1fr_1fr_1fr_auto_auto]"
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

        {activeFilters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">Filters:</span>
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => clearFilter(filter.key)}
                className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary"
              >
                <span className="font-medium">{filter.label}:</span>
                {filter.value}
                <X className="size-3" />
              </button>
            ))}
          </div>
        ) : null}

        {/* ── Data Table ──────────────────────────── */}
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border bg-card">
            <Table className="min-w-[940px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="bg-muted/50 text-xs font-semibold uppercase text-muted-foreground"
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
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ──────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {total} total row(s)
            </p>
            <div className="flex items-center gap-2">
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
                  className="h-8 w-8"
                  onClick={() => handlePageChange(1)}
                  disabled={!canPreviousPage}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={!canPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {filters.page} of {pageCount || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={!canNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handlePageChange(pageCount)}
                  disabled={!canNextPage}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              Update {selectedCount} selected {selectedCount === 1 ? "draft" : "drafts"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                value={bulkBranchId}
                onValueChange={handleBulkBranchChange}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
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
