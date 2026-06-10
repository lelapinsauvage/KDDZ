import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildLegacySentMessageExportRows,
  formatLegacySentMessageDateTime,
  LEGACY_SENT_MESSAGE_EXPORT_COLUMNS,
  LEGACY_SENT_MESSAGE_PAGE_SIZES,
  legacySentMessageThreadLabel,
  parseLegacySentMessagePageSize,
} from "@/lib/legacy-sent-message-contract";

const legacyColumnHeaders = LEGACY_SENT_MESSAGE_EXPORT_COLUMNS.map(
  (column) => column.header,
);
assert.deepEqual(legacyColumnHeaders, [
  "#",
  "To",
  "Date",
  "Nature",
  "Subject",
  "Message",
  "Thread",
]);
assert.deepEqual(LEGACY_SENT_MESSAGE_PAGE_SIZES, [10, 20, 50, 100, 1000]);
assert.equal(parseLegacySentMessagePageSize("all"), "all");
assert.equal(parseLegacySentMessagePageSize("1000"), 1000);
assert.equal(parseLegacySentMessagePageSize("150"), 10);

const rows = buildLegacySentMessageExportRows([
  {
    legacyId: 91,
    legacyThreadId: 44,
    threadId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    recipientName: "Parent One",
    nature: "General",
    subject: "Reminder",
    body: "Bring documents",
    createdAt: "2026-06-09T07:08:09",
  },
]);

assert.equal(rows.length, 1);
assert.deepEqual(Object.keys(rows[0]), [
  "serial",
  "to",
  "date",
  "nature",
  "subject",
  "message",
  "thread",
]);
assert.equal(rows[0].serial, 91);
assert.equal(rows[0].thread, "44");
assert.equal(rows[0].date, "2026-06-09 07:08:09");
assert.equal("delivery" in rows[0], false);
assert.equal(formatLegacySentMessageDateTime("not-a-date"), "");
assert.equal(
  legacySentMessageThreadLabel({
    legacyThreadId: null,
    threadId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  }),
  "aaaaaaaa",
);

const matrixJson = readFileSync("docs/page-parity-matrix.json", "utf8");
const matrixMarkdown = readFileSync("docs/page-parity-matrix.md", "utf8");

assert.match(
  matrixJson,
  /Msg_list\.php[\s\S]*restored - legacy sent messages columns, server pagination, full export\/print, and bridge restored/,
);
assert.match(
  matrixJson,
  /Msg_list\.php[\s\S]*Copy\/PDF\/Excel\/CSV export uses the legacy column order/,
);
assert.match(
  matrixJson,
  /Msg_list\.php[\s\S]*logged-in Browser smoke through `\/Msg_list\.php\?q=\.\.\.`/,
);

assert.match(
  matrixMarkdown,
  /Msg_list\.php \| Front\/templates\/admin\/js\/Msg_list\.js \| \/Msg_list\.php, \/messages\/sent \| restored - legacy sent messages columns, server pagination, full export\/print, and bridge restored/,
);
assert.match(
  matrixMarkdown,
  /Msg_list\.php[\s\S]*Copy\/PDF\/Excel\/CSV export uses the legacy column order/,
);
assert.match(
  matrixMarkdown,
  /Msg_list\.php[\s\S]*logged-in Browser smoke through `\/Msg_list\.php\?q=\.\.\.`/,
);
assert.doesNotMatch(
  matrixMarkdown,
  /Msg_list\.php[^\n]*visual audit remains/,
);

console.log("legacy sent message export contract ok");
