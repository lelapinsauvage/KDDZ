import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  acknowledgeIncidentAsParent,
  closeMedicalIncident,
  completeIncidentDraft,
  completeIncidentFollowUp,
  completeIncidentReview,
  correctMedicalIncident,
  createMedicalIncidentFixture,
  createMedicalIncidentScenario,
  projectMedicalIncident,
  recordParentDelivery,
  retryIncidentEvidence,
  submitMedicalIncident,
  type IncidentCapability,
} from "../lib/redesign-medical-incident-contracts"

const capabilities: IncidentCapability[] = [
  "incident.draft",
  "incident.submit",
  "incident.manager_review",
  "incident.clinical_review",
  "incident.notify_parent",
  "incident.acknowledge_parent",
  "incident.follow_up",
  "incident.close",
  "incident.correct",
]

function base(revision: number, id: string, actorId = "manager-maya") {
  return {
    eventId: id,
    idempotencyKey: `${id}-once`,
    actorId,
    occurredAt: "2026-07-14T10:30:00+01:00",
    expectedRevision: revision,
    actorCapabilities: capabilities,
  }
}

const initial = createMedicalIncidentFixture()
assert.equal(projectMedicalIncident(initial).status, "DRAFT_INCOMPLETE")
assert.equal(projectMedicalIncident(initial).gaps[0], "witnessNotes")
assert.equal(projectMedicalIncident(initial).evidenceFailures.length, 1)
assert.throws(() => submitMedicalIncident(initial, base(0, "submit-too-soon")), /facts incomplete/)

let incident = completeIncidentDraft(initial, {
  ...base(0, "complete-witness", "staff-lina"),
  witnessNotes: "Observed Alma step backward onto water beside the table.",
})
assert.equal(incident.facts.cause, initial.facts.cause, "Draft completion must retain entered facts")
assert.equal(projectMedicalIncident(incident).status, "DRAFT_INCOMPLETE")
incident = retryIncidentEvidence(incident, {
  ...base(1, "retry-evidence", "staff-lina"),
  evidenceId: "evidence-photo-1",
})
assert.equal(projectMedicalIncident(incident).status, "DRAFT_READY")

const submitted = submitMedicalIncident(incident, base(2, "submit-incident", "staff-lina"))
assert.equal(projectMedicalIncident(submitted).status, "REVIEW_REQUIRED")
assert.equal(submitted.obligations.length, 5)
assert.equal(submitMedicalIncident(submitted, base(2, "submit-incident", "staff-lina")), submitted)
assert.throws(
  () => submitMedicalIncident(submitted, { ...base(2, "different-event"), idempotencyKey: "submit-incident-once" }),
  /reused with different input/,
)

const managerReview = submitted.obligations.find((item) => item.kind === "MANAGER_REVIEW")!
const managerReviewed = completeIncidentReview(submitted, {
  ...base(submitted.revision, "manager-review"),
  obligationId: managerReview.id,
  expectedObligationRevision: managerReview.sourceRevision,
})
const clinicalReview = managerReviewed.obligations.find((item) => item.kind === "CLINICAL_REVIEW")!
const reviewed = completeIncidentReview(managerReviewed, {
  ...base(managerReviewed.revision, "clinical-review", "nurse-ines"),
  obligationId: clinicalReview.id,
  expectedObligationRevision: clinicalReview.sourceRevision,
})
assert.equal(projectMedicalIncident(reviewed).status, "PARENT_DELIVERY_PENDING")

const delivery = reviewed.obligations.find((item) => item.kind === "PARENT_DELIVERY")!
const deliveryFailed = recordParentDelivery(reviewed, {
  ...base(reviewed.revision, "delivery-failed"),
  obligationId: delivery.id,
  expectedObligationRevision: delivery.sourceRevision,
  outcome: "FAILED",
  failureReason: "Push provider timed out",
})
assert.equal(projectMedicalIncident(deliveryFailed).status, "DELIVERY_FAILED")
assert.match(deliveryFailed.obligations.find((item) => item.id === delivery.id)?.failure?.retryWorkItemId ?? "", /retry-/)
assert.equal(deliveryFailed.state, "SUBMITTED", "Delivery failure must not roll back the source incident")

const delivered = recordParentDelivery(deliveryFailed, {
  ...base(deliveryFailed.revision, "delivery-retry"),
  obligationId: delivery.id,
  expectedObligationRevision: delivery.sourceRevision,
  outcome: "DELIVERED",
  providerReceiptId: "push-receipt-synthetic-42",
})
assert.equal(projectMedicalIncident(delivered).status, "ACKNOWLEDGMENT_PENDING")
assert.equal(
  delivered.obligations.find((item) => item.id === delivery.id)?.receipt?.providerReceiptId,
  "push-receipt-synthetic-42",
)

const acknowledgment = delivered.obligations.find((item) => item.kind === "PARENT_ACKNOWLEDGMENT")!
const acknowledged = acknowledgeIncidentAsParent(delivered, {
  ...base(delivered.revision, "parent-ack", "parent-alma"),
  obligationId: acknowledgment.id,
  expectedObligationRevision: acknowledgment.sourceRevision,
})
assert.equal(projectMedicalIncident(acknowledged).status, "FOLLOW_UP_REQUIRED")
const followUp = acknowledged.obligations.find((item) => item.kind === "FOLLOW_UP")!
const followedUp = completeIncidentFollowUp(acknowledged, {
  ...base(acknowledged.revision, "follow-up", "nurse-ines"),
  obligationId: followUp.id,
  expectedObligationRevision: followUp.sourceRevision,
})
assert.equal(projectMedicalIncident(followedUp).status, "READY_TO_CLOSE")
assert.throws(
  () => closeMedicalIncident(followedUp, {
    ...base(followedUp.revision, "close-stale"),
    expectedObligationRevisions: { [managerReview.id]: managerReview.sourceRevision },
  }),
  /source revision conflict/,
)

const closed = closeMedicalIncident(followedUp, {
  ...base(followedUp.revision, "close-incident"),
  expectedObligationRevisions: Object.fromEntries(
    followedUp.obligations.map((item) => [item.id, item.sourceRevision]),
  ),
})
assert.equal(projectMedicalIncident(closed).status, "CLOSED")
assert.equal(closed.closedById, "manager-maya")
const corrected = correctMedicalIncident(closed, {
  ...base(closed.revision, "correct-incident"),
  reason: "Witness clarified the source of the spill",
  correctedCause: "Slipped on water from a tipped jug",
  reopen: ["MANAGER_REVIEW", "PARENT_DELIVERY", "PARENT_ACKNOWLEDGMENT", "FOLLOW_UP"],
})
assert.equal(projectMedicalIncident(corrected).status, "REVIEW_REQUIRED")
assert.equal(corrected.obligations.length, 9, "Correction must append new obligations, not erase receipts")
assert.equal(corrected.events.at(-1)?.kind, "CORRECTED")
assert.equal(closed.obligations.every((item) => item.state === "SATISFIED"), true)
assert.throws(
  () => completeIncidentDraft(initial, {
    ...base(0, "without-capability", "staff-lina"),
    actorCapabilities: [],
    witnessNotes: "A witness account",
  }),
  /Missing capability/,
)

for (const stage of [
  "draft-incomplete",
  "draft-ready",
  "review-required",
  "parent-delivery",
  "delivery-failed",
  "acknowledgment",
  "follow-up",
  "ready-to-close",
  "closed",
  "correction-reopened",
] as const) {
  assert.ok(projectMedicalIncident(createMedicalIncidentScenario(stage)).status)
}

const currentActionSource = readFileSync(resolve("src/lib/actions/medical.ts"), "utf8")
const currentDialogSource = readFileSync(
  resolve("src/app/(app)/children/[id]/accidents/accident-report-dialog.tsx"),
  "utf8",
)
const contractDocument = readFileSync(resolve("docs/redesign/medical-incident-contract.md"), "utf8")
const labSource = readFileSync(
  resolve("src/app/design-lab/incident/_components/incident-lab.tsx"),
  "utf8",
)
const labStyles = readFileSync(resolve("src/app/design-lab/incident/incident.css"), "utf8")
const harnessSource = readFileSync(
  resolve("src/app/design-lab/incident/_components/incident-axe-harness.tsx"),
  "utf8",
)
assert.match(currentActionSource, /status: input\.status \|\| "DRAFT"/)
assert.match(currentActionSource, /medicalFormEntry\.deleteMany/)
assert.match(currentActionSource, /medicalForm\.delete/)
assert.match(currentDialogSource, /status: "SUBMITTED"/)
assert.match(currentDialogSource, /uploadFileWithPresign/)
assert.match(contractDocument, /## Additive Production Migration/)
assert.match(contractDocument, /Delivery is not acknowledgment/)
assert.match(labSource, /projectMedicalIncident\(incident\)/)
assert.match(labSource, /aria-live="polite"/)
assert.doesNotMatch(labSource, /localStorage|sessionStorage|recharts|<svg/)
assert.match(labStyles, /@media \(max-width: 480px\)/)
assert.match(labStyles, /min-height: 48px/)
assert.doesNotMatch(labStyles, /gradient\(/)
assert.match(harnessSource, /auditNodeId="kiddz-incident-axe-audit"/)

process.stdout.write(
  "Redesign medical incident verification passed (evidence recovery, typed reviews, delivery receipt, acknowledgment, follow-up, fresh close, append-only correction)\n",
)
