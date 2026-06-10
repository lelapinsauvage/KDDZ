import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const clients = {
  absence: "src/app/(app)/children/[id]/absence/absence-client.tsx",
  accidents: "src/app/(app)/children/[id]/accidents/accidents-client.tsx",
  calls: "src/app/(app)/children/[id]/calls/calls-client.tsx",
};

const exportButton = readFileSync(
  "src/components/shared/export-button.tsx",
  "utf8",
);
const matrix = readFileSync("docs/page-parity-matrix.json", "utf8");

assert.match(exportButton, /type ExportFormat = "copy" \| "xlsx" \| "csv" \| "pdf"/);
assert.match(exportButton, /exportToClipboard/);
assert.match(exportButton, /exportToExcel/);
assert.match(exportButton, /exportToCsv/);
assert.match(exportButton, /Export as PDF/);

for (const [key, path] of Object.entries(clients)) {
  const source = readFileSync(path, "utf8");
  assert.match(source, /AttachmentPreviewDialog/);
  assert.match(source, /type AttachmentPreviewItem/);
  assert.match(source, /function previewItems/);
  assert.match(source, /setPreviewTarget\(/);
  assert.match(source, /<ExportButton/);
  assert.match(source, /data=\{exportRows\(filtered/);
  assert.match(source, /window\.print\(\)/);
  assert.match(
    matrix,
    new RegExp(`${key === "accidents" ? "child_accident" : key === "absence" ? "child_absence" : "child_calls"}\\.php[\\s\\S]*AttachmentPreviewDialog-compatible image preview`),
  );
}

console.log("legacy child history TableTools/preview contract assertions passed");
