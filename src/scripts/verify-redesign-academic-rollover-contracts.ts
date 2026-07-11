import assert from "node:assert/strict"

import {
  approveAcademicRollover,
  capabilitiesForAcademicRolloverRole,
  captureAcademicRolloverBackup,
  confirmAcademicRolloverImpact,
  confirmAcademicRolloverSources,
  createAcademicRolloverFixture,
  createEmptyAcademicRolloverSession,
  deriveAcademicRolloverStatus,
  executeAcademicRollover,
  projectAcademicRolloverForRole,
  rollbackAcademicRollover,
  runAcademicRolloverPreflight,
  saveAcademicRolloverPlan,
  validateAcademicRollover,
  verifyAcademicRolloverBackup,
  type AcademicRolloverCommand,
  type AcademicRolloverSession,
  type RolloverChildAssignment,
  type RolloverTeacherAssignment,
  type RolloverValidationReceipt,
} from "../lib/redesign-academic-rollover-contracts"

function command(
  session: AcademicRolloverSession,
  key: string,
  actorId = "verify-admin",
): AcademicRolloverCommand {
  const role = actorId.startsWith("auditor-")
    ? "auditor"
    : actorId.startsWith("coordinator-")
      ? "coordinator"
      : "administrator"
  return {
    eventId: `verify-event-${key}`,
    idempotencyKey: `verify-rollover-${key}`,
    actorId,
    occurredAt: "2027-07-18T09:00:00.000Z",
    expectedRevision: session.revision,
    actorCapabilities: capabilitiesForAcademicRolloverRole(role),
  }
}

const validChildren: RolloverChildAssignment[] = [
  {
    childId: "child-amelie",
    childName: "Amelie Haddad",
    sourceBranchId: "branch-riverside",
    targetBranchId: "branch-riverside",
    targetClassId: "class-meadow",
    childNumber: "RV272801",
    allowBranchTransfer: false,
  },
  {
    childId: "child-noah",
    childName: "Noah Mansour",
    sourceBranchId: "branch-riverside",
    targetBranchId: "branch-riverside",
    targetClassId: "class-seedlings",
    childNumber: "RV272802",
    allowBranchTransfer: false,
  },
  {
    childId: "child-lina",
    childName: "Lina Farah",
    sourceBranchId: "branch-riverside",
    targetBranchId: "branch-riverside",
    targetClassId: "class-sunroom",
    childNumber: "RV272803",
    allowBranchTransfer: false,
  },
]

const validTeachers: RolloverTeacherAssignment[] = [
  {
    teacherId: "teacher-sophie",
    teacherName: "Sophie Martin",
    sourceBranchId: "branch-riverside",
    targetBranchId: "branch-riverside",
    targetClassId: "class-meadow",
    allowBranchTransfer: false,
  },
]

function confirmSources(session: AcademicRolloverSession, key = "sources") {
  return confirmAcademicRolloverSources(session, {
    ...command(session, key),
    sources: session.requiredSources.map((source) => ({ ...source })),
  })
}

function savePlan(
  session: AcademicRolloverSession,
  options: {
    children?: RolloverChildAssignment[]
    unselectedPolicy?: "UNDECIDED" | "RETAIN_OLD_YEAR" | "DEACTIVATE"
  } = {},
) {
  return saveAcademicRolloverPlan(session, {
    ...command(session, `plan-${session.plans.length + 1}`),
    fromYearId: "school-year-2026-2027",
    fromYearLabel: "2026-2027",
    toYearLabel: "2027-2028",
    startDate: "2027-09-01",
    endDate: "2028-06-30",
    children: options.children ?? validChildren,
    teachers: validTeachers,
    optionalDomains: ["HOLIDAYS", "VACCINATIONS"],
    unselectedChildPolicy: options.unselectedPolicy ?? "RETAIN_OLD_YEAR",
  })
}

function preflight(session: AcademicRolloverSession, key = "preflight") {
  return runAcademicRolloverPreflight(session, command(session, key))
}

function confirmImpact(session: AcademicRolloverSession) {
  return confirmAcademicRolloverImpact(session, command(session, "impact"))
}

function captureBackup(
  session: AcademicRolloverSession,
  engine: "pg_dump" | "fallback" = "pg_dump",
) {
  return captureAcademicRolloverBackup(session, {
    ...command(session, `backup-${engine}`),
    engine,
    databaseIdentity: "garderie-production",
    storageKey: `legacy-archives/newyear/${engine}/backup.sql`,
    bytes: 18_240_000,
    sha256: "b".repeat(64),
    immutable: true,
    schemaVersion: "2026071101",
  })
}

const validRestoreProof = {
  isolatedTargetId: "restore-drill-verify",
  checksumMatch: true,
  schemaVersionMatch: true,
  rowCountMatch: true,
  foreignKeysValid: true,
  sampledInvariantsValid: true,
  restoredAt: "2027-07-18T10:00:00.000Z",
}

function verifyBackup(session: AcademicRolloverSession) {
  return verifyAcademicRolloverBackup(session, {
    ...command(session, "verify-backup", "auditor-ines"),
    restoreProof: validRestoreProof,
  })
}

function approveBoth(session: AcademicRolloverSession) {
  let next = approveAcademicRollover(session, {
    ...command(session, "operator-approval", "verify-admin"),
    approvalType: "OPERATOR",
  })
  next = approveAcademicRollover(next, {
    ...command(next, "custodian-approval", "auditor-ines"),
    approvalType: "DATA_CUSTODIAN",
  })
  return next
}

function execute(session: AcademicRolloverSession) {
  return executeAcademicRollover(session, {
    ...command(session, "execute"),
    lockId: "verify-organization-rollover-lock",
  })
}

const passingChecks: RolloverValidationReceipt["checks"] = {
  exactlyOneActiveYear: true,
  selectedChildrenAssigned: true,
  selectedTeachersAssigned: true,
  childHistoryComplete: true,
  legacyYearAdapterUpdated: true,
  unrelatedRowsUnchanged: true,
}

const stages = [
  ["source-gap", "SOURCE_GAP"],
  ["plan-draft", "PLAN_DRAFT"],
  ["preflight-blocked", "PREFLIGHT_BLOCKED"],
  ["impact-review", "IMPACT_REVIEW"],
  ["backup-pending", "BACKUP_PENDING"],
  ["backup-unverified", "BACKUP_UNVERIFIED"],
  ["approval-required", "APPROVAL_REQUIRED"],
  ["ready-to-execute", "READY_TO_EXECUTE"],
  ["execution-accepted", "EXECUTION_ACCEPTED"],
  ["validation-failed", "VALIDATION_FAILED"],
  ["rollback-confirmed", "ROLLBACK_CONFIRMED"],
  ["completed", "COMPLETED"],
] as const

for (const [stage, expected] of stages) {
  assert.equal(
    deriveAcademicRolloverStatus(createAcademicRolloverFixture(stage)),
    expected,
    `${stage} must derive ${expected}`,
  )
}

const empty = createEmptyAcademicRolloverSession()
assert.equal(empty.plans.length, 0)
assert.equal(empty.backup, undefined)
assert.equal(empty.execution, undefined)
assert.throws(
  () =>
    confirmAcademicRolloverSources(empty, {
      ...command(empty, "partial-sources"),
      sources: [empty.requiredSources[0]],
    }),
  /Every rollover source must be confirmed/,
)

const sourced = confirmSources(empty)
assert.throws(
  () =>
    saveAcademicRolloverPlan(sourced, {
      ...command(sourced, "bad-date-plan"),
      fromYearId: "old",
      fromYearLabel: "2026-2027",
      toYearLabel: "2027-2028",
      startDate: "2028-06-30",
      endDate: "2027-09-01",
      children: validChildren,
      teachers: validTeachers,
      optionalDomains: [],
      unselectedChildPolicy: "RETAIN_OLD_YEAR",
    }),
  /end must follow/,
)

const duplicateChildren = validChildren.map((child, index) => ({
  ...child,
  childNumber: index < 2 ? "DUPLICATE-01" : child.childNumber,
}))
duplicateChildren[1] = {
  ...duplicateChildren[1],
  targetBranchId: "branch-harbour",
  targetClassId: "class-harbour",
}
let blocked = savePlan(sourced, {
  children: duplicateChildren,
  unselectedPolicy: "UNDECIDED",
})
blocked = preflight(blocked, "blocked-preflight")
assert.equal(deriveAcademicRolloverStatus(blocked), "PREFLIGHT_BLOCKED")
assert.deepEqual(
  blocked.preflight?.blockers.map((blocker) => blocker.type).sort(),
  ["CROSS_BRANCH_CHILD", "DUPLICATE_CHILD_NUMBER", "UNSELECTED_POLICY"],
)
assert.throws(
  () => confirmAcademicRolloverImpact(blocked, command(blocked, "blocked-impact")),
  /Resolve every preflight blocker/,
)

let readyForImpact = savePlan(sourced)
readyForImpact = preflight(readyForImpact)
assert.equal(readyForImpact.preflight?.blockers.length, 0)
assert.deepEqual(readyForImpact.preflight?.impact, {
  childrenSelected: 3,
  teachersSelected: 1,
  classesAffected: 3,
  branchesAffected: 1,
  optionalDomains: 2,
  unselectedChildren: 1,
})
assert.equal(readyForImpact.plans.length, 1)
assert.equal(readyForImpact.execution, undefined, "preflight must not change production")

const impactConfirmed = confirmImpact(readyForImpact)
assert.throws(
  () =>
    captureAcademicRolloverBackup(impactConfirmed, {
      ...command(impactConfirmed, "mutable-backup"),
      engine: "pg_dump",
      databaseIdentity: "garderie-production",
      storageKey: "mutable.sql",
      bytes: 100,
      sha256: "c".repeat(64),
      immutable: false,
      schemaVersion: "2026071101",
    }),
  /must be immutable/,
)

const fallbackBackup = captureBackup(impactConfirmed, "fallback")
assert.throws(
  () =>
    verifyAcademicRolloverBackup(fallbackBackup, {
      ...command(fallbackBackup, "fallback-verify", "auditor-ines"),
      restoreProof: validRestoreProof,
    }),
  /engine is not approved/,
)

const captured = captureBackup(impactConfirmed)
assert.equal(deriveAcademicRolloverStatus(captured), "BACKUP_UNVERIFIED")
assert.throws(
  () =>
    verifyAcademicRolloverBackup(captured, {
      ...command(captured, "failed-restore", "auditor-ines"),
      restoreProof: { ...validRestoreProof, rowCountMatch: false },
    }),
  /restore verification failed/,
)

const verified = verifyBackup(captured)
assert.equal(verified.backup?.status, "VERIFIED")
assert.equal(deriveAcademicRolloverStatus(verified), "APPROVAL_REQUIRED")

const oneApproval = approveAcademicRollover(verified, {
  ...command(verified, "operator-only", "verify-admin"),
  approvalType: "OPERATOR",
})
assert.throws(
  () =>
    approveAcademicRollover(oneApproval, {
      ...command(oneApproval, "same-person-custodian", "verify-admin"),
      approvalType: "DATA_CUSTODIAN",
    }),
  /distinct people/,
)
assert.throws(
  () => execute(oneApproval),
  /Both bound rollover approvals/,
)

const approved = approveBoth(verified)
assert.equal(deriveAcademicRolloverStatus(approved), "READY_TO_EXECUTE")

const replayCommand = {
  ...command(approved, "idempotent-execute"),
  lockId: "verify-idempotent-lock",
}
const executedOnce = executeAcademicRollover(approved, replayCommand)
const executedReplay = executeAcademicRollover(executedOnce, replayCommand)
assert.deepEqual(executedReplay, executedOnce)
assert.throws(
  () =>
    executeAcademicRollover(executedOnce, {
      ...replayCommand,
      lockId: "changed-lock",
    }),
  /Idempotency key was reused with changed input/,
)

const sourcesChanged = confirmAcademicRolloverSources(approved, {
  ...command(approved, "newer-roster"),
  sources: approved.requiredSources.map((source) => ({
    ...source,
    revision: source.sourceId === "active-child-roster" ? source.revision + 1 : source.revision,
  })),
})
assert.throws(
  () => execute(sourcesChanged),
  /sources changed after preflight/,
)

const executed = execute(approved)
assert.equal(executed.execution?.childrenUpdated, 3)
assert.equal(executed.execution?.teachersUpdated, 1)
assert.equal(deriveAcademicRolloverStatus(executed), "EXECUTION_ACCEPTED")

const failed = validateAcademicRollover(executed, {
  ...command(executed, "validation-failed", "auditor-ines"),
  checks: { ...passingChecks, legacyYearAdapterUpdated: false },
})
assert.equal(deriveAcademicRolloverStatus(failed), "VALIDATION_FAILED")
assert.throws(
  () =>
    rollbackAcademicRollover(failed, {
      ...command(failed, "incomplete-rollback"),
      checksumMatch: true,
      previousYearRestored: true,
      rowCountsMatch: false,
    }),
  /recovery proof is incomplete/,
)
const rolledBack = rollbackAcademicRollover(failed, {
  ...command(failed, "rollback"),
  checksumMatch: true,
  previousYearRestored: true,
  rowCountsMatch: true,
})
assert.equal(deriveAcademicRolloverStatus(rolledBack), "ROLLBACK_CONFIRMED")
assert.equal(rolledBack.execution?.status, "ACCEPTED")
assert.equal(rolledBack.validation?.status, "FAILED")

const completed = validateAcademicRollover(executed, {
  ...command(executed, "validation-passed", "auditor-ines"),
  checks: passingChecks,
})
assert.equal(deriveAcademicRolloverStatus(completed), "COMPLETED")
assert.equal(completed.validation?.status, "PASSED")

const adminProjection = projectAcademicRolloverForRole(completed, "administrator")
const coordinatorProjection = projectAcademicRolloverForRole(completed, "coordinator")
const auditorProjection = projectAcademicRolloverForRole(completed, "auditor")
assert.equal(adminProjection.childAssignments?.length, 3)
assert.equal(coordinatorProjection.childAssignments?.length, 3)
assert.equal(coordinatorProjection.backup, undefined)
assert.equal(coordinatorProjection.approvals, undefined)
assert.equal(auditorProjection.childAssignments, undefined)
assert.equal(auditorProjection.teacherAssignments, undefined)
assert.equal(auditorProjection.backup?.status, "VERIFIED")
assert.equal(auditorProjection.validation?.status, "PASSED")
assert.equal(JSON.stringify(auditorProjection).includes("Amelie"), false)
assert.equal(JSON.stringify(auditorProjection).includes("Noah"), false)
assert.equal(JSON.stringify(auditorProjection).includes("Lina"), false)
assert.equal(JSON.stringify(coordinatorProjection).includes("storageKey"), false)
assert.equal(JSON.stringify(coordinatorProjection).includes("databaseIdentity"), false)
assert.equal(JSON.stringify(coordinatorProjection).includes("sha256"), false)

assert.throws(
  () =>
    executeAcademicRollover(approved, {
      ...command(approved, "capability-denied", "coordinator-maya"),
      lockId: "denied-lock",
    }),
  /Missing capability: rollover.execute/,
)

console.log("Academic rollover redesign contracts verified")
