import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  territoryDecisionEvidence,
  territoryMeta,
  territoryScoreCriteria,
  type TerritoryId,
} from "../app/design-lab/territories/_data";

const read = (path: string) => readFileSync(resolve(path), "utf8");
const territoryIds = Object.keys(territoryMeta) as TerritoryId[];
const page = read("src/app/design-lab/territories/page.tsx");
const stylesheet = read("src/app/design-lab/territories/territories.css");
const evaluation = read("docs/redesign/territory-evaluation.md");

assert.deepEqual(territoryIds, ["daylight", "signal", "carebook"]);
assert.equal(new Set(territoryIds.map((id) => territoryDecisionEvidence[id].rank)).size, 3);
assert.deepEqual(
  [...territoryIds].sort(
    (left, right) => territoryDecisionEvidence[left].rank - territoryDecisionEvidence[right].rank,
  ),
  ["daylight", "carebook", "signal"],
);
assert.deepEqual(
  territoryIds.filter((id) => territoryDecisionEvidence[id].recommended),
  ["daylight"],
);
assert.equal(territoryScoreCriteria.reduce((sum, criterion) => sum + criterion.weight, 0), 100);
assert.equal(new Set(territoryScoreCriteria.map((criterion) => criterion.id)).size, 7);

for (const id of territoryIds) {
  const weightedTotal = territoryScoreCriteria.reduce(
    (sum, criterion) => sum + (criterion.scores[id] / 5) * criterion.weight,
    0,
  );
  assert.equal(
    Number(weightedTotal.toFixed(1)),
    territoryDecisionEvidence[id].total,
    `${id} weighted score drifted`,
  );

  const screenshot = resolve(`docs/redesign/territories/${id}-today-desktop.png`);
  assert(existsSync(screenshot), `${id} comparison screenshot is missing`);
  assert(statSync(screenshot).size > 30_000, `${id} comparison screenshot is unexpectedly small`);
}

const accessibility = territoryScoreCriteria.find((criterion) => criterion.id === "accessibility");
assert(accessibility);
assert(accessibility.scores.daylight >= 4);
assert(accessibility.scores.signal >= 4);
assert(accessibility.scores.carebook < 4, "Carebook's original failed score must remain honest");
assert.match(territoryDecisionEvidence.carebook.scoreNote ?? "", /accessibility remediation/i);

assert.match(page, /import Image from "next\/image"/);
assert.match(page, /loading="eager"/);
assert.doesNotMatch(page, /priority=\{/);
for (const id of territoryIds) {
  assert.match(page, new RegExp(`${id}-today-desktop\\.png`));
}
assert.match(page, /Advance Daylight/);
assert.match(page, /No production direction is selected/);
assert.match(page, /href=\{`\/design-lab\/territories\/\$\{id\}`\}/);
assert.doesNotMatch(page, /"use client"|selectedTerritory|setSelectedTerritory/);

assert.match(stylesheet, /@media \(max-width: 680px\)/);
assert.match(stylesheet, /territory-scorecard__scroll:focus-visible/);
assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(stylesheet, /@media \(forced-colors: active\)/);

assert.match(evaluation, /\| \*\*Weighted total\*\* \| \*\*100%\*\* \| \*\*89\.9\*\* \| \*\*86\.8\*\* \| \*\*87\.0 pre-fix\*\* \|/);
assert.match(evaluation, /Advance \*\*Daylight\*\* as the leading foundation/);
assert.match(evaluation, /User selection of the production direction: \*\*open and irreversible\*\*/);

process.stdout.write(
  `Territory selection verification passed (${territoryIds.length} territories, ${territoryScoreCriteria.length} weighted criteria, one recommendation, no production selection)\n`,
);
