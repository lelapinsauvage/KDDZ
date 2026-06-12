import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  legacyPhp:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/message_portal_single.php",
  legacyJs:
    "/Users/karimsaab/Desktop/Garderie Project/Garderie-old-backup/Front/templates/admin/js/message_portal_single.js",
  bridge: "src/app/(app)/message_portal_single.php/page.tsx",
  actions: "src/lib/actions/messages.ts",
  page: "src/app/(app)/messages/[id]/page.tsx",
  client: "src/app/(app)/messages/[id]/thread-client.tsx",
  matrix: "docs/page-parity-matrix.json",
  markdownMatrix: "docs/page-parity-matrix.md",
  topGaps: "docs/top-20-restoration-gaps.md",
};

const text = Object.fromEntries(
  Object.entries(files).map(([key, path]) => [key, readFileSync(path, "utf8")]),
) as Record<keyof typeof files, string>;

assert.match(text.legacyPhp, /<title>Single Messaging<\/title>/);
assert.match(text.legacyPhp, /Check::protectPageOrFunction\('message_portal_single\.php'\)/);
assert.match(text.legacyPhp, /validateThread\(\$thread_id\) == false/);
assert.match(text.legacyPhp, /id="thread_id"/);
assert.match(text.legacyPhp, /<div class="caption" id="msginfo">\s*Thread\s*<\/div>/);
assert.match(text.legacyPhp, /id\s*=\s*"btnsend"/);
assert.match(text.legacyJs, /function generateclasses\(\)/);
assert.match(text.legacyJs, /class='container chatbubble'/);
assert.match(text.legacyJs, /Conversation Subject:/);
assert.match(text.legacyJs, /function replytomessage\(\)/);
assert.match(text.legacyJs, /clearthread\(\);\s*getthreadhistory\(\);/);
assert.match(text.legacyJs, /\$\("\.msg_nature"\)\.hide\(\)/);
assert.match(text.legacyJs, /\$\("\.btn-wd"\)\.text\("Reply"\)/);

assert.match(text.bridge, /resolveLegacyMessageThreadMessageId\(thread\)/);
assert.match(text.bridge, /redirect\("\/forbidden\.php"\)/);
assert.match(text.bridge, /redirect\(`\/messages\/\$\{encodeURIComponent\(messageId\)\}`\)/);
assert.match(text.actions, /legacyThreadId: m\.legacyThreadId/);
assert.match(text.actions, /legacyHref: m\.legacyHref/);
assert.match(text.actions, /legacyNature: m\.legacyNature/);
assert.match(text.actions, /replyToMessage/);
assert.match(text.actions, /revalidateMessagePaths\(\)/);
assert.match(text.actions, /const markedReadIds = new Set<string>\(\)/);
assert.match(text.actions, /markedReadIds\.add\(message\.id\)/);
assert.match(text.actions, /isRead: markedReadIds\.has\(m\.id\) \? true : m\.isRead/);

assert.match(text.page, /legacyId: number \| null/);
assert.match(text.page, /legacyThreadId: number \| null/);
assert.match(text.page, /legacyHref: string \| null/);
assert.match(text.page, /legacyNature: string \| null/);
assert.match(text.client, /data-legacy-message-thread/);
assert.match(text.client, /Thread #\{legacyThreadId\}/);
assert.match(text.client, /Type your reply\.\.\./);
assert.match(text.client, /Send Reply/);
assert.match(text.client, /Back to Inbox/);
assert.match(text.client, /Mark Unread/);
assert.match(text.client, /Mark Read/);
assert.match(text.client, /Delete Message/);
assert.match(text.client, /DeliveryBadges audit=\{msg\.legacyDelivery\}/);
assert.match(text.client, /\{msg\.legacyNature\}/);
assert.match(text.client, /\{msg\.legacyId\}/);

type MatrixRow = {
  legacyPhp?: string;
  status?: string;
  verification?: string;
};

const matrix = JSON.parse(text.matrix) as MatrixRow[];
const alarmsRow = matrix.find(
  (row) => row.legacyPhp === "Front/templates/admin/alarmsMsg.php",
);
assert.ok(alarmsRow);
assert.match(alarmsRow.status ?? "", /reply-thread visual audit restored/);
assert.match(alarmsRow.verification ?? "", /legacy reply-thread visual audit/);
assert.match(alarmsRow.verification ?? "", /message_portal_single\.php\?thread=/);
assert.match(alarmsRow.verification ?? "", /Thread #/);
assert.doesNotMatch(alarmsRow.verification ?? "", /Remaining work is exact legacy reply-thread visual audit/);

const directRow = matrix.find(
  (row) => row.legacyPhp === "Front/templates/admin/message_portal_single.php",
);
assert.ok(directRow);
assert.match(directRow.verification ?? "", /Thread #/);
assert.match(directRow.verification ?? "", /legacy message id\/nature badges/);
assert.match(directRow.verification ?? "", /verify-legacy-message-thread-visual-contract\.ts/);

const alarmsMarkdownRow = text.markdownMatrix
  .split("\n")
  .find((line) => line.includes("| Front/templates/admin/alarmsMsg.php |"));
assert.match(alarmsMarkdownRow ?? "", /reply-thread visual audit restored/);
assert.doesNotMatch(
  alarmsMarkdownRow ?? "",
  /Remaining work is exact legacy reply-thread visual audit/,
);
assert.match(text.topGaps, /Message reply-thread browser contract now covers/);
assert.match(
  text.topGaps,
  /Local message portal, read-state, visual, native route-handler, and provider-neutral delivery-audit implementation is closed/,
);
assert.match(
  text.topGaps,
  /remaining acceptance is real native-device execution and production push\/SMS\/WhatsApp credential rollout/,
);
assert.doesNotMatch(
  text.topGaps,
  /Remaining work is native-device acceptance and production push\/SMS\/WhatsApp credential rollout/,
);

console.log("legacy message thread visual contract assertions passed");
