import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  brandDirections,
  directionById,
  type BrandDirectionId,
} from "../app/design-lab/brand-directions/_data";
import {
  brandDirectionEvaluations,
  evaluationCriteria,
  rankedBrandEvaluations,
} from "../app/design-lab/brand-directions/_evaluation";

const read = (path: string) => readFileSync(resolve(path), "utf8");
const expectedIds: BrandDirectionId[] = [
  "kinetic-kindness",
  "open-studio",
  "living-record",
  "bright-signal",
  "care-commons",
  "quiet-magic",
];

const program = read("docs/redesign/creative-direction-program-v2.md");
const briefs = read("docs/redesign/creative-directions-v2.md");
const oldGate = read("docs/redesign/creative-selection-gate.md");
const evaluationDossier = read("docs/redesign/brand-direction-evaluation.md");
const page = read("src/app/design-lab/brand-directions/page.tsx");
const evaluationPage = read("src/app/design-lab/brand-directions/evaluation/page.tsx");
const room = read("src/app/design-lab/brand-directions/_components/brand-direction-room.tsx");
const stylesheet = read("src/app/design-lab/brand-directions/brand-directions.css");
const evaluationStylesheet = read("src/app/design-lab/brand-directions/evaluation/evaluation.css");

assert.deepEqual(brandDirections.map((direction) => direction.id), expectedIds);
assert.equal(new Set(brandDirections.map((direction) => direction.id)).size, 6);
assert.equal(new Set(brandDirections.map((direction) => direction.number)).size, 6);
assert.equal(Object.keys(directionById).length, 6);
assert.equal(new Set(brandDirections.map((direction) => direction.thesis)).size, 6);
assert.equal(new Set(brandDirections.map((direction) => direction.motion)).size, 6);
assert(new Set(brandDirections.map((direction) => direction.typeDisplay)).size >= 5);
assert(new Set(brandDirections.map((direction) => direction.typeProduct)).size >= 5);
assert.equal(evaluationCriteria.reduce((sum, criterion) => sum + criterion.weight, 0), 100);
assert.equal(brandDirectionEvaluations.length, 6);
assert.equal(new Set(brandDirectionEvaluations.map((evaluation) => evaluation.directionId)).size, 6);
assert.equal(brandDirectionEvaluations.filter((evaluation) => evaluation.status === "advance").length, 2);
assert.equal(brandDirectionEvaluations.filter((evaluation) => evaluation.status === "challenger").length, 1);
assert.equal(brandDirectionEvaluations.filter((evaluation) => evaluation.status === "hold").length, 3);
assert.deepEqual(
  rankedBrandEvaluations.map((evaluation) => evaluation.directionId),
  ["kinetic-kindness", "living-record", "care-commons", "open-studio", "bright-signal", "quiet-magic"],
);
assert.deepEqual(rankedBrandEvaluations.map((evaluation) => evaluation.total), [90.4, 88, 85.2, 82.4, 77.6, 70]);

for (const evaluation of brandDirectionEvaluations) {
  assert.deepEqual(Object.keys(evaluation.scores).sort(), evaluationCriteria.map((criterion) => criterion.id).sort());
  for (const score of Object.values(evaluation.scores)) {
    assert(Number.isInteger(score) && score >= 1 && score <= 5, `${evaluation.directionId} score must be 1-5`);
  }
  assert(evaluation.evidence.length > 80, `${evaluation.directionId} needs concrete evidence`);
  assert(evaluation.pressure.length > 60, `${evaluation.directionId} needs a pressure test`);
  assert(evaluation.mustProve.length > 60, `${evaluation.directionId} needs a proof condition`);
}

for (const direction of brandDirections) {
  assert.equal(direction.colors.length, 6, `${direction.id} must expose six palette roles`);
  assert.equal(
    new Set(direction.colors.map((color) => color.value)).size,
    6,
    `${direction.id} repeats a palette value`,
  );
  assert.match(direction.risk, /can|if|risk/i, `${direction.id} needs an explicit failure mode`);
  assert.match(briefs, new RegExp(`## ${Number(direction.number)}\\. ${direction.name}`));
}

for (const source of [
  "Design Council",
  "Duolingo identity color",
  "Apple motion guidance",
  "WCAG 2.2",
  "Headspace design-system case study",
  "Mobbin",
]) {
  assert.match(program, new RegExp(source, "i"), `Research source missing: ${source}`);
}
assert.match(program, /Lane 1: Audience and category meaning/);
assert.match(program, /Lane 6: Stress and selection/);
assert.match(program, /no production tokens or page migration/i);
assert.match(program, /Production redesign:\*\* Paused/);

assert.match(oldGate, /Status:\*\* Superseded on 2026-07-13/);
assert.match(oldGate, /use the Daylight recommendation to set production tokens/);
assert.match(evaluationDossier, /expert heuristic/i);
assert.match(evaluationDossier, /substitute for operator comprehension testing/i);
assert.match(evaluationDossier, /distinctive-asset potential/i);
assert.match(evaluationDossier, /Kinetic Kindness[\s\S]*90\.4/);
assert.match(evaluationDossier, /Living Record[\s\S]*88\.0/);
assert.match(evaluationDossier, /No production winner is selected/);
for (const app of ["Headspace", "Duolingo", "Revolut", "Notion", "Vercel", "Cosmos"]) {
  assert.match(evaluationDossier, new RegExp(app), `Evaluation benchmark missing: ${app}`);
}

assert.match(page, /searchParams: Promise/);
assert.match(page, /initialDirection=\{initialDirection\}/);
assert.match(page, /axeAuditEnabled=\{params\.audit === "axe"\}/);
assert.match(room, /data-axe-audit=\{axeAuditEnabled \? "axe" : undefined\}/);
assert.match(room, /data-motion-run=\{motionRun\}/);
assert.match(room, /Controlled product proof/);
assert.match(room, /Accident report needs manager review/);
assert.match(room, /Safe now\. Two things need handling before lunch/);
assert.match(room, /brand-directions\/evaluation/);
assert.doesNotMatch(room, /chart|recharts/i);
assert.match(evaluationPage, /Seven weighted criteria/);
assert.match(evaluationPage, /No production winner is selected/);
assert.match(evaluationPage, /data-axe-audit=\{axeAuditEnabled \? "axe" : undefined\}/);
assert.match(evaluationPage, /rankedBrandEvaluations\.map/);

assert.match(stylesheet, /@media \(max-width: 760px\)/);
assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(stylesheet, /@media \(forced-colors: active\)/);
assert.match(stylesheet, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
assert.doesNotMatch(stylesheet, /linear-gradient|radial-gradient/);
assert.doesNotMatch(stylesheet, /border-left:\s*(?:2px|3px|[1-9][0-9]+px)\s+solid\s+(?:var\(--accent\)|#[0-9a-f]{3,8})/i);
assert.match(evaluationStylesheet, /@media \(max-width: 700px\)/);
assert.match(evaluationStylesheet, /\.evaluation-table-wrap \{ overflow: visible; \}/);
assert.match(evaluationStylesheet, /@media \(forced-colors: active\)/);
assert.doesNotMatch(evaluationStylesheet, /linear-gradient|radial-gradient/);

process.stdout.write(
  `Brand direction program verification passed (${brandDirections.length} systems, ${evaluationCriteria.length} weighted criteria, two finalists, no production selection)\n`,
);
