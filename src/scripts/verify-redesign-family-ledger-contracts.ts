import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  allocateLedgerPayment,
  createConflictedFamilyLedgerFixture,
  createFamilyLedgerFixture,
  createFamilyLedgerScenario,
  deliverLedgerReceipt,
  findPaymentDuplicateCandidates,
  generateLedgerReceipt,
  projectFamilyLedger,
  projectFamilyLedgerForParent,
  recordLedgerPayment,
  reverseLedgerPayment,
  type FinanceCapability,
} from "../lib/redesign-family-ledger-contracts"

const capabilities: FinanceCapability[] = [
  "finance.query",
  "finance.record",
  "finance.allocate",
  "finance.correct",
  "finance.export",
  "finance.communicate",
]

function base(revision: number, id: string, actorId = "finance-nadia") {
  return {
    eventId: id,
    idempotencyKey: `${id}-once`,
    actorId,
    occurredAt: "2026-07-14T09:30:00+01:00",
    expectedRevision: revision,
    actorCapabilities: capabilities,
  }
}

const conflicted = createConflictedFamilyLedgerFixture()
assert.equal(projectFamilyLedger(conflicted).status, "SOURCE_CONFLICT")
assert.throws(
  () => recordLedgerPayment(conflicted, {
    ...base(0, "conflicted-record"),
    paymentId: "blocked-payment",
    draft: conflicted.draftPayment!,
  }),
  /source conflict/,
)

const initial = createFamilyLedgerFixture()
const initialProjection = projectFamilyLedger(initial)
assert.equal(initialProjection.status, "READY_TO_RECORD")
assert.equal(initialProjection.chargeTotalMinor, 118000)
assert.equal(initialProjection.paymentTotalMinor, 0, "Reversed imported payment must not reduce current balance")
assert.equal(initialProjection.isReconciled, true)

const duplicateDraft = { ...initial.draftPayment!, reference: "BANK-441" }
assert.equal(findPaymentDuplicateCandidates(initial, duplicateDraft).length, 1)
assert.throws(
  () => recordLedgerPayment(initial, {
    ...base(0, "record-duplicate"),
    paymentId: "payment-duplicate-review",
    draft: duplicateDraft,
  }),
  /Duplicate review required/,
)
const duplicateAccepted = recordLedgerPayment(initial, {
  ...base(0, "record-duplicate-reviewed"),
  paymentId: "payment-duplicate-review",
  draft: duplicateDraft,
  duplicateDecision: "CONFIRMED_DISTINCT",
  duplicateReason: "Bank statement shows a different settlement trace",
})
assert.match(duplicateAccepted.events.at(-1)?.detail ?? "", /Bank statement/)

const recordedCommand = {
  ...base(0, "record-payment"),
  paymentId: "payment-bank-442",
  draft: initial.draftPayment!,
} as const
const recorded = recordLedgerPayment(initial, recordedCommand)
assert.equal(projectFamilyLedger(recorded).status, "NEEDS_ALLOCATION")
assert.equal(projectFamilyLedger(recorded).familyBalanceMinor, 0)
assert.equal(projectFamilyLedger(recorded).invoiceOutstandingMinor, 118000)
assert.equal(projectFamilyLedger(recorded).unallocatedCreditMinor, 118000)
assert.equal(recordLedgerPayment(recorded, recordedCommand), recorded)
assert.throws(
  () => recordLedgerPayment(recorded, { ...recordedCommand, eventId: "changed", paymentId: "changed" }),
  /reused with different input/,
)

const payment = projectFamilyLedger(recorded).latestModernPayment!
assert.throws(
  () => allocateLedgerPayment(recorded, {
    ...base(recorded.revision, "over-allocate"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    lines: [{ allocationId: "too-much", chargeId: "charge-october", expectedChargeRevision: 4, amountMinor: 118001 }],
  }),
  /exceeds unallocated/,
)
assert.equal(recorded.allocations.length, 0, "Rejected allocation must leave every charge unchanged")

const partial = allocateLedgerPayment(recorded, {
  ...base(recorded.revision, "allocate-october"),
  paymentId: payment.id,
  expectedPaymentRevision: payment.recordedRevision,
  lines: [{ allocationId: "allocation-october", chargeId: "charge-october", expectedChargeRevision: 4, amountMinor: 50000 }],
})
assert.equal(projectFamilyLedger(partial).status, "PARTIALLY_ALLOCATED")
assert.equal(projectFamilyLedger(partial).invoiceOutstandingMinor, 68000)
assert.equal(projectFamilyLedger(partial).unallocatedCreditMinor, 68000)
assert.throws(
  () => allocateLedgerPayment(partial, {
    ...base(partial.revision, "stale-charge"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    lines: [{ allocationId: "stale", chargeId: "charge-november", expectedChargeRevision: 1, amountMinor: 50000 }],
  }),
  /Charge revision conflict/,
)
assert.throws(
  () => generateLedgerReceipt(partial, {
    ...base(partial.revision, "early-receipt"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    receiptId: "early",
  }),
  /fully allocated/,
)

const allocated = allocateLedgerPayment(partial, {
  ...base(partial.revision, "allocate-remainder"),
  paymentId: payment.id,
  expectedPaymentRevision: payment.recordedRevision,
  lines: [
    { allocationId: "allocation-november", chargeId: "charge-november", expectedChargeRevision: 2, amountMinor: 50000 },
    { allocationId: "allocation-bus", chargeId: "charge-bus", expectedChargeRevision: 1, amountMinor: 18000 },
  ],
})
const allocatedProjection = projectFamilyLedger(allocated)
assert.equal(allocatedProjection.status, "RECEIPT_READY")
assert.equal(allocatedProjection.invoiceOutstandingMinor, 0)
assert.equal(allocatedProjection.unallocatedCreditMinor, 0)
assert.equal(allocatedProjection.familyBalanceMinor, 0)
assert.equal(allocatedProjection.isReconciled, true)

const receiptReady = generateLedgerReceipt(allocated, {
  ...base(allocated.revision, "generate-receipt"),
  paymentId: payment.id,
  expectedPaymentRevision: payment.recordedRevision,
  receiptId: "receipt-bank-442",
})
assert.equal(projectFamilyLedger(receiptReady).status, "DELIVERY_PENDING")
const receipt = projectFamilyLedger(receiptReady).latestReceipt!
const settled = deliverLedgerReceipt(receiptReady, {
  ...base(receiptReady.revision, "deliver-receipt"),
  receiptId: receipt.id,
  expectedReceiptRevision: receipt.sourceRevision,
  deliveryReceiptId: "family-delivery-442",
})
assert.equal(projectFamilyLedger(settled).status, "SETTLED")
assert.equal(projectFamilyLedgerForParent(settled).receipts.length, 1)
assert.equal("events" in projectFamilyLedgerForParent(settled), false)

assert.throws(
  () => reverseLedgerPayment(settled, {
    ...base(settled.revision, "stale-reversal-set", "manager-maya"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    expectedAllocationIds: ["allocation-october"],
    reversalId: "reversal-stale",
    reason: "Returned transfer",
  }),
  /Allocation set changed/,
)
const corrected = reverseLedgerPayment(settled, {
  ...base(settled.revision, "reverse-payment", "manager-maya"),
  paymentId: payment.id,
  expectedPaymentRevision: payment.recordedRevision,
  expectedAllocationIds: settled.allocations.filter((item) => item.paymentId === payment.id).map((item) => item.id),
  reversalId: "reversal-bank-442",
  reason: "Bank confirmed the transfer was returned to the family",
})
const correctedProjection = projectFamilyLedger(corrected)
assert.equal(correctedProjection.status, "CORRECTION_RECORDED")
assert.equal(correctedProjection.familyBalanceMinor, 118000)
assert.equal(correctedProjection.invoiceOutstandingMinor, 118000)
assert.equal(corrected.payments.length, 2, "Original payment must remain in history")
assert.equal(corrected.allocations.length, 3, "Original allocations must remain in history")
assert.equal(corrected.receipts.length, 1, "Original receipt must remain in history")
assert.throws(
  () => recordLedgerPayment(initial, {
    ...base(0, "without-capability"),
    actorCapabilities: [],
    paymentId: "blocked",
    draft: initial.draftPayment!,
  }),
  /Missing capability/,
)

for (const stage of [
  "source-conflict",
  "ready-to-record",
  "duplicate-review",
  "needs-allocation",
  "partially-allocated",
  "receipt-ready",
  "delivery-pending",
  "settled",
  "correction-recorded",
] as const) {
  assert.ok(projectFamilyLedger(createFamilyLedgerScenario(stage)).status)
}

const paymentActions = readFileSync(resolve("src/lib/actions/payments.ts"), "utf8")
const accountingActions = readFileSync(resolve("src/lib/actions/accounting.ts"), "utf8")
const childAccounting = readFileSync(resolve("src/app/(app)/children/[id]/accounting/accounting-client.tsx"), "utf8")
const contractDocument = readFileSync(resolve("docs/redesign/family-ledger-contract.md"), "utf8")
const labSource = readFileSync(resolve("src/app/design-lab/finance/_components/finance-lab.tsx"), "utf8")
const labStyles = readFileSync(resolve("src/app/design-lab/finance/finance.css"), "utf8")
const harnessSource = readFileSync(resolve("src/app/design-lab/finance/_components/finance-axe-harness.tsx"), "utf8")
assert.match(paymentActions, /db\.payment\.create/)
assert.match(paymentActions, /data: \{ deletedAt: new Date\(\) \}/)
assert.match(accountingActions, /db\.accountingEntry\.create/)
assert.doesNotMatch(accountingActions, /paymentId|allocation/)
assert.match(childAccounting, /const balance = totalFees - totalPaymentsEntry - totalDiscounts/)
assert.match(childAccounting, /paymentSummary\.totalPaid/)
assert.match(contractDocument, /## Additive Production Migration/)
assert.match(contractDocument, /integer minor units/)
assert.match(labSource, /projectFamilyLedger\(ledger\)/)
assert.match(labSource, /aria-live="polite"/)
assert.doesNotMatch(labSource, /localStorage|sessionStorage|recharts|<svg/)
assert.match(labStyles, /@media \(max-width: 480px\)/)
assert.match(labStyles, /min-height: 48px/)
assert.doesNotMatch(labStyles, /gradient\(/)
assert.match(harnessSource, /auditNodeId="kiddz-finance-axe-audit"/)

process.stdout.write(
  "Redesign family ledger verification passed (source conflict, duplicate review, atomic allocation, shared balance, separate receipt delivery, append-only reversal)\n",
)
