import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  finalistDefinitions,
  finalistIds,
  incidentFixture,
  operationsFixture,
  parentFixture,
} from "../app/design-lab/brand-directions/_finalist-data";

const read = (path: string) => readFileSync(resolve(path), "utf8");
const page = read("src/app/design-lab/brand-directions/finalists/page.tsx");
const room = read("src/app/design-lab/brand-directions/finalists/_components/finalist-proof-room.tsx");
const stylesheet = read("src/app/design-lab/brand-directions/finalists/finalists.css");
const dossier = read("docs/redesign/finalist-proof-round.md");
const liveOperations = read("docs/redesign/live-operations-contract.md");
const medicalContract = read("src/lib/redesign-medical-incident-contracts.ts");
const dailyCareContract = read("src/lib/redesign-daily-care-contracts.ts");

assert.deepEqual(finalistIds, ["kinetic-kindness", "living-record"]);
assert.equal(Object.keys(finalistDefinitions).length, 2);
assert.notEqual(finalistDefinitions[finalistIds[0]].proofQuestion, finalistDefinitions[finalistIds[1]].proofQuestion);
assert.equal(operationsFixture.rooms.length, 4);
assert.equal(operationsFixture.totals.length, 3);
assert.equal(incidentFixture.evidence.length, 3);
assert.equal(incidentFixture.timeline.length, 3);
assert.equal(parentFixture.observations.length, 4);
assert.equal(parentFixture.privacy, "Internal handover notes and staff-only provenance are excluded.");

assert.match(liveOperations, /Lina's 12:30 break produces one forecast cover item/);
assert.match(liveOperations, /Assigning Sam from 12:30 to 13:00 appends assignment provenance/);
assert.match(medicalContract, new RegExp(incidentFixture.cause));
assert.match(medicalContract, new RegExp(incidentFixture.firstAid));
assert.match(medicalContract, /water-play-area\.jpg/);
assert.match(dailyCareContract, new RegExp(`displayName: "${parentFixture.child}"`));
assert.match(dailyCareContract, /fieldId: "lunchPortion"[\s\S]*value: "LITTLE"/);

assert.match(page, /searchParams: Promise/);
assert.match(page, /axeAuditEnabled=\{params\.audit === "axe"\}/);
assert.match(page, /initialFinalist=\{initialFinalist\}/);
assert.match(room, /data-finalist=\{activeId\}/);
assert.match(room, /data-axe-audit=\{axeAuditEnabled \? "axe" : undefined\}/);
assert.match(room, /from "motion\/react"/);
assert.match(room, /finalist-proof--operations/);
assert.match(room, /finalist-proof--incident/);
assert.match(room, /finalist-proof--parent/);
assert.match(room, /Manager review note/);
assert.match(room, /Approve and prepare delivery/);
assert.match(room, /Parent acknowledgment remains pending/);
assert.match(room, /parentFixture\.privacy/);
assert.doesNotMatch(room, /chart|recharts/i);

assert.match(dossier, /Kinetic Kindness remains the research lead/);
assert.match(dossier, /This recommendation is not the production brand lock/);
assert.match(dossier, /same DOM hierarchy and source content/);
assert.match(dossier, /axe reports zero violations and zero incomplete findings/);
assert.match(dossier, /The irreversible brand selection[\s\S]*remain open/);

assert.match(stylesheet, /@media \(max-width: 760px\)/);
assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(stylesheet, /@media \(forced-colors: active\)/);
assert.doesNotMatch(stylesheet, /linear-gradient|radial-gradient/);
assert.doesNotMatch(stylesheet, /border-left:\s*(?:2px|3px|[1-9][0-9]+px)\s+solid\s+(?:var\(--finalist-accent\)|#[0-9a-f]{3,8})/i);

process.stdout.write(
  `Finalist proof verification passed (${finalistIds.length} finalists, 3 shared surfaces, no production selection)\n`,
);
