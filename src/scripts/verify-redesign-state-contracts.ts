import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  isRedesignStateId,
  redesignStateAcceptanceRules,
  redesignStateContracts,
  redesignStateGroups,
  redesignStateOrder,
} from "../lib/redesign-state-contracts";

const read = (path: string) => readFileSync(resolve(path), "utf8");
const lab = read("src/app/design-lab/states/_components/state-pattern-lab.tsx");
const stateHarness = read("src/app/design-lab/states/_components/state-axe-harness.tsx");
const territoryHarness = read("src/app/design-lab/territories/_components/territory-axe-harness.tsx");
const sharedHarness = read("src/components/design-lab/axe-audit-harness.tsx");
const stylesheet = read("src/app/design-lab/states/states.css");
const acceptance = read("docs/redesign/design-system-acceptance.md");

assert.equal(redesignStateOrder.length, 15);
assert.equal(new Set(redesignStateOrder).size, 15);
assert.deepEqual(Object.keys(redesignStateContracts), [...redesignStateOrder]);
assert.deepEqual(redesignStateGroups, ["Data", "Input", "System", "Result"]);
assert.deepEqual(
  redesignStateGroups.map((group) =>
    redesignStateOrder.filter((state) => redesignStateContracts[state].group === group).length,
  ),
  [4, 3, 4, 4],
);

for (const state of redesignStateOrder) {
  const contract = redesignStateContracts[state];
  assert.equal(contract.id, state);
  assert(contract.label.length > 2);
  assert(contract.summary.endsWith("."));
  assert(contract.sourceStatus.length > 2);
  assert(contract.completion.length > 2);
  assert(contract.revision.length > 2);
  assert.equal(contract.rules.length, 2);
  assert.equal(redesignStateAcceptanceRules(state).length, 4);
  assert.match(lab, new RegExp(`case "${state}"`));
}

assert(isRedesignStateId("conflict"));
assert(!isRedesignStateId("completed"));
assert.equal(redesignStateContracts.draft.completion, "0 of 2 submitted");
assert.equal(redesignStateContracts.offline.sourceStatus, "Draft");
assert.equal(redesignStateContracts.waiting.sourceStatus, "Submitted · waiting");
assert.match(redesignStateContracts.corrected.revision, /original preserved/);
assert.match(redesignStateContracts.closed.rules.join(" "), /evidence/i);

assert.match(lab, /from "@\/lib\/redesign-state-contracts"/);
assert.match(lab, /data-state=\{renderedState\}/);
assert.match(lab, /data-axe-audit=\{axeAudit\}/);
assert.match(lab, /params\.get\("state"\)/);
assert.match(lab, /<StateAxeHarness/);
assert.doesNotMatch(lab, /type StateId|const stateOrder|const states:/);
assert.match(lab, /<option value="">Choose observed portion<\/option>/);
assert.match(lab, /aria-invalid=\{validation && !props\.meal/);
assert.match(lab, /aria-describedby=\{validation && !props\.meal/);
assert.match(lab, /aria-live="polite"/);

assert.match(stateHarness, /auditNodeId="kiddz-state-axe-audit"/);
assert.match(stateHarness, /activeRootSelector='\.state-lab\[data-axe-audit="axe"\]'/);
assert.match(territoryHarness, /auditNodeId="kiddz-territory-axe-audit"/);
assert.match(sharedHarness, /await import\("axe-core"\)/);
for (const tag of ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]) {
  assert(sharedHarness.includes(`"${tag}"`), `Shared axe harness lost ${tag}`);
}
assert.match(sharedHarness, /resultTypes: \["violations", "incomplete"\]/);
assert.match(sharedHarness, /window\.innerWidth.*window\.innerHeight/);

assert.match(stylesheet, /\.state-lab button:focus-visible/);
assert.match(stylesheet, /@media \(max-width: 900px\)/);
assert.match(stylesheet, /min-height: 44px/);
assert.match(acceptance, /## State Pattern Matrix/);
for (const label of [
  "Initial",
  "Loading",
  "Empty",
  "Partial",
  "Unknown",
  "Draft",
  "Validation error",
  "Permission denied",
  "Server failure",
  "Offline",
  "Conflict",
  "Waiting",
  "Success",
  "Corrected/reversed",
  "Closed",
]) {
  assert(acceptance.includes(`| ${label} |`), `Acceptance matrix lost ${label}`);
}

process.stdout.write(
  `Redesign state contract verification passed (${redesignStateOrder.length} states, ${redesignStateGroups.length} groups, ${redesignStateOrder.length * 4} acceptance assertions, shared axe harness)\n`,
);
