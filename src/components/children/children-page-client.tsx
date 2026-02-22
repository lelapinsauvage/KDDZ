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
  Baby,
  LayoutGrid,
  TableIcon,
} from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

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

          {/* View toggle */}
          <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
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

        {/* ── Data View ──────────────────────────── */}
        <div className="space-y-4">
          {viewMode === "cards" ? (
            /* Cards Grid */
            childrenList.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                <Baby className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No children found</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Try adjusting your search or filters, or register a new child.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/children/new">
                    <Plus className="mr-1 size-3.5" />
                    Register Child
                  </Link>
                </Button>
              </div>
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
                      ? "bg-emerald-100 text-emerald-700"
                      : status === "DRAFT"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-700";
                  const age = child.dateOfBirth ? getChildAge(child.dateOfBirth) : null;

                  return (
                    <Link key={child.id} href={`/children/${child.id}/dashboard`}>
                      <Card className="transition-colors hover:border-primary/40 hover:bg-muted/30">
                        <CardContent className="flex items-start gap-3 py-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {child.firstName.charAt(0)}
                            {child.lastName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {child.firstName} {child.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {child.class?.name ?? "No class"}
                              {child.branch?.name ? ` · ${child.branch.name}` : ""}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <Badge className={`text-[10px] px-1.5 py-0 ${statusColor}`}>
                                {status === "ACTIVE" ? "Active" : status === "DRAFT" ? "Draft" : "Inactive"}
                              </Badge>
                              {child.gender && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {child.gender === "MALE" ? "M" : "F"}
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
                        className="h-40 text-center"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <Baby className="size-10 text-muted-foreground/40 mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">No children found</p>
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            Try adjusting your search or filters, or register a new child.
                          </p>
                          <Button asChild size="sm" className="mt-3">
                            <Link href="/children/new">
                              <Plus className="mr-1 size-3.5" />
                              Register Child
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

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
