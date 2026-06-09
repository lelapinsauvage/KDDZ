"use client";

import { useState, useCallback, useMemo } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type Column,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SlidersHorizontal,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Inbox,
  Printer,
} from "lucide-react";
import { ExportButton } from "@/components/shared/export-button";
import type { ExportColumn } from "@/lib/export";

// ── Bulk Action Type ──────────────────────────

export interface BulkAction<TData> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (selectedRows: TData[]) => void;
  variant?: "default" | "destructive";
}

export interface DataTableExportOptions<TData> {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  mapRow?: (row: TData, index: number) => Record<string, unknown>;
}

export interface DataTablePrintOptions<TData> {
  label?: string;
  onPrint?: (visibleRows: TData[]) => void;
}

// ── Sortable Header Helper ───────────────────

interface SortableHeaderProps<TData, TValue> {
  column: Column<TData, TValue>;
  children: React.ReactNode;
}

export function SortableHeader<TData, TValue>({
  column,
  children,
}: SortableHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 text-xs font-semibold uppercase"
      onClick={() => column.toggleSorting(sorted === "asc")}
      aria-label={`Sort by ${typeof children === "string" ? children : column.id}, currently ${sorted ? `sorted ${sorted}ending` : "unsorted"}`}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="ml-1 size-3 text-foreground" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-1 size-3 text-foreground" />
      ) : (
        <ArrowUpDown className="ml-1 size-3 opacity-40" />
      )}
    </Button>
  );
}

// ── Props ─────────────────────────────────────

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  initialSearchValue?: string;
  searchMode?: "column" | "global";
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
  bulkActions?: BulkAction<TData>[];
  pageSizeOptions?: Array<number | "all">;
  exportOptions?: DataTableExportOptions<TData>;
  printOptions?: DataTablePrintOptions<TData>;
}

const GLOBAL_FILTER_ID = "__globalSearch";

function collectSearchValues(value: unknown, depth = 0): string[] {
  if (value === null || value === undefined) return [];
  if (value instanceof Date) return [value.toISOString()];

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return depth >= 2
      ? []
      : value.flatMap((item) => collectSearchValues(item, depth + 1));
  }

  if (typeof value === "object") {
    return depth >= 2
      ? []
      : Object.values(value as Record<string, unknown>).flatMap((item) =>
          collectSearchValues(item, depth + 1),
        );
  }

  return [];
}

function rowMatchesGlobalSearch(row: unknown, filterValue: unknown) {
  const query = String(filterValue ?? "").trim().toLowerCase();
  if (!query) return true;

  return collectSearchValues(row).some((value) =>
    value.toLowerCase().includes(query),
  );
}

// ── DataTable Component ───────────────────────

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  initialSearchValue,
  searchMode = "column",
  emptyState,
  isLoading = false,
  onRowClick,
  bulkActions,
  pageSizeOptions = [10, 20, 30, 50, 100],
  exportOptions,
  printOptions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() =>
    searchKey && searchMode === "column" && initialSearchValue
      ? [{ id: searchKey, value: initialSearchValue }]
      : [],
  );
  const [globalFilter, setGlobalFilter] = useState(
    searchMode === "global" ? (initialSearchValue ?? "") : "",
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Prepend a checkbox column when bulk actions are provided
  const tableColumns: ColumnDef<TData, TValue>[] =
    bulkActions && bulkActions.length > 0
      ? [
          {
            id: "select",
            header: ({ table: t }) => (
              <Checkbox
                checked={
                  t.getIsAllPageRowsSelected() ||
                  (t.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(v) => t.toggleAllPageRowsSelected(!!v)}
                aria-label="Select all"
              />
            ),
            cell: ({ row }) => (
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(v) => row.toggleSelected(!!v)}
                aria-label="Select row"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              />
            ),
            enableSorting: false,
            enableHiding: false,
          } as ColumnDef<TData, TValue>,
          ...columns,
        ]
      : columns;

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) =>
      rowMatchesGlobalSearch(row.original, filterValue),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, globalFilter, columnVisibility, rowSelection },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;
  const actionRows = table.getPrePaginationRowModel().rows;
  const actionRowData = actionRows.map((row) => row.original);
  const exportData =
    exportOptions?.columns.length
      ? actionRows.map((row, index) =>
          exportOptions.mapRow
            ? exportOptions.mapRow(row.original, index)
            : (row.original as Record<string, unknown>),
        )
      : [];
  const currentPageSize = table.getState().pagination.pageSize;
  const pageSizeValue = pageSizeOptions.some(
    (option) => option !== "all" && option === currentPageSize
  )
    ? `${currentPageSize}`
    : pageSizeOptions.includes("all")
      ? "all"
      : `${currentPageSize}`;
  const activeFilters = useMemo(
    () => [
      ...(searchMode === "global" && String(globalFilter).trim()
        ? [{ id: GLOBAL_FILTER_ID, value: globalFilter }]
        : []),
      ...columnFilters.filter(
        (f) => f.value !== "" && f.value !== undefined && f.value !== "ALL",
      ),
    ],
    [columnFilters, globalFilter, searchMode],
  );

  const toggleableColumns = table
    .getAllColumns()
    .filter(
      (col) =>
        col.getCanHide() &&
        !["select", "actions", "avatar"].includes(col.id)
    );

  const removeFilter = useCallback(
    (columnId: string) => {
      if (columnId === GLOBAL_FILTER_ID) {
        setGlobalFilter("");
        return;
      }

      table.getColumn(columnId)?.setFilterValue(undefined);
    },
    [table]
  );

  const clearAllFilters = useCallback(() => {
    activeFilters.forEach((f) => removeFilter(f.id));
  }, [activeFilters, removeFilter]);

  const handlePrint = useCallback(() => {
    if (printOptions?.onPrint) {
      printOptions.onPrint(actionRowData);
      return;
    }

    window.print();
  }, [actionRowData, printOptions]);

  // ── Loading skeleton ────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="ml-auto h-9 w-24" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                {tableColumns.map((col, i) => (
                  <TableHead
                    key={i}
                    className="bg-muted/60 px-4 py-3"
                  >
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={rowIdx} className="border-border/40">
                  {tableColumns.map((col, colIdx) => {
                    const colId =
                      "id" in col ? col.id : "accessorKey" in col ? String(col.accessorKey) : "";
                    return (
                      <TableCell key={colIdx} className="px-4 py-3">
                        {colId === "avatar" || colId === "select" ? (
                          <Skeleton className="size-9 rounded-full" />
                        ) : colId === "actions" ? (
                          <Skeleton className="size-8 rounded-md" />
                        ) : (
                          <Skeleton
                            className="h-4"
                            style={{ width: `${60 + ((rowIdx * 17 + colIdx * 31) % 40)}px` }}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-4 py-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {searchKey && (
          <div role="search" className="relative w-full sm:max-w-sm sm:flex-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                searchMode === "global"
                  ? globalFilter
                  : ((table.getColumn(searchKey)?.getFilterValue() as string) ?? "")
              }
              onChange={(e) => {
                if (searchMode === "global") {
                  setGlobalFilter(e.target.value);
                } else {
                  table.getColumn(searchKey)?.setFilterValue(e.target.value);
                }
              }}
              className="pl-9"
            />
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {exportOptions && (
            <ExportButton
              filename={exportOptions.filename}
              sheetName={exportOptions.sheetName}
              columns={exportOptions.columns}
              data={exportData}
            />
          )}

          {printOptions && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={actionRowData.length === 0}
              onClick={handlePrint}
            >
              <Printer className="mr-1 size-4" />
              {printOptions.label ?? "Print"}
            </Button>
          )}

          {/* Column visibility toggle */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                aria-label="Toggle column visibility"
                className="h-9 gap-1.5 border-border/60"
              >
                <SlidersHorizontal className="size-3.5" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-2">
              <div className="space-y-1">
                <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Toggle columns
                </p>
                {toggleableColumns.map((column) => {
                  const label = column.id
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())
                    .trim();
                  return (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        checked={column.getIsVisible()}
                        onCheckedChange={(v) => column.toggleVisibility(!!v)}
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {activeFilters.map((filter) => {
            const label =
              filter.id === GLOBAL_FILTER_ID
                ? "Search"
                : filter.id
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())
                    .trim();
            return (
              <Badge
                key={filter.id}
                variant="secondary"
                className="gap-1 pl-2.5 pr-1 text-xs font-normal"
              >
                {label}: <span className="font-medium">{String(filter.value)}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  aria-label={`Remove ${label} filter`}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={clearAllFilters}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk actions bar */}
      {hasSelection && bulkActions && bulkActions.length > 0 && (
        <div role="toolbar" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 sm:px-4 py-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium" aria-live="polite">
            {selectedRows.length} row{selectedRows.length !== 1 ? "s" : ""}{" "}
            selected
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {bulkActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant={
                    action.variant === "destructive" ? "destructive" : "outline"
                  }
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() =>
                    action.onClick(selectedRows.map((r) => r.original))
                  }
                >
                  {Icon && <Icon className="size-3.5" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => table.toggleAllRowsSelected(false)}
          >
            Deselect
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-border/60 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header, idx) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "link" : undefined}
                    className={`group border-border/40 transition-colors duration-100 hover:bg-accent/40 ${
                      onRowClick ? "cursor-pointer focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" : ""
                    } ${row.getIsSelected() ? "bg-primary/5" : ""}`}
                    onClick={() => onRowClick?.(row.original)}
                    onKeyDown={
                      onRowClick
                        ? (e: React.KeyboardEvent) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row.original);
                            }
                          }
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell, idx) => (
                      <TableCell
                        key={cell.id}
                        className={`px-3 sm:px-4 py-3 text-sm ${
                          idx === 0
                            ? "sticky left-0 z-10 bg-card group-hover:bg-accent/40 group-data-[state=selected]:bg-primary/5 transition-colors duration-100 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border/30 md:after:hidden"
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
                    colSpan={tableColumns.length}
                    className="h-48"
                  >
                    {emptyState ?? (
                      <div role="status" className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        <div className="rounded-full bg-muted p-3">
                          <Inbox aria-hidden="true" className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            No results found
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {activeFilters.length > 0
                              ? "Try adjusting your filters to find what you\u2019re looking for."
                              : "No data available yet."}
                          </p>
                        </div>
                        {activeFilters.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1"
                            onClick={clearAllFilters}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border/40 bg-card/50 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {hasSelection && (
            <>
              <span className="font-medium text-foreground">
                {selectedRows.length}
              </span>{" "}
              selected &middot;{" "}
            </>
          )}
          Showing{" "}
          <span className="font-medium text-foreground">
            {table.getFilteredRowModel().rows.length}
          </span>{" "}
          row(s)
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows:</span>
          <Select
            value={pageSizeValue}
            onValueChange={(value) =>
              table.setPageSize(value === "all" ? data.length || 1 : Number(value))
            }
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue
                placeholder={currentPageSize}
              />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizeOptions.map((option) => {
                return (
                  <SelectItem key={option} value={option === "all" ? "all" : `${option}`}>
                    {option === "all" ? "All" : option}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              aria-label="First page"
              className="size-9 sm:size-8 border-border/60"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              className="size-9 sm:size-8 border-border/60"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[5rem] text-center text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              className="size-9 sm:size-8 border-border/60"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Last page"
              className="size-9 sm:size-8 border-border/60"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
