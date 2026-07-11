import assert from "node:assert/strict"

import {
  applySharedCareObservation,
  attemptDailyCareDelivery,
  capabilitiesForDailyCareRole,
  confirmDailyCareSources,
  createDailyCareFixture,
  deriveDailyCareStatus,
  missingRequiredCareFields,
  prepareSharedCareObservation,
  projectDailyCareChildren,
  projectDailyCareForRole,
  publishDailyCareCorrection,
  queueOfflineCareObservation,
  recordCareException,
  recordDailyCareSyncConflict,
  refreshDailyCareSources,
  resolveDailyCareSyncConflict,
  saveDailyCareDrafts,
  startDailyCareCorrection,
  submitDailyCareReports,
  type CareObservation,
  type DailyCareCommand,
  type DailyCareSession,
} from "../lib/redesign-daily-care-contracts"

function command(
  session: DailyCareSession,
  key: string,
  occurredAt = "2026-08-05T16:00:00.000Z",
): DailyCareCommand {
  return {
    eventId: `verify-event-${key}`,
    idempotencyKey: `verify-care-${key}`,
    actorId: "verify-practitioner",
    occurredAt,
    expectedRevision: session.revision,
    actorCapabilities: capabilitiesForDailyCareRole("manager"),
  }
}

function conflictObservation(
  id: string,
  value: string,
  sourceRevision: number,
): CareObservation {
  return {
    id,
    childId: "child-noah",
    fieldId: "mood",
    value,
    provenance: "EXCEPTION",
    sharedObservationId: "shared-event-prepare-shared",
    observedBy: id.includes("server") ? "server-author" : "local-author",
    observedAt: "2026-08-05T14:20:00.000Z",
    sourceRevision,
  }
}

const stages = [
  ["source-gap", "SOURCE_GAP"],
  ["empty-capture", "EMPTY_CAPTURE"],
  ["shared-review", "SHARED_REVIEW"],
  ["exception-review", "EXCEPTION_REVIEW"],
  ["draft-saved", "DRAFT_SAVED"],
  ["sync-conflict", "SYNC_CONFLICT"],
  ["submission-blocked", "SUBMISSION_BLOCKED"],
  ["submitted", "SUBMITTED"],
  ["delivery-failed", "DELIVERY_FAILED"],
  ["delivered", "DELIVERED"],
  ["correction-review", "CORRECTION_REVIEW"],
  ["corrected", "CORRECTED"],
] as const

for (const [stage, expected] of stages) {
  assert.equal(
    deriveDailyCareStatus(createDailyCareFixture(stage)),
    expected,
    `${stage} must derive ${expected}`,
  )
}

const sourceGap = createDailyCareFixture("source-gap")
assert.equal(sourceGap.observations.length, 0)
assert.equal(sourceGap.reports.length, 0)
assert.equal(sourceGap.selectedChildIds.length, 0)
assert.throws(
  () =>
    confirmDailyCareSources(sourceGap, {
      ...command(sourceGap, "partial-sources"),
      sources: [{ sourceId: "unrelated", revision: 1 }],
    }),
  /Every required daily care source must be confirmed/,
)
assert.throws(
  () =>
    confirmDailyCareSources(sourceGap, {
      ...command(sourceGap, "source-regression"),
      sources: [{ sourceId: "room-roster", revision: 5 }],
    }),
  /cannot regress/,
)

const empty = createDailyCareFixture("empty-capture")
assert.equal(empty.sourcesTrusted, true)
assert.equal(empty.sourceSnapshot.length, 4)
assert.ok(empty.fieldDefinitions.every((definition) =>
  !empty.observations.some((observation) => observation.fieldId === definition.id),
))
assert.throws(
  () =>
    prepareSharedCareObservation(empty, {
      ...command(empty, "select-absent"),
      selectedChildIds: ["child-sami"],
      values: { mood: "CALM" },
    }),
  /no confirmed present attendance event/,
)
assert.throws(
  () =>
    prepareSharedCareObservation(empty, {
      ...command(empty, "select-unknown"),
      selectedChildIds: ["child-zoe"],
      values: { mood: "CALM" },
    }),
  /no confirmed present attendance event/,
)

const prepareCommand = {
  ...command(empty, "prepare"),
  selectedChildIds: ["child-amelie", "child-noah", "child-lina"],
  values: {
    breakfastPortion: "HALF",
    lunchPortion: "MOST",
    mood: "CALM",
    symptoms: "NONE_OBSERVED",
  },
}
const prepared = prepareSharedCareObservation(empty, prepareCommand)
assert.deepEqual(prepared.selectedChildIds, ["child-amelie", "child-noah", "child-lina"])
assert.equal(prepared.observations.length, 0)
assert.deepEqual(prepareSharedCareObservation(prepared, prepareCommand), prepared)
assert.throws(
  () => prepareSharedCareObservation(prepared, { ...prepareCommand, values: { mood: "HAPPY" } }),
  /Idempotency key reused/,
)

const shared = createDailyCareFixture("exception-review")
assert.equal(shared.observations.length, 12)
assert.equal(shared.observations.filter((entry) => entry.childId === "child-sami").length, 0)
assert.equal(shared.observations.filter((entry) => entry.childId === "child-zoe").length, 0)
assert.ok(shared.observations.every((entry) => entry.provenance === "SHARED"))
assert.equal(shared.reports.length, 0)

const exceptionCommand = {
  ...command(shared, "exception"),
  childId: "child-noah",
  fieldId: "lunchPortion",
  value: "LITTLE",
}
const exception = recordCareException(shared, exceptionCommand)
assert.equal(exception.observations.length, 13)
assert.equal(
  exception.observations.filter((entry) => entry.childId === "child-noah" && entry.fieldId === "mood").length,
  1,
)
assert.equal(exception.observations.at(-1)?.provenance, "EXCEPTION")
assert.equal(exception.observations.at(-1)?.value, "LITTLE")

const draftCommand = command(exception, "save-drafts")
const drafts = saveDailyCareDrafts(exception, draftCommand)
assert.equal(drafts.reports.length, 3)
assert.ok(drafts.reports.every((report) => report.status === "DRAFT"))
assert.ok(drafts.reports.every((report) => report.currentRevision === 1))
assert.ok(drafts.reports.every((report) => missingRequiredCareFields(drafts, report.childId).length === 0))
assert.equal(projectDailyCareChildren(drafts).find((child) => child.childId === "child-sami")?.reportStatus, "NOT_STARTED")
assert.equal(projectDailyCareChildren(drafts).find((child) => child.childId === "child-amelie")?.reportStatus, "DRAFT")
assert.deepEqual(saveDailyCareDrafts(drafts, draftCommand), drafts)

const offlineCommand = {
  ...command(drafts, "offline-mood"),
  childId: "child-amelie",
  fieldId: "mood",
  value: "HAPPY",
}
const offlineQueued = queueOfflineCareObservation(drafts, offlineCommand)
assert.equal(offlineQueued.offlineQueue.length, 1)
assert.equal(offlineQueued.offlineQueue[0].state, "QUEUED")
assert.equal(offlineQueued.reports[0].status, "DRAFT")
assert.throws(
  () =>
    queueOfflineCareObservation(drafts, {
      ...command(drafts, "offline-health"),
      childId: "child-amelie",
      fieldId: "symptoms",
      value: "NONE_OBSERVED",
    }),
  /not approved for offline storage/,
)

const conflictCommand = {
  ...command(drafts, "conflict"),
  reportId: "report-child-noah",
  serverObservation: conflictObservation("server-mood", "CALM", 9),
  localObservation: conflictObservation("local-mood", "FUSSY", 10),
  changedSource: { sourceId: "attendance-stream", revision: 8 },
}
const conflicted = recordDailyCareSyncConflict(drafts, conflictCommand)
assert.equal(conflicted.conflicts[0].status, "OPEN")
assert.equal(deriveDailyCareStatus(conflicted), "SYNC_CONFLICT")
assert.deepEqual(recordDailyCareSyncConflict(conflicted, conflictCommand), conflicted)

const resolutionCommand = {
  ...command(conflicted, "resolve"),
  conflictId: conflicted.conflicts[0].id,
  resolution: "LOCAL" as const,
}
const resolved = resolveDailyCareSyncConflict(conflicted, resolutionCommand)
assert.equal(resolved.conflicts[0].status, "RESOLVED")
assert.equal(resolved.sourceChanged, true)
assert.equal(deriveDailyCareStatus(resolved), "SUBMISSION_BLOCKED")
const resolvedNoah = resolved.reports.find((report) => report.childId === "child-noah")!
const resolvedRevision = resolvedNoah.revisions.find((revision) => revision.revision === resolvedNoah.currentRevision)!
assert.equal(resolvedRevision.observations.find((entry) => entry.fieldId === "mood")?.value, "FUSSY")
assert.equal(
  resolvedRevision.observations
    .filter((entry) => entry.fieldId === "lunchPortion")
    .sort((first, second) => second.sourceRevision - first.sourceRevision)[0]?.value,
  "LITTLE",
)
assert.throws(
  () =>
    submitDailyCareReports(resolved, {
      ...command(resolved, "stale-submit"),
      reportIds: resolved.reports.map((report) => report.id),
    }),
  /refresh before accepting work/,
)
assert.throws(
  () =>
    recordCareException(resolved, {
      ...command(resolved, "stale-record"),
      childId: "child-noah",
      fieldId: "mood",
      value: "HAPPY",
    }),
  /refresh before accepting work/,
)
assert.throws(
  () =>
    refreshDailyCareSources(resolved, {
      ...command(resolved, "partial-refresh"),
      sources: resolved.sourceSnapshot.filter(
        (source) => source.sourceId !== "attendance-stream",
      ),
    }),
  /Refresh omitted source: attendance-stream/,
)
assert.throws(
  () =>
    refreshDailyCareSources(resolved, {
      ...command(resolved, "regressing-refresh"),
      sources: [
        { sourceId: "room-roster", revision: 5 },
        { sourceId: "attendance-stream", revision: 8 },
        { sourceId: "care-policy", revision: 4 },
        { sourceId: "approval-policy", revision: 3 },
      ],
    }),
  /cannot regress/,
)
const refreshCommand = {
  ...command(resolved, "refresh"),
  sources: [
    { sourceId: "room-roster", revision: 6 },
    { sourceId: "attendance-stream", revision: 8 },
    { sourceId: "care-policy", revision: 4 },
    { sourceId: "approval-policy", revision: 3 },
  ],
}
const refreshed = refreshDailyCareSources(resolved, refreshCommand)
assert.equal(refreshed.sourceChanged, false)
assert.equal(refreshed.sourceSnapshot.length, 4)
assert.deepEqual(refreshDailyCareSources(refreshed, refreshCommand), refreshed)

const brokenNoah = refreshed.reports.find((report) => report.childId === "child-noah")!
const brokenSession: DailyCareSession = {
  ...refreshed,
  reports: refreshed.reports.map((report) => {
    if (report.id !== brokenNoah.id) return report
    return {
      ...report,
      revisions: report.revisions.map((revision) =>
        revision.revision === report.currentRevision
          ? { ...revision, observations: revision.observations.filter((entry) => entry.fieldId !== "mood") }
          : revision,
      ),
    }
  }),
}
assert.throws(
  () =>
    submitDailyCareReports(brokenSession, {
      ...command(brokenSession, "blocked-submit"),
      reportIds: brokenSession.reports.map((report) => report.id),
    }),
  /Submission blocked: Noah R\.: mood/,
)
assert.ok(brokenSession.reports.every((report) => report.status === "DRAFT"))

const submitCommand = {
  ...command(refreshed, "submit"),
  reportIds: refreshed.reports.map((report) => report.id),
}
const submitted = submitDailyCareReports(refreshed, submitCommand)
assert.equal(submitted.reports.filter((report) => report.status === "SUBMITTED").length, 3)
assert.equal(submitted.deliveries.length, 3)
assert.ok(submitted.deliveries.every((delivery) => delivery.status === "PENDING"))
assert.equal(projectDailyCareForRole(submitted, "parent").publications.length, 0)
assert.deepEqual(submitDailyCareReports(submitted, submitCommand), submitted)

const failedCommand = {
  ...command(submitted, "delivery-fail"),
  succeed: false,
  errorCode: "PROVIDER_UNAVAILABLE",
}
const failed = attemptDailyCareDelivery(submitted, failedCommand)
assert.equal(deriveDailyCareStatus(failed), "DELIVERY_FAILED")
assert.ok(failed.deliveries.every((delivery) => delivery.status === "FAILED"))
assert.equal(projectDailyCareForRole(failed, "parent").publications.length, 0)
assert.deepEqual(attemptDailyCareDelivery(failed, failedCommand), failed)

const delivered = attemptDailyCareDelivery(failed, {
  ...command(failed, "delivery-retry"),
  succeed: true,
})
assert.equal(deriveDailyCareStatus(delivered), "DELIVERED")
assert.ok(delivered.deliveries.every((delivery) => delivery.status === "DELIVERED"))
const parentProjection = projectDailyCareForRole(delivered, "parent")
assert.deepEqual(parentProjection.children.map((child) => child.id), ["child-amelie"])
assert.equal(parentProjection.publications.length, 1)
assert.equal(parentProjection.publications[0].childDisplayName, "Amelie D.")
assert.ok(parentProjection.publications[0].observations.every((entry) => entry.fieldId !== "internalHandover"))
assert.equal(parentProjection.events.length, 0)
assert.equal(parentProjection.deliveries.length, 0)
assert.equal(parentProjection.conflicts.length, 0)

const practitionerProjection = projectDailyCareForRole(delivered, "practitioner")
assert.equal(practitionerProjection.events.length, 0)
assert.ok(practitionerProjection.deliveries.every((delivery) => !("parentAccountId" in delivery)))
const managerProjection = projectDailyCareForRole(delivered, "manager")
assert.equal(managerProjection.events.length, delivered.events.length)
assert.ok(managerProjection.deliveries.every((delivery) => "parentAccountId" in delivery))

const correctionCommand = {
  ...command(delivered, "correction"),
  reportId: "report-child-noah",
  reason: "Lunch portion confirmed after handover",
  fieldId: "lunchPortion",
  value: "HALF",
}
const correctionReview = startDailyCareCorrection(delivered, correctionCommand)
const correction = correctionReview.corrections.at(-1)!
const reportBeforeCorrection = correctionReview.reports.find((report) => report.id === correction.reportId)!
const priorRevisionCount = reportBeforeCorrection.revisions.length
const corrected = publishDailyCareCorrection(correctionReview, {
  ...command(correctionReview, "publish-correction"),
  correctionId: correction.id,
})
const correctedReport = corrected.reports.find((report) => report.id === correction.reportId)!
assert.equal(correctedReport.revisions.length, priorRevisionCount + 1)
assert.equal(correctedReport.revisions.at(-1)?.kind, "CORRECTION")
assert.equal(correctedReport.revisions.at(-1)?.correctsRevision, correction.baseRevision)
assert.equal(correctedReport.revisions.at(-1)?.correctionReason, correction.reason)
assert.equal(corrected.deliveries.at(-1)?.status, "PENDING")
assert.equal(corrected.deliveries.at(-1)?.reportRevision, correctedReport.currentRevision)
assert.equal(projectDailyCareForRole(corrected, "parent").publications[0].reportRevision, 2)

const unauthorized = {
  ...command(empty, "unauthorized"),
  actorCapabilities: capabilitiesForDailyCareRole("parent"),
  selectedChildIds: ["child-amelie"],
  values: { mood: "CALM" },
}
assert.throws(
  () => prepareSharedCareObservation(empty, unauthorized),
  /Missing capability: care.record/,
)

const sharedReview = createDailyCareFixture("shared-review")
const applyCommand = {
  ...command(sharedReview, "apply"),
  sharedObservationId: sharedReview.pendingShared!.id,
}
const applied = applySharedCareObservation(sharedReview, applyCommand)
assert.deepEqual(applySharedCareObservation(applied, applyCommand), applied)

const correctionReviewFixture = createDailyCareFixture("correction-review")
const publishCommand = {
  ...command(correctionReviewFixture, "publish"),
  correctionId: correctionReviewFixture.corrections.at(-1)!.id,
}
const published = publishDailyCareCorrection(correctionReviewFixture, publishCommand)
assert.deepEqual(publishDailyCareCorrection(published, publishCommand), published)

console.log("Daily care redesign contracts verified")
