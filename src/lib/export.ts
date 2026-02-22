import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
// Reusable Excel/CSV Export Utility
// ─────────────────────────────────────────────

export interface ExportColumn {
  header: string;
  key: string;
  /** Optional transform for the value */
  transform?: (value: unknown, row: Record<string, unknown>) => string | number;
}

interface ExportOptions {
  filename: string;
  sheetName?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

/**
 * Export data as an XLSX file and trigger download in the browser.
 */
export function exportToExcel({ filename, sheetName = "Sheet1", columns, data }: ExportOptions) {
  // Build header row
  const headers = columns.map((c) => c.header);

  // Build data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (col.transform) {
        return col.transform(value, row);
      }
      if (value === null || value === undefined) return "";
      return value;
    }),
  );

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto-size columns
  const colWidths = headers.map((h, i) => {
    let maxLen = h.length;
    for (const row of rows) {
      const cellLen = String(row[i] ?? "").length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws["!cols"] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Trigger download
  const ext = filename.endsWith(".xlsx") ? "" : ".xlsx";
  XLSX.writeFile(wb, `${filename}${ext}`);
}

/**
 * Export data as a CSV file and trigger download.
 */
export function exportToCsv({ filename, columns, data }: Omit<ExportOptions, "sheetName">) {
  const headers = columns.map((c) => c.header);

  const rows = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (col.transform) {
        return String(col.transform(value, row));
      }
      if (value === null || value === undefined) return "";
      return String(value);
    }),
  );

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const ext = filename.endsWith(".csv") ? "" : ".csv";
  link.download = `${filename}${ext}`;
  link.click();
  URL.revokeObjectURL(url);
}
