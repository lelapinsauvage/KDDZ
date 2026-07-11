import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  claimActionItem,
  createActionCenterFixture,
  deferActionItem,
  managerActionCenterViewer,
  markActionViewed,
  practitionerActionCenterViewer,
  projectActionCenter,
  reconcileActionSource,
} from "../lib/redesign-action-center-contracts"

const managerCapabilities = [
  ...managerActionCenterViewer.capabilities,
  "action_center.claim",
  "action_center.defer",
  "action_center.source_reconcile",
]

const initial = createActionCenterFixture()
const managerInitial = projectActionCenter(initial, managerActionCenterViewer)
assert.equal(managerInitial.activeCount, 5)
assert.equal(managerInitial.unreadCount, 5)
assert.equal(managerInitial.primaryItemId, "attendance-alma")
assert.deepEqual(managerInitial.groups.NEEDS_VERIFICATION.map((item) => item.id), ["attendance-alma"])
assert.deepEqual(managerInitial.groups.NOW.map((item) => item.id), ["ratio-meadow", "payment-luca"])
assert.deepEqual(managerInitial.groups.TODAY.map((item) => item.id), ["care-meadow", "reply-theo"])
assert.deepEqual(managerInitial.recentlyResolved.map((item) => item.id), ["vaccination-maya"])
assert(!("hiddenCount" in managerInitial), "Projection must not expose denied work counts")

const practitionerInitial = projectActionCenter(initial, practitionerActionCenterViewer)
assert.equal(practitionerInitial.activeCount, 4)
assert(!practitionerInitial.activeItems.some((item) => item.id === "payment-luca"))
assert(!practitionerInitial.recentlyResolved.some((item) => item.requiredCapability === "finance.view"))

const wrongOrganization = projectActionCenter(initial, {
  ...managerActionCenterViewer,
  organizationId: "org-other",
})
assert.equal(wrongOrganization.activeCount, 0)
assert.equal(wrongOrganization.recentlyResolved.length, 0)

const viewedCommand = {
  eventId: "view-ratio",
  idempotencyKey: "view-ratio-once",
  actorId: "user-manager",
  occurredAt: "2026-07-14T10:01:00+01:00",
  expectedStateRevision: 0,
  expectedItemRevision: 0,
  expectedSourceRevision: 12,
  actorCapabilities: managerCapabilities,
  itemId: "ratio-meadow",
} as const
const viewed = markActionViewed(initial, viewedCommand)
assert.equal(projectActionCenter(viewed, managerActionCenterViewer).activeCount, 5)
assert.equal(projectActionCenter(viewed, managerActionCenterViewer).unreadCount, 4)
assert.equal(viewed.items.find((item) => item.id === "ratio-meadow")?.sourceState, "OPEN")
assert.equal(markActionViewed(viewed, viewedCommand), viewed)
assert.throws(() => markActionViewed(viewed, { ...viewedCommand, eventId: "changed-view" }), /reused with different input/)

const claimed = claimActionItem(viewed, {
  eventId: "claim-ratio",
  idempotencyKey: "claim-ratio-once",
  actorId: "user-manager",
  occurredAt: "2026-07-14T10:02:00+01:00",
  expectedStateRevision: 1,
  expectedItemRevision: 1,
  expectedSourceRevision: 12,
  actorCapabilities: managerCapabilities,
  itemId: "ratio-meadow",
})
assert.equal(projectActionCenter(claimed, managerActionCenterViewer).ownedByViewerCount, 1)
assert.equal(claimed.items.find((item) => item.id === "ratio-meadow")?.sourceState, "OPEN")
assert.throws(() => claimActionItem(claimed, {
  eventId: "stale-claim",
  idempotencyKey: "stale-claim",
  actorId: "user-manager",
  occurredAt: "2026-07-14T10:03:00+01:00",
  expectedStateRevision: 1,
  expectedItemRevision: 1,
  expectedSourceRevision: 12,
  actorCapabilities: managerCapabilities,
  itemId: "ratio-meadow",
}), /state revision conflict/)

assert.throws(() => deferActionItem(claimed, {
  eventId: "defer-critical",
  idempotencyKey: "defer-critical",
  actorId: "user-manager",
  occurredAt: "2026-07-14T10:03:00+01:00",
  expectedStateRevision: 2,
  expectedItemRevision: 2,
  expectedSourceRevision: 12,
  actorCapabilities: managerCapabilities,
  itemId: "ratio-meadow",
  reviewAt: "2026-07-14T10:30:00+01:00",
  reason: "Look later",
}), /cannot be deferred/)

const replyBefore = claimed.items.find((item) => item.id === "reply-theo")
const deferred = deferActionItem(claimed, {
  eventId: "defer-reply",
  idempotencyKey: "defer-reply-once",
  actorId: "user-manager",
  occurredAt: "2026-07-14T10:03:00+01:00",
  expectedStateRevision: 2,
  expectedItemRevision: 0,
  expectedSourceRevision: 2,
  actorCapabilities: managerCapabilities,
  itemId: "reply-theo",
  reviewAt: "2026-07-14T13:00:00+01:00",
  reason: "Room lead will confirm the lunch preference after handover",
})
const replyAfter = deferred.items.find((item) => item.id === "reply-theo")
assert.equal(replyAfter?.dueAt, replyBefore?.dueAt, "Deferral must not rewrite the canonical due time")
assert.equal(replyAfter?.sourceState, "OPEN", "Deferral must not resolve source work")
assert.deepEqual(projectActionCenter(deferred, managerActionCenterViewer).groups.LATER.map((item) => item.id), ["reply-theo"])

assert.throws(() => reconcileActionSource(deferred, {
  eventId: "resolve-without-evidence",
  idempotencyKey: "resolve-without-evidence",
  actorId: "system-live-operations",
  occurredAt: "2026-07-14T10:04:00+01:00",
  expectedStateRevision: 3,
  expectedItemRevision: 2,
  expectedSourceRevision: 12,
  actorCapabilities: managerCapabilities,
  itemId: "ratio-meadow",
  acceptedSourceRevision: 13,
  acceptedSourceState: "RESOLVED",
}), /evidence path is required/)
assert.throws(() => reconcileActionSource(deferred, {
  eventId: "resolve-without-capability",
  idempotencyKey: "resolve-without-capability",
  actorId: "system-live-operations",
  occurredAt: "2026-07-14T10:04:00+01:00",
  expectedStateRevision: 3,
  expectedItemRevision: 2,
  expectedSourceRevision: 12,
  actorCapabilities: managerActionCenterViewer.capabilities,
  itemId: "ratio-meadow",
  acceptedSourceRevision: 13,
  acceptedSourceState: "RESOLVED",
  resolutionEvidencePath: "Today / Meadow / Cover receipt 13",
}), /Missing capability/)

const resolved = reconcileActionSource(deferred, {
  eventId: "resolve-ratio-from-source",
  idempotencyKey: "resolve-ratio-from-source-once",
  actorId: "system-live-operations",
  occurredAt: "2026-07-14T10:04:00+01:00",
  expectedStateRevision: 3,
  expectedItemRevision: 2,
  expectedSourceRevision: 12,
  actorCapabilities: managerCapabilities,
  itemId: "ratio-meadow",
  acceptedSourceRevision: 13,
  acceptedSourceState: "RESOLVED",
  resolutionEvidencePath: "Today / Riverside / Meadow / Cover receipt 13",
})
const resolvedProjection = projectActionCenter(resolved, managerActionCenterViewer)
assert.equal(resolvedProjection.activeCount, 4)
assert(resolvedProjection.recentlyResolved.some((item) => item.id === "ratio-meadow"))
assert.equal(resolved.items.find((item) => item.id === "ratio-meadow")?.ownerId, "user-manager")
assert.equal(resolved.events.length, 4)

const currentNotificationAction = readFileSync(resolve("src/lib/actions/notification-center.ts"), "utf8")
const currentMessagesAction = readFileSync(resolve("src/lib/actions/messages.ts"), "utf8")
const labSource = readFileSync(resolve("src/app/design-lab/action-center/_components/action-center-lab.tsx"), "utf8")
const labCss = readFileSync(resolve("src/app/design-lab/action-center/action-center.css"), "utf8")
const docs = readFileSync(resolve("docs/redesign/action-center-contract.md"), "utf8")

assert(currentNotificationAction.includes("data: { isActive: false }"), "Audit must remain anchored to current generic alarm resolution")
assert(currentNotificationAction.includes("data: { dueDate: newDate }"), "Audit must remain anchored to current snooze semantics")
assert(currentMessagesAction.includes("data: { isRead: true }"), "Audit must distinguish message read state from work resolution")
assert(labSource.includes("projectActionCenter"))
assert(labSource.includes("reconcileActionSource"))
assert(labSource.includes("ActionCenterAxeHarness"))
assert(!labSource.includes("localStorage"))
assert(!labSource.includes("sessionStorage"))
assert(!labSource.includes("recharts"))
assert(!labCss.includes("linear-gradient"))
assert(!labCss.includes("radial-gradient"))
assert(labCss.includes("min-height: 48px"), "Phone controls need an explicit 48px target")
assert(docs.includes("Viewed is not resolved"))
assert(docs.includes("No hidden denied count"))
assert(docs.includes("Additive Production Migration"))

console.log("Redesign Action Center verification passed (capability scope, truthful counts, viewed/owned/deferred/source-resolved separation, stale guard)")
