import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  correctChildTimelineEvent,
  createChildWorkspaceFixture,
  managerChildWorkspaceViewer,
  nurseChildWorkspaceViewer,
  parentChildWorkspaceViewer,
  practitionerChildWorkspaceViewer,
  projectChildWorkspace,
} from "../lib/redesign-child-workspace-contracts"

const initial = createChildWorkspaceFixture()
const manager = projectChildWorkspace(initial, managerChildWorkspaceViewer)
const practitioner = projectChildWorkspace(initial, practitionerChildWorkspaceViewer)
const nurse = projectChildWorkspace(initial, nurseChildWorkspaceViewer)
const parent = projectChildWorkspace(initial, parentChildWorkspaceViewer)

assert.equal(manager.access, "READY")
assert.equal(manager.sections.length, 8)
assert.equal(manager.visibleTimelineCount, 7)
assert.equal(manager.visibleNoticeCount, 1)
assert(manager.timeline.some((event) => event.id === "care-draft-7"))
assert(manager.timeline.some((event) => event.id === "payment-july-7"))
assert(!manager.timeline.some((event) => event.id === "medical-clinical-2"))
assert(!manager.timeline.some((event) => event.id === "safeguarding-internal-3"))

assert.equal(practitioner.sections.length, 5)
assert.equal(practitioner.visibleTimelineCount, 5)
assert.equal(practitioner.visibleNoticeCount, 1)
assert(!practitioner.sections.some((section) => section.id === "FINANCE"))
assert(!practitioner.sections.some((section) => section.id === "AUDIT"))
assert(!practitioner.timeline.some((event) => event.sourceKind === "FINANCE"))

assert.equal(nurse.sections.length, 5)
assert.equal(nurse.visibleTimelineCount, 5)
assert.equal(nurse.visibleNoticeCount, 2)
assert(nurse.timeline.some((event) => event.id === "medical-clinical-2"))
assert(nurse.timeline.some((event) => event.id === "safeguarding-internal-3"))
assert(!nurse.timeline.some((event) => event.sourceKind === "FINANCE"))
assert(!nurse.timeline.some((event) => event.id === "care-draft-7"))

assert.equal(parent.sections.length, 7)
assert.equal(parent.visibleTimelineCount, 5)
assert.equal(parent.visibleNoticeCount, 1)
assert(!parent.sections.some((section) => section.id === "AUDIT"))
assert(!parent.timeline.some((event) => event.id === "care-draft-7"), "Parent projection must not expose care drafts")
assert(!parent.timeline.some((event) => event.id === "medical-clinical-2"), "Parent projection must not expose clinical detail")
assert(!parent.timeline.some((event) => event.id === "call-family-5"), "Parent projection must not expose internal call notes")
assert(parent.timeline.every((event) => !event.detail.includes("recorded by")), "Parent summary must not reuse staff detail")
assert(!("hiddenTimelineCount" in parent), "Projection must not leak denied event counts")

for (const projection of [manager, practitioner, nurse, parent]) {
  assert.equal(new Set(projection.timeline.map((event) => event.id)).size, projection.timeline.length)
  assert.equal(new Set(projection.sections.map((section) => section.id)).size, projection.sections.length)
  assert(projection.timeline.every((event, index, events) => index === 0 || Date.parse(events[index - 1].occurredAt) >= Date.parse(event.occurredAt)))
}

for (const viewer of [
  { ...managerChildWorkspaceViewer, organizationId: "org-other" },
  { ...managerChildWorkspaceViewer, allowedBranchIds: [] },
  { ...managerChildWorkspaceViewer, capabilities: managerChildWorkspaceViewer.capabilities.filter((capability) => capability !== "children.view") },
  { ...parentChildWorkspaceViewer, relatedChildIds: [] },
]) {
  const denied = projectChildWorkspace(initial, viewer)
  assert.equal(denied.access, "DENIED")
  assert.equal(denied.identity, null)
  assert.equal(denied.visibleTimelineCount, 0)
  assert.equal(denied.visibleNoticeCount, 0)
}

const correctionCommand = {
  eventId: "attendance-arrival-5",
  idempotencyKey: "correct-attendance-alma-once",
  actorId: "user-manager",
  occurredAt: "2026-07-14T10:05:00+01:00",
  expectedWorkspaceRevision: 0,
  sourceEventId: "attendance-arrival-4",
  expectedSourceRevision: 4,
  acceptedSourceRevision: 5,
  correctedOccurredAt: "2026-07-14T09:12:00+01:00",
  reason: "Arrival scanner clock was two minutes fast",
  correctedStaffDetail: "Alma arrived at Meadow at 09:12; corrected against the signed room register.",
  correctedParentDetail: "Alma arrived at 09:12.",
  actorCapabilities: managerChildWorkspaceViewer.capabilities,
} as const
const corrected = correctChildTimelineEvent(initial, correctionCommand)
assert.equal(corrected.revision, 1)
assert.equal(corrected.timeline.length, initial.timeline.length + 1)
assert.equal(corrected.acceptedEvents.length, 1)
assert.equal(correctChildTimelineEvent(corrected, correctionCommand), corrected)
assert.throws(() => correctChildTimelineEvent(corrected, { ...correctionCommand, reason: "Changed reason" }), /reused with different input/)

const correctedManager = projectChildWorkspace(corrected, managerChildWorkspaceViewer)
const correctedPractitioner = projectChildWorkspace(corrected, practitionerChildWorkspaceViewer)
const correctedParent = projectChildWorkspace(corrected, parentChildWorkspaceViewer)
assert.equal(correctedManager.visibleTimelineCount, 8, "Audit-capable manager retains original and correction")
assert(correctedManager.timeline.some((event) => event.id === "attendance-arrival-4" && event.isSuperseded))
assert(correctedManager.timeline.some((event) => event.id === "attendance-arrival-5" && event.correctionReason))
assert.equal(correctedPractitioner.visibleTimelineCount, 5, "Ordinary staff sees current fact without duplicate")
assert(!correctedPractitioner.timeline.some((event) => event.id === "attendance-arrival-4"))
assert(correctedPractitioner.timeline.some((event) => event.id === "attendance-arrival-5"))
assert.equal(correctedParent.visibleTimelineCount, 5, "Parent sees current published fact without audit duplicate")
assert(!correctedParent.timeline.some((event) => event.id === "attendance-arrival-4"))
assert.equal(correctedParent.timeline.find((event) => event.id === "attendance-arrival-5")?.detail, "Alma arrived at 09:12.")

assert.throws(() => correctChildTimelineEvent(initial, { ...correctionCommand, actorCapabilities: ["children.view", "attendance.read"] }), /Missing capability/)
assert.throws(() => correctChildTimelineEvent(initial, { ...correctionCommand, expectedWorkspaceRevision: 1 }), /workspace revision conflict/)
assert.throws(() => correctChildTimelineEvent(initial, { ...correctionCommand, acceptedSourceRevision: 4 }), /must be newer/)
assert.throws(() => correctChildTimelineEvent(initial, { ...correctionCommand, correctedParentDetail: null }), /parent-safe detail/)

const currentChildAction = readFileSync(resolve("src/lib/actions/children.ts"), "utf8")
const currentTimelineAction = readFileSync(resolve("src/lib/actions/timeline.ts"), "utf8")
const currentChildNav = readFileSync(resolve("src/components/children/child-sub-nav.tsx"), "utf8")
const labSource = readFileSync(resolve("src/app/design-lab/child-workspace/_components/child-workspace-lab.tsx"), "utf8")
const labCss = readFileSync(resolve("src/app/design-lab/child-workspace/child-workspace.css"), "utf8")
const docs = readFileSync(resolve("docs/redesign/child-workspace-contract.md"), "utf8")

assert(currentChildAction.includes("parents: true"))
assert(currentChildAction.includes("accountingEntries:"))
assert(currentTimelineAction.includes("db.medicalForm.findMany"))
assert(currentTimelineAction.includes("db.payment.findMany"))
assert(currentTimelineAction.includes("db.callLog.findMany"))
assert(currentChildNav.includes("const navItems = ["))
assert(labSource.includes("projectChildWorkspace"))
assert(labSource.includes("correctChildTimelineEvent"))
assert(labSource.includes("ChildWorkspaceAxeHarness"))
assert(!labSource.includes("localStorage"))
assert(!labSource.includes("sessionStorage"))
assert(!labSource.includes("recharts"))
assert(!labCss.includes("linear-gradient"))
assert(!labCss.includes("radial-gradient"))
assert(labCss.includes("min-height: 48px"))
assert(docs.includes("No hidden denied count"))
assert(docs.includes("Draft is not parent-visible"))
assert(docs.includes("Additive Production Migration"))

console.log("Redesign child workspace verification passed (base access, section/event capability, parent-safe publication, append-only correction, truthful counts)")
