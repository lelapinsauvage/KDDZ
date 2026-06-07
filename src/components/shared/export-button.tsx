"use client";

import { useState } from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { Clipboard, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  downloadBlob,
  exportToClipboard,
  exportToCsv,
  exportToExcel,
  getExportMatrix,
  type ExportColumn,
} from "@/lib/export";
import { toast } from "sonner";

interface ExportButtonProps {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

type ExportFormat = "copy" | "xlsx" | "csv" | "pdf";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: "#111827",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  meta: {
    color: "#6b7280",
    marginBottom: 12,
  },
  table: {
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#d1d5db",
  },
  row: {
    flexDirection: "row",
  },
  headerCell: {
    backgroundColor: "#f3f4f6",
    fontWeight: 700,
  },
  cell: {
    flex: 1,
    minHeight: 18,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
});

function withExtension(filename: string, extension: string) {
  return filename.toLowerCase().endsWith(extension)
    ? filename
    : `${filename}${extension}`;
}

function PdfTableDocument({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <Document title={title}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{title}</Text>
        <Text style={pdfStyles.meta}>
          Generated on {new Date().toLocaleString()} - {rows.length} rows
        </Text>
        <View style={pdfStyles.table}>
          <View fixed style={pdfStyles.row}>
            {headers.map((header) => (
              <Text
                key={header}
                style={[pdfStyles.cell, pdfStyles.headerCell]}
              >
                {header}
              </Text>
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={pdfStyles.row} wrap={false}>
              {row.map((cell, cellIndex) => (
                <Text
                  key={`${rowIndex}-${cellIndex}`}
                  style={pdfStyles.cell}
                >
                  {String(cell)}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export function ExportButton({
  filename,
  sheetName,
  columns,
  data,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: ExportFormat) {
    setIsExporting(true);
    try {
      if (format === "xlsx") {
        exportToExcel({ filename, sheetName, columns, data });
      } else if (format === "csv") {
        exportToCsv({ filename, columns, data });
      } else if (format === "copy") {
        await exportToClipboard({ columns, data });
        toast.success("Table copied to clipboard");
      } else {
        const { headers, rows } = getExportMatrix({ columns, data });
        const blob = await pdf(
          <PdfTableDocument
            title={sheetName ?? filename}
            headers={headers}
            rows={rows}
          />,
        ).toBlob();
        downloadBlob(blob, withExtension(filename, ".pdf"));
      }
    } catch (error) {
      console.error("Export failed", error);
      toast.error("Export failed");
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
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => void handleExport("copy")}>
          <Clipboard className="mr-2 size-4" />
          Copy table
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("xlsx")}>
          <FileSpreadsheet className="mr-2 size-4" />
          Export as Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("csv")}>
          <FileText className="mr-2 size-4" />
          Export as CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void handleExport("pdf")}>
          <FileText className="mr-2 size-4" />
          Export as PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
