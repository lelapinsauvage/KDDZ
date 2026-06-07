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

export interface ExportMatrix {
  headers: string[];
  rows: Array<Array<string | number>>;
}

function getExportValue(
  row: Record<string, unknown>,
  column: ExportColumn,
): string | number {
  const value = row[column.key];
  if (column.transform) {
    return column.transform(value, row);
  }
  if (value === null || value === undefined) return "";
  return typeof value === "number" ? value : String(value);
}

export function getExportMatrix({
  columns,
  data,
}: Pick<ExportOptions, "columns" | "data">): ExportMatrix {
  return {
    headers: columns.map((column) => column.header),
    rows: data.map((row) =>
      columns.map((column) => getExportValue(row, column)),
    ),
  };
}

function sanitizeClipboardCell(value: string | number) {
  return String(value).replace(/\r?\n/g, " ").replace(/\t/g, " ");
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy failed");
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Export data as an XLSX file and trigger download in the browser.
 */
export function exportToExcel({ filename, sheetName = "Sheet1", columns, data }: ExportOptions) {
  const { headers, rows } = getExportMatrix({ columns, data });

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
  const { headers, rows } = getExportMatrix({ columns, data });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const csv = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const ext = filename.endsWith(".csv") ? "" : ".csv";
  downloadBlob(blob, `${filename}${ext}`);
}

/**
 * Copy the export matrix to the clipboard in spreadsheet-friendly TSV format.
 */
export async function exportToClipboard({
  columns,
  data,
}: Pick<ExportOptions, "columns" | "data">) {
  const { headers, rows } = getExportMatrix({ columns, data });
  const text = [headers, ...rows]
    .map((row) => row.map(sanitizeClipboardCell).join("\t"))
    .join("\n");

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  fallbackCopyText(text);
}
