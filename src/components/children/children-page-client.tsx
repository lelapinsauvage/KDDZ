"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { getChildrenColumns, type ChildRow } from "@/components/children/children-columns";
import { deleteChild } from "@/lib/actions/children";
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
  status: string;
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
}

const childrenExportColumns: ExportColumn[] = [
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
  { header: "Gender", key: "gender" },
  { header: "Nationality", key: "nationality" },
  { header: "Blood Type", key: "bloodType" },
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
  {
    header: "Status",
    key: "isActive",
    transform: (v, row) => {
      if (row.isDraft) return "Draft";
      return v ? "Active" : "Inactive";
    },
  },
];

export function ChildrenPageClient({
  childrenList,
  total,
  branches,
  classes,
  filters,
}: ChildrenPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Debounced search state (local, synced to URL on change)
  const [searchValue, setSearchValue] = useState(filters.search);

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

  // ── Handlers ───────────────────────────────────

  const handleSearchSubmit = useCallback(() => {
    updateParams({ search: searchValue });
  }, [searchValue, updateParams]);

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

  const handleStatusChange = useCallback(
    (value: string) => {
      updateParams({ status: value });
    },
    [updateParams]
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

  const columns = useMemo(
    () => getChildrenColumns({ onDelete: handleDeleteRequest }),
    [handleDeleteRequest]
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
      <PageHeader
        title="Children Listing"
        breadcrumbs={[
          { label: "Children Management", href: "/children" },
          { label: "Children Listing" },
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

          {/* Export */}
          <ExportButton
            filename="children"
            sheetName="Children"
            columns={childrenExportColumns}
            data={childrenList as unknown as Record<string, unknown>[]}
          />

          {/* Add Child button */}
          <Button
            asChild
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Link href="/children/new">
              <Plus className="mr-1 size-4" />
              Add Child
            </Link>
          </Button>
        </div>

        {/* ── Data Table ──────────────────────────── */}
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-md border bg-card">
            <Table className="min-w-[700px]">
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
                  {[10, 20, 30, 50, 100].map((size) => (
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
