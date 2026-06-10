"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  Eye,
  FileEdit,
  FileText,
  FilePlus,
  FileWarning,
  HeartPulse,
  Pencil,
  Printer,
  Stethoscope,
} from "lucide-react";
import type {
  DashboardDrilldown,
  DashboardDrilldownColumn,
  DashboardDrilldownKind,
  DashboardDrilldownRequestFilters,
  DashboardDrilldownRow,
} from "@/lib/actions/dashboard";
import { getDashboardDrilldown } from "@/lib/actions/dashboard";
import type { ExportColumn } from "@/lib/export";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, SortableHeader } from "@/components/shared/data-table";
import type { StatCardColor } from "./stat-card";
import { colorStyles } from "./stat-card";

interface DashboardDrilldownCardProps {
  title: string;
  value: number | string;
  iconName: DashboardDrilldownIconName;
  color: StatCardColor;
  drilldownKind: DashboardDrilldownKind;
  filters: DashboardDrilldownRequestFilters;
  drilldown: DashboardDrilldown;
}

type DashboardDrilldownIconName =
  | "alertTriangle"
  | "clipboardCheck"
  | "clipboardList"
  | "dollarSign"
  | "fileEdit"
  | "fileText"
  | "fileWarning"
  | "heartPulse"
  | "stethoscope";

const cardIcons: Record<DashboardDrilldownIconName, LucideIcon> = {
  alertTriangle: AlertTriangle,
  clipboardCheck: ClipboardCheck,
  clipboardList: ClipboardList,
  dollarSign: DollarSign,
  fileEdit: FileEdit,
  fileText: FileText,
  fileWarning: FileWarning,
  heartPulse: HeartPulse,
  stethoscope: Stethoscope,
};

const columnLabels: Record<DashboardDrilldownColumn, string> = {
  number: "#",
  name: "Name",
  lastName: "Last Name",
  amount: "Amount",
  type: "Type",
  for: "For",
  date: "Date",
  from: "From",
  to: "To",
  remarks: "Remarks",
  attachment: "Attachment",
  action: "Action",
};

function exportKeyForColumn(column: DashboardDrilldownColumn) {
  return column === "attachment" ? "attachmentLabel" : column;
}

function buildExportColumns(
  drilldownColumns: DashboardDrilldownColumn[],
): ExportColumn[] {
  return drilldownColumns
    .filter((column) => column !== "action")
    .map((column) => ({
      header: columnLabels[column],
      key: exportKeyForColumn(column),
    }));
}

function dashboardExportFilename(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "dashboard-drilldown"
  );
}

function actionIcon(label: DashboardDrilldownRow["actionLabel"]) {
  if (label === "Create") return FilePlus;
  if (label === "Edit") return Pencil;
  if (label === "Print") return Printer;
  return Eye;
}

function buildColumns(
  drilldownColumns: DashboardDrilldownColumn[],
): ColumnDef<DashboardDrilldownRow>[] {
  return drilldownColumns.map((drilldownColumn) => {
    if (drilldownColumn === "action") {
      return {
        id: "action",
        header: columnLabels.action,
        cell: ({ row }) => {
          const ActionIcon = actionIcon(row.original.actionLabel);

          return (
            <Button
              asChild
              size="sm"
              variant={row.original.actionLabel === "Create" ? "default" : "outline"}
              className="h-8"
            >
              <Link
                href={row.original.href}
                target={row.original.actionLabel === "Print" ? "_blank" : undefined}
                rel={row.original.actionLabel === "Print" ? "noreferrer" : undefined}
              >
                <ActionIcon className="size-3.5" />
                {row.original.actionLabel}
              </Link>
            </Button>
          );
        },
        enableSorting: false,
        enableHiding: false,
      };
    }

    if (drilldownColumn === "attachment") {
      return {
        id: "attachment",
        header: columnLabels.attachment,
        cell: ({ row }) => {
          if (!row.original.attachmentLabel) {
            return <span className="text-muted-foreground">-</span>;
          }

          if (!row.original.attachmentHref) {
            return (
              <span className="max-w-40 truncate text-xs text-muted-foreground">
                {row.original.attachmentLabel}
              </span>
            );
          }

          return (
            <Button asChild size="sm" variant="ghost" className="h-8">
              <a href={row.original.attachmentHref} target="_blank" rel="noreferrer">
                <FileText className="size-3.5" />
                View
              </a>
            </Button>
          );
        },
        enableSorting: false,
      };
    }

    return {
      accessorKey: drilldownColumn,
      header: ({ column }) => (
        <SortableHeader column={column}>
          {columnLabels[drilldownColumn]}
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const value = row.original[drilldownColumn];
        return (
          <span
            className={[
              drilldownColumn === "name" ? "font-medium" : "",
              drilldownColumn === "amount" ? "font-semibold tabular-nums" : "",
              drilldownColumn === "remarks" ? "block max-w-56 truncate" : "",
            ].filter(Boolean).join(" ")}
          >
            {value || "N/A"}
          </span>
        );
      },
    };
  });
}

export function DashboardDrilldownCard({
  title,
  value,
  iconName,
  color,
  drilldownKind,
  filters,
  drilldown,
}: DashboardDrilldownCardProps) {
  const styles = colorStyles[color];
  const Icon = cardIcons[iconName];
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [currentDrilldown, setCurrentDrilldown] = useState(drilldown);
  const columns = useMemo(
    () => buildColumns(currentDrilldown.columns),
    [currentDrilldown.columns],
  );
  const exportColumns = useMemo(
    () => buildExportColumns(currentDrilldown.columns),
    [currentDrilldown.columns],
  );
  const exportFilename = useMemo(
    () => dashboardExportFilename(currentDrilldown.title),
    [currentDrilldown.title],
  );

  const loadDrilldown = useCallback(async () => {
    if (loaded || loading) return;

    setLoading(true);
    setLoadError(false);

    try {
      const nextDrilldown = await getDashboardDrilldown(drilldownKind, filters);
      setCurrentDrilldown(nextDrilldown);
      setLoaded(true);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [drilldownKind, filters, loaded, loading]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) void loadDrilldown();
    },
    [loadDrilldown],
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="block w-full rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className={`group relative overflow-hidden rounded ${styles.bg} shadow-sm`}>
            <div className="relative flex items-center justify-between px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-white/80">{title}</p>
              </div>
              <Icon className="size-14 text-white/20" strokeWidth={1.2} />
            </div>

            <div className={`${styles.footer} px-4 py-2 text-center`}>
              <span className="inline-flex items-center justify-center gap-1 text-xs font-medium text-white/90 group-hover:text-white">
                View More
                <ArrowRight className="size-3" />
              </span>
            </div>
          </div>
        </button>
      </DialogTrigger>

      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${
          currentDrilldown.columns.length > 8 ? "sm:max-w-[1180px]" : "sm:max-w-5xl"
        }`}
      >
        <DialogHeader>
          <DialogTitle>{currentDrilldown.title}</DialogTitle>
          <DialogDescription>
            {loadError
              ? "Rows could not be loaded"
              : `${currentDrilldown.rows.length.toLocaleString()} row${currentDrilldown.rows.length === 1 ? "" : "s"}`}
          </DialogDescription>
        </DialogHeader>

        <DataTable
          columns={columns}
          data={currentDrilldown.rows}
          searchKey="name"
          searchMode="global"
          searchPlaceholder="Search rows..."
          isLoading={loading}
          pageSizeOptions={[10, 20, 50, 100, 150, "all"]}
          exportOptions={{
            filename: exportFilename,
            sheetName: currentDrilldown.title,
            columns: exportColumns,
          }}
          printOptions={{ label: "Print" }}
        />
      </DialogContent>
    </Dialog>
  );
}
