"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToCsv, type ExportColumn } from "@/lib/export";

interface ExportButtonProps {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

export function ExportButton({
  filename,
  sheetName,
  columns,
  data,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  function handleExport(format: "xlsx" | "csv") {
    setIsExporting(true);
    try {
      if (format === "xlsx") {
        exportToExcel({ filename, sheetName, columns, data });
      } else {
        exportToCsv({ filename, columns, data });
      }
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting || data.length === 0}
        >
          <Download className="size-4 mr-1" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          Export as CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
