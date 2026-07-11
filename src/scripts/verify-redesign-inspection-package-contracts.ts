import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  acceptInspectionException,
  approveInspectionRedaction,
  completeInspectionGeneration,
  createDatabaseBackupFixture,
  createInspectionPackageFixture,
  createInspectionProfileFixture,
  createInspectionScenario,
  inspectionPackageStatus,
  isInspectionPackageArtifact,
  markInspectionSourceChanged,
  projectInspectionPackage,
  recordInspectionDownload,
  regenerateInspectionAccess,
  replaceInspectionEvidence,
  retryInspectionGeneration,
  selectInspectionProfile,
  startInspectionGeneration,
  type InspectionCapability,
  type InspectionCommand,
  type InspectionPackage,
} from "../lib/redesign-inspection-package-contracts"

const allCapabilities: InspectionCapability[] = [
  "inspection.preflight",
  "inspection.view_sensitive",
  "inspection.contribute",
  "inspection.accept_exception",
  "inspection.generate",
  "inspection.download",
  "inspection.audit",
]

function command(inspectionPackage: InspectionPackage, id: string, capabilities = allCapabilities): InspectionCommand {
  return {
    eventId: `${id}-${inspectionPackage.revision}`,
    idempotencyKey: `${id}-${inspectionPackage.revision}-once`,
    actorId: "verifier-manager",
    occurredAt: "2026-07-15T10:05:00+01:00",
    expectedRevision: inspectionPackage.revision,
    actorCapabilities: capabilities,
  }
}

assert.equal(inspectionPackageStatus(createInspectionPackageFixture()), "PROFILE_REQUIRED")
assert.equal(inspectionPackageStatus(createInspectionScenario("blocked")), "BLOCKED")
assert.equal(inspectionPackageStatus(createInspectionScenario("exception-review")), "EXCEPTION_REVIEW")
assert.equal(inspectionPackageStatus(createInspectionScenario("redaction-review")), "REDACTION_REVIEW")
assert.equal(inspectionPackageStatus(createInspectionScenario("ready")), "READY")
assert.equal(inspectionPackageStatus(createInspectionScenario("generating")), "GENERATING")
assert.equal(inspectionPackageStatus(createInspectionScenario("generation-failed")), "GENERATION_FAILED")
assert.equal(inspectionPackageStatus(createInspectionScenario("retrying")), "GENERATING")
assert.equal(inspectionPackageStatus(createInspectionScenario("ready-download")), "READY_TO_DOWNLOAD")
assert.equal(inspectionPackageStatus(createInspectionScenario("link-expired")), "LINK_EXPIRED")
assert.equal(inspectionPackageStatus(createInspectionScenario("historical")), "HISTORICAL")

assert.equal(isInspectionPackageArtifact(createDatabaseBackupFixture()), false)
assert.equal(isInspectionPackageArtifact(createInspectionScenario("ready-download").artifact!), true)

const contributorProjection = projectInspectionPackage(
  createInspectionScenario("redaction-review"),
  ["inspection.preflight", "inspection.contribute"],
)
const hiddenMedical = contributorProjection.evidence.find((item) => item.id === "evidence-medical")
assert.equal(hiddenMedical?.title, "Restricted evidence")
assert.equal(hiddenMedical?.sourceRef, undefined)
assert.equal(hiddenMedical?.owner, "Restricted owner")
assert.equal(contributorProjection.canGenerate, false)

const ready = createInspectionScenario("ready")
assert.throws(
  () => startInspectionGeneration(ready, { ...command(ready, "forbidden", ["inspection.preflight"]), jobId: "job-forbidden", expectedManifestRevision: ready.revision }),
  /Missing capability: inspection.generate/,
)
assert.throws(
  () => startInspectionGeneration(createInspectionScenario("blocked"), {
    ...command(createInspectionScenario("blocked"), "blocked-start"),
    jobId: "job-blocked",
    expectedManifestRevision: createInspectionScenario("blocked").revision,
  }),
  /preflight is not ready/,
)

let selected = createInspectionPackageFixture()
const select = {
  ...command(selected, "profile"),
  profile: createInspectionProfileFixture(),
}
selected = selectInspectionProfile(selected, select)
assert.equal(selectInspectionProfile(selected, select), selected)
assert.throws(
  () => selectInspectionProfile(selected, { ...select, profile: { ...select.profile, version: 4 } }),
  /Idempotency key reused with different input/,
)
assert.throws(
  () => replaceInspectionEvidence(selected, {
    ...command(selected, "stale-evidence"),
    evidenceId: "evidence-staff-training",
    expectedSourceRevision: 2,
  }),
  /source revision changed/,
)

const exceptionReview = createInspectionScenario("exception-review")
assert.throws(
  () => acceptInspectionException(exceptionReview, {
    ...command(exceptionReview, "empty-exception"),
    requirementId: "finance-summary",
    evidenceId: "evidence-finance",
    expectedSourceRevision: 7,
    authority: "",
    reason: "",
  }),
  /authority and reason are required/,
)

const redactionReview = createInspectionScenario("redaction-review")
assert.throws(
  () => approveInspectionRedaction(redactionReview, {
    ...command(redactionReview, "empty-redaction"),
    evidenceId: "evidence-medical",
    expectedSourceRevision: 9,
    fields: [],
    reason: "",
  }),
  /fields and reason are required/,
)

const failed = createInspectionScenario("generation-failed")
assert.equal(failed.job?.manifestRevision, createInspectionScenario("generating").job?.manifestRevision)
assert.throws(
  () => retryInspectionGeneration(failed, {
    ...command(failed, "stale-retry"),
    jobId: "job-retry",
    expectedManifestRevision: (failed.job?.manifestRevision ?? 0) + 1,
  }),
  /failed job manifest revision/,
)

const generating = createInspectionScenario("generating")
assert.throws(
  () => completeInspectionGeneration(generating, {
    ...command(generating, "bad-checksum"),
    jobId: generating.job!.id,
    artifactId: "artifact-bad",
    manifestChecksum: "not-a-checksum",
    artifactChecksum: "not-a-checksum",
    grantId: "grant-bad",
    expiresAt: "2026-07-16T10:05:00+01:00",
  }),
  /SHA-256/,
)

const expired = createInspectionScenario("link-expired")
const expiredGrant = expired.grants[0]
assert.throws(
  () => recordInspectionDownload(expired, {
    ...command(expired, "expired-download"),
    artifactId: expired.artifact!.id,
    grantId: expiredGrant.id,
  }),
  /grant expired/,
)
const refreshed = regenerateInspectionAccess(expired, {
  ...command(expired, "refresh-access"),
  grantId: "grant-refreshed",
  expiresAt: "2026-07-17T10:05:00+01:00",
})
assert.equal(inspectionPackageStatus(refreshed), "READY_TO_DOWNLOAD")
const downloaded = recordInspectionDownload(refreshed, {
  ...command(refreshed, "download"),
  artifactId: refreshed.artifact!.id,
  grantId: "grant-refreshed",
})
assert.equal(downloaded.events.at(-1)?.kind, "PACKAGE_DOWNLOADED")

const generated = createInspectionScenario("ready-download")
assert.throws(
  () => markInspectionSourceChanged(generated, {
    ...command(generated, "non-advance"),
    evidenceId: "evidence-attendance",
    nextSourceRevision: 12,
  }),
  /must advance/,
)

const exportPage = readFileSync(resolve("src/app/(app)/settings/export/page.tsx"), "utf8")
const sqlRoute = readFileSync(resolve("src/app/(app)/exportdb.php/route.ts"), "utf8")
const schema = readFileSync(resolve("prisma/schema.prisma"), "utf8")
const contractDocument = readFileSync(resolve("docs/redesign/inspection-package-contract.md"), "utf8")
assert.match(exportPage, /new Blob/)
assert.match(exportPage, /Full SQL Backup/)
assert.match(sqlRoute, /application\/sql/)
assert.doesNotMatch(schema, /model InspectionPackage/)
assert.match(contractDocument, /DATABASE_BACKUP.*never accepted as `INSPECTION_PACKAGE`/)
assert.match(contractDocument, /## Additive Production Migration/)

const labSource = readFileSync(resolve("src/app/design-lab/inspection/_components/inspection-lab.tsx"), "utf8")
const labStyles = readFileSync(resolve("src/app/design-lab/inspection/inspection.css"), "utf8")
const harnessSource = readFileSync(resolve("src/app/design-lab/inspection/_components/inspection-axe-harness.tsx"), "utf8")
assert.match(labSource, /projectInspectionPackage/)
assert.match(labSource, /aria-live="polite"/)
assert.doesNotMatch(labSource, /localStorage|sessionStorage|recharts|<svg/)
assert.match(labStyles, /@media \(max-width: 480px\)/)
assert.match(labStyles, /min-height: 48px/)
assert.doesNotMatch(labStyles, /gradient\(/)
assert.match(harnessSource, /auditNodeId="kiddz-inspection-axe-audit"/)

process.stdout.write(
  "Redesign inspection package verification passed (policy profile, preflight, no-leak projection, exception, redaction, retry, checksums, expiry, audit, historical state, SQL-backup distinction)\n",
)
