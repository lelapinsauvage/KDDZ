export type FinanceCapability =
  | "finance.query"
  | "finance.record"
  | "finance.allocate"
  | "finance.correct"
  | "finance.export"
  | "finance.communicate"

export type FamilyLedgerStatus =
  | "SOURCE_CONFLICT"
  | "READY_TO_RECORD"
  | "DUPLICATE_REVIEW"
  | "NEEDS_ALLOCATION"
  | "PARTIALLY_ALLOCATED"
  | "RECEIPT_READY"
  | "DELIVERY_PENDING"
  | "SETTLED"
  | "CORRECTION_RECORDED"

export type FamilyLedgerFixtureStage =
  | "source-conflict"
  | "ready-to-record"
  | "duplicate-review"
  | "needs-allocation"
  | "partially-allocated"
  | "receipt-ready"
  | "delivery-pending"
  | "settled"
  | "correction-recorded"

type PaymentMethod = "CASH" | "CHECK" | "TRANSFER" | "CREDIT_CARD"

export interface PaymentDraft {
  amountMinor: number
  currency: string
  paidAt: string
  method: PaymentMethod
  reference: string
  evidenceFilename?: string
}

export interface LedgerCharge {
  id: string
  description: string
  dueAt: string
  amountMinor: number
  currency: string
  revision: number
  provenance: "LEGACY_ACCOUNTING" | "MODERN_CHARGE"
}

export interface LedgerPayment {
  id: string
  amountMinor: number
  currency: string
  paidAt: string
  method: PaymentMethod
  reference: string
  evidenceFilename?: string
  recordedRevision: number
  provenance: "LEGACY_PAYMENT" | "MODERN_PAYMENT"
  recordedById: string
}

export interface PaymentAllocation {
  id: string
  paymentId: string
  chargeId: string
  amountMinor: number
  recordedRevision: number
  recordedById: string
  recordedAt: string
}

export interface PaymentReversal {
  id: string
  paymentId: string
  reason: string
  recordedRevision: number
  recordedById: string
  recordedAt: string
}

export interface LedgerReceipt {
  id: string
  paymentId: string
  generatedAt: string
  generatedById: string
  sourceRevision: number
  deliveredAt?: string
  deliveryReceiptId?: string
}

export interface FamilyLedgerEvent {
  eventId: string
  idempotencyKey: string
  fingerprint: string
  kind: "PAYMENT_RECORDED" | "ALLOCATED" | "RECEIPT_GENERATED" | "RECEIPT_DELIVERED" | "PAYMENT_REVERSED"
  actorId: string
  occurredAt: string
  detail: string
  resultingRevision: number
}

export interface FamilyLedger {
  id: string
  family: { id: string; displayName: string; childName: string; branch: string }
  currency: string
  revision: number
  sourceState: "TRUSTED" | "CONFLICT"
  sourceConflict?: {
    paymentTotalMinor: number
    accountingPaymentTotalMinor: number
    explanation: string
  }
  draftPayment?: PaymentDraft
  charges: LedgerCharge[]
  payments: LedgerPayment[]
  allocations: PaymentAllocation[]
  reversals: PaymentReversal[]
  receipts: LedgerReceipt[]
  events: FamilyLedgerEvent[]
}

interface FinanceCommand {
  eventId: string
  idempotencyKey: string
  actorId: string
  occurredAt: string
  expectedRevision: number
  actorCapabilities: readonly FinanceCapability[]
}

const allCapabilities: FinanceCapability[] = [
  "finance.query",
  "finance.record",
  "finance.allocate",
  "finance.correct",
  "finance.export",
  "finance.communicate",
]

function commandFingerprint(command: object) {
  return JSON.stringify(command)
}

function beginCommand(ledger: FamilyLedger, command: FinanceCommand, capability: FinanceCapability) {
  const existing = ledger.events.find((event) => event.idempotencyKey === command.idempotencyKey)
  const fingerprint = commandFingerprint(command)
  if (existing) {
    if (existing.fingerprint !== fingerprint) throw new Error("Idempotency key reused with different input")
    return { repeated: true, fingerprint }
  }
  if (!command.actorCapabilities.includes(capability)) throw new Error(`Missing capability: ${capability}`)
  if (ledger.sourceState !== "TRUSTED") throw new Error("Ledger source conflict must be reconciled before mutation")
  if (ledger.revision !== command.expectedRevision) {
    throw new Error(`Ledger revision conflict: expected ${command.expectedRevision}, found ${ledger.revision}`)
  }
  return { repeated: false, fingerprint }
}

function appendEvent(
  ledger: FamilyLedger,
  command: FinanceCommand,
  event: Pick<FamilyLedgerEvent, "kind" | "detail">,
  fingerprint: string,
  patch: Partial<FamilyLedger>,
) {
  const resultingRevision = ledger.revision + 1
  return {
    ...ledger,
    ...patch,
    revision: resultingRevision,
    events: [
      ...ledger.events,
      {
        eventId: command.eventId,
        idempotencyKey: command.idempotencyKey,
        fingerprint,
        kind: event.kind,
        actorId: command.actorId,
        occurredAt: command.occurredAt,
        detail: event.detail,
        resultingRevision,
      },
    ],
  }
}

function isPaymentReversed(ledger: FamilyLedger, paymentId: string) {
  return ledger.reversals.some((reversal) => reversal.paymentId === paymentId)
}

function activeAllocations(ledger: FamilyLedger) {
  return ledger.allocations.filter((allocation) => !isPaymentReversed(ledger, allocation.paymentId))
}

function allocatedToPayment(ledger: FamilyLedger, paymentId: string) {
  return activeAllocations(ledger)
    .filter((allocation) => allocation.paymentId === paymentId)
    .reduce((sum, allocation) => sum + allocation.amountMinor, 0)
}

function allocatedToCharge(ledger: FamilyLedger, chargeId: string) {
  return activeAllocations(ledger)
    .filter((allocation) => allocation.chargeId === chargeId)
    .reduce((sum, allocation) => sum + allocation.amountMinor, 0)
}

export function findPaymentDuplicateCandidates(ledger: FamilyLedger, draft: PaymentDraft) {
  const paidAt = new Date(draft.paidAt).getTime()
  return ledger.payments.filter((payment) => {
    const sameReference = draft.reference.trim() && payment.reference.trim().toLowerCase() === draft.reference.trim().toLowerCase()
    const sameMoney = payment.amountMinor === draft.amountMinor && payment.currency === draft.currency
    const withinThreeDays = Math.abs(new Date(payment.paidAt).getTime() - paidAt) <= 3 * 24 * 60 * 60 * 1000
    return Boolean(sameReference || (sameMoney && withinThreeDays))
  })
}

export function createFamilyLedgerFixture(): FamilyLedger {
  return {
    id: "ledger-family-rahal",
    family: {
      id: "family-rahal",
      displayName: "Rahal family",
      childName: "Alma Rahal",
      branch: "Riverside",
    },
    currency: "USD",
    revision: 0,
    sourceState: "TRUSTED",
    draftPayment: {
      amountMinor: 118000,
      currency: "USD",
      paidAt: "2026-07-14T09:15:00+01:00",
      method: "TRANSFER",
      reference: "BANK-442",
      evidenceFilename: "bank-transfer-442.pdf",
    },
    charges: [
      {
        id: "charge-october",
        description: "October tuition",
        dueAt: "2026-07-01T00:00:00+01:00",
        amountMinor: 50000,
        currency: "USD",
        revision: 4,
        provenance: "LEGACY_ACCOUNTING",
      },
      {
        id: "charge-november",
        description: "November tuition",
        dueAt: "2026-08-01T00:00:00+01:00",
        amountMinor: 50000,
        currency: "USD",
        revision: 2,
        provenance: "LEGACY_ACCOUNTING",
      },
      {
        id: "charge-bus",
        description: "Autumn bus service",
        dueAt: "2026-07-01T00:00:00+01:00",
        amountMinor: 18000,
        currency: "USD",
        revision: 1,
        provenance: "LEGACY_ACCOUNTING",
      },
    ],
    payments: [
      {
        id: "payment-imported-reversed",
        amountMinor: 118000,
        currency: "USD",
        paidAt: "2026-07-10T09:15:00+01:00",
        method: "TRANSFER",
        reference: "BANK-441",
        recordedRevision: 1,
        provenance: "LEGACY_PAYMENT",
        recordedById: "legacy-user-18",
      },
    ],
    allocations: [],
    reversals: [
      {
        id: "reversal-imported-payment",
        paymentId: "payment-imported-reversed",
        reason: "Imported payment was reversed in the source system",
        recordedRevision: 2,
        recordedById: "legacy-user-22",
        recordedAt: "2026-07-10T10:00:00+01:00",
      },
    ],
    receipts: [],
    events: [],
  }
}

export function createConflictedFamilyLedgerFixture() {
  return {
    ...createFamilyLedgerFixture(),
    sourceState: "CONFLICT" as const,
    sourceConflict: {
      paymentTotalMinor: 118000,
      accountingPaymentTotalMinor: 0,
      explanation: "Payment rows and accounting payment entries disagree. No canonical balance is asserted.",
    },
  }
}

export function recordLedgerPayment(
  ledger: FamilyLedger,
  command: FinanceCommand & {
    paymentId: string
    draft: PaymentDraft
    duplicateDecision?: "CONFIRMED_DISTINCT"
    duplicateReason?: string
  },
) {
  const started = beginCommand(ledger, command, "finance.record")
  if (started.repeated) return ledger
  if (!Number.isInteger(command.draft.amountMinor) || command.draft.amountMinor <= 0) {
    throw new Error("Payment amount must be a positive integer in minor units")
  }
  if (command.draft.currency !== ledger.currency) throw new Error("Payment currency does not match ledger currency")
  if (!command.draft.reference.trim()) throw new Error("Payment reference is required")
  if (ledger.payments.some((payment) => payment.id === command.paymentId)) throw new Error("Payment ID already exists")
  const duplicates = findPaymentDuplicateCandidates(ledger, command.draft)
  if (duplicates.length && command.duplicateDecision !== "CONFIRMED_DISTINCT") {
    throw new Error("Duplicate review required")
  }
  if (duplicates.length && !command.duplicateReason?.trim()) {
    throw new Error("Duplicate decision reason is required")
  }
  const recordedRevision = ledger.revision + 1
  return appendEvent(
    ledger,
    command,
    {
      kind: "PAYMENT_RECORDED",
      detail: duplicates.length
        ? `Payment recorded after duplicate review: ${command.duplicateReason!.trim()}`
        : "Payment recorded as an immutable ledger event.",
    },
    started.fingerprint,
    {
      draftPayment: undefined,
      payments: [
        ...ledger.payments,
        {
          id: command.paymentId,
          ...command.draft,
          recordedRevision,
          provenance: "MODERN_PAYMENT",
          recordedById: command.actorId,
        },
      ],
    },
  )
}

export function allocateLedgerPayment(
  ledger: FamilyLedger,
  command: FinanceCommand & {
    paymentId: string
    expectedPaymentRevision: number
    lines: Array<{ allocationId: string; chargeId: string; expectedChargeRevision: number; amountMinor: number }>
  },
) {
  const started = beginCommand(ledger, command, "finance.allocate")
  if (started.repeated) return ledger
  const payment = ledger.payments.find((item) => item.id === command.paymentId)
  if (!payment || isPaymentReversed(ledger, payment.id)) throw new Error("Active payment not found")
  if (payment.recordedRevision !== command.expectedPaymentRevision) throw new Error("Payment revision conflict")
  if (!command.lines.length) throw new Error("At least one allocation is required")
  if (new Set(command.lines.map((line) => line.allocationId)).size !== command.lines.length) {
    throw new Error("Allocation IDs must be unique")
  }
  if (command.lines.some((line) => !Number.isInteger(line.amountMinor) || line.amountMinor <= 0)) {
    throw new Error("Allocation amount must be a positive integer in minor units")
  }
  const unallocated = payment.amountMinor - allocatedToPayment(ledger, payment.id)
  const requested = command.lines.reduce((sum, line) => sum + line.amountMinor, 0)
  if (requested > unallocated) throw new Error("Allocation exceeds unallocated payment amount")

  const requestedByCharge = new Map<string, number>()
  for (const line of command.lines) {
    if (ledger.allocations.some((allocation) => allocation.id === line.allocationId)) {
      throw new Error("Allocation ID already exists")
    }
    const charge = ledger.charges.find((item) => item.id === line.chargeId)
    if (!charge) throw new Error(`Charge not found: ${line.chargeId}`)
    if (charge.revision !== line.expectedChargeRevision) throw new Error(`Charge revision conflict: ${line.chargeId}`)
    if (charge.currency !== payment.currency) throw new Error("Allocation currency mismatch")
    requestedByCharge.set(line.chargeId, (requestedByCharge.get(line.chargeId) ?? 0) + line.amountMinor)
  }
  for (const [chargeId, amount] of requestedByCharge) {
    const charge = ledger.charges.find((item) => item.id === chargeId)!
    const outstanding = charge.amountMinor - allocatedToCharge(ledger, chargeId)
    if (amount > outstanding) throw new Error(`Allocation exceeds charge outstanding: ${chargeId}`)
  }

  const recordedRevision = ledger.revision + 1
  return appendEvent(
    ledger,
    command,
    { kind: "ALLOCATED", detail: `${requested} minor units allocated atomically across ${command.lines.length} charge(s).` },
    started.fingerprint,
    {
      allocations: [
        ...ledger.allocations,
        ...command.lines.map((line) => ({
          id: line.allocationId,
          paymentId: payment.id,
          chargeId: line.chargeId,
          amountMinor: line.amountMinor,
          recordedRevision,
          recordedById: command.actorId,
          recordedAt: command.occurredAt,
        })),
      ],
    },
  )
}

export function generateLedgerReceipt(
  ledger: FamilyLedger,
  command: FinanceCommand & { paymentId: string; expectedPaymentRevision: number; receiptId: string },
) {
  const started = beginCommand(ledger, command, "finance.export")
  if (started.repeated) return ledger
  const payment = ledger.payments.find((item) => item.id === command.paymentId)
  if (!payment || isPaymentReversed(ledger, payment.id)) throw new Error("Active payment not found")
  if (payment.recordedRevision !== command.expectedPaymentRevision) throw new Error("Payment revision conflict")
  if (allocatedToPayment(ledger, payment.id) !== payment.amountMinor) {
    throw new Error("Receipt requires a fully allocated payment")
  }
  if (ledger.receipts.some((receipt) => receipt.paymentId === payment.id || receipt.id === command.receiptId)) {
    throw new Error("Receipt already exists")
  }
  const sourceRevision = ledger.revision + 1
  return appendEvent(
    ledger,
    command,
    { kind: "RECEIPT_GENERATED", detail: "Receipt generated from the confirmed payment and allocation result." },
    started.fingerprint,
    {
      receipts: [
        ...ledger.receipts,
        {
          id: command.receiptId,
          paymentId: payment.id,
          generatedAt: command.occurredAt,
          generatedById: command.actorId,
          sourceRevision,
        },
      ],
    },
  )
}

export function deliverLedgerReceipt(
  ledger: FamilyLedger,
  command: FinanceCommand & { receiptId: string; expectedReceiptRevision: number; deliveryReceiptId: string },
) {
  const started = beginCommand(ledger, command, "finance.communicate")
  if (started.repeated) return ledger
  const receipt = ledger.receipts.find((item) => item.id === command.receiptId)
  if (!receipt) throw new Error("Receipt not found")
  if (receipt.sourceRevision !== command.expectedReceiptRevision) throw new Error("Receipt revision conflict")
  if (receipt.deliveredAt) throw new Error("Receipt is already delivered")
  if (!command.deliveryReceiptId.trim()) throw new Error("Delivery receipt ID is required")
  return appendEvent(
    ledger,
    command,
    { kind: "RECEIPT_DELIVERED", detail: "Receipt delivery recorded separately from payment allocation." },
    started.fingerprint,
    {
      receipts: ledger.receipts.map((item) =>
        item.id === receipt.id
          ? { ...item, deliveredAt: command.occurredAt, deliveryReceiptId: command.deliveryReceiptId.trim() }
          : item,
      ),
    },
  )
}

export function reverseLedgerPayment(
  ledger: FamilyLedger,
  command: FinanceCommand & {
    paymentId: string
    expectedPaymentRevision: number
    expectedAllocationIds: readonly string[]
    reversalId: string
    reason: string
  },
) {
  const started = beginCommand(ledger, command, "finance.correct")
  if (started.repeated) return ledger
  const payment = ledger.payments.find((item) => item.id === command.paymentId)
  if (!payment || isPaymentReversed(ledger, payment.id)) throw new Error("Active payment not found")
  if (payment.recordedRevision !== command.expectedPaymentRevision) throw new Error("Payment revision conflict")
  if (!command.reason.trim()) throw new Error("Reversal reason is required")
  const activeIds = activeAllocations(ledger)
    .filter((allocation) => allocation.paymentId === payment.id)
    .map((allocation) => allocation.id)
    .sort()
  const expectedIds = [...command.expectedAllocationIds].sort()
  if (JSON.stringify(activeIds) !== JSON.stringify(expectedIds)) throw new Error("Allocation set changed before reversal")
  if (ledger.reversals.some((reversal) => reversal.id === command.reversalId)) throw new Error("Reversal ID already exists")
  const recordedRevision = ledger.revision + 1
  return appendEvent(
    ledger,
    command,
    { kind: "PAYMENT_REVERSED", detail: `Payment reversed without deleting history: ${command.reason.trim()}` },
    started.fingerprint,
    {
      reversals: [
        ...ledger.reversals,
        {
          id: command.reversalId,
          paymentId: payment.id,
          reason: command.reason.trim(),
          recordedRevision,
          recordedById: command.actorId,
          recordedAt: command.occurredAt,
        },
      ],
    },
  )
}

export function projectFamilyLedger(ledger: FamilyLedger) {
  const activePayments = ledger.payments.filter((payment) => !isPaymentReversed(ledger, payment.id))
  const activeAllocationRows = activeAllocations(ledger)
  const chargeTotalMinor = ledger.charges.reduce((sum, charge) => sum + charge.amountMinor, 0)
  const paymentTotalMinor = activePayments.reduce((sum, payment) => sum + payment.amountMinor, 0)
  const allocatedTotalMinor = activeAllocationRows.reduce((sum, allocation) => sum + allocation.amountMinor, 0)
  const unallocatedCreditMinor = paymentTotalMinor - allocatedTotalMinor
  const invoiceOutstandingMinor = chargeTotalMinor - allocatedTotalMinor
  const familyBalanceMinor = chargeTotalMinor - paymentTotalMinor
  const duplicateCandidates = ledger.draftPayment
    ? findPaymentDuplicateCandidates(ledger, ledger.draftPayment)
    : []
  const latestModernPayment = [...activePayments]
    .reverse()
    .find((payment) => payment.provenance === "MODERN_PAYMENT")
  const latestReceipt = latestModernPayment
    ? ledger.receipts.find((receipt) => receipt.paymentId === latestModernPayment.id)
    : undefined
  const latestEvent = ledger.events.at(-1)
  let status: FamilyLedgerStatus

  if (ledger.sourceState === "CONFLICT") status = "SOURCE_CONFLICT"
  else if (ledger.draftPayment && duplicateCandidates.length) status = "DUPLICATE_REVIEW"
  else if (latestEvent?.kind === "PAYMENT_REVERSED") status = "CORRECTION_RECORDED"
  else if (!latestModernPayment) status = "READY_TO_RECORD"
  else {
    const allocated = allocatedToPayment(ledger, latestModernPayment.id)
    if (allocated === 0) status = "NEEDS_ALLOCATION"
    else if (allocated < latestModernPayment.amountMinor) status = "PARTIALLY_ALLOCATED"
    else if (!latestReceipt) status = "RECEIPT_READY"
    else if (!latestReceipt.deliveredAt) status = "DELIVERY_PENDING"
    else status = "SETTLED"
  }

  return {
    status,
    chargeTotalMinor,
    paymentTotalMinor,
    allocatedTotalMinor,
    unallocatedCreditMinor,
    invoiceOutstandingMinor,
    familyBalanceMinor,
    isReconciled: invoiceOutstandingMinor - unallocatedCreditMinor === familyBalanceMinor,
    duplicateCandidates,
    latestModernPayment,
    latestReceipt,
    chargeRows: ledger.charges.map((charge) => {
      const allocatedMinor = allocatedToCharge(ledger, charge.id)
      return { ...charge, allocatedMinor, outstandingMinor: charge.amountMinor - allocatedMinor }
    }),
    latestEvent,
  }
}

export function projectFamilyLedgerForParent(ledger: FamilyLedger) {
  if (ledger.sourceState !== "TRUSTED") {
    return { status: "UNAVAILABLE" as const, family: ledger.family, currency: ledger.currency, charges: [], payments: [], receipts: [] }
  }
  const projection = projectFamilyLedger(ledger)
  return {
    status: "AVAILABLE" as const,
    family: ledger.family,
    currency: ledger.currency,
    balanceMinor: projection.familyBalanceMinor,
    charges: projection.chargeRows.map((charge) => ({
      id: charge.id,
      description: charge.description,
      dueAt: charge.dueAt,
      amountMinor: charge.amountMinor,
      outstandingMinor: charge.outstandingMinor,
    })),
    payments: ledger.payments.map((payment) => ({
      id: payment.id,
      amountMinor: payment.amountMinor,
      paidAt: payment.paidAt,
      method: payment.method,
      reversed: isPaymentReversed(ledger, payment.id),
    })),
    receipts: ledger.receipts
      .filter((receipt) => receipt.deliveredAt)
      .map((receipt) => ({ id: receipt.id, paymentId: receipt.paymentId, deliveredAt: receipt.deliveredAt! })),
  }
}

function baseCommand(ledger: FamilyLedger, id: string, actorId = "finance-nadia") {
  return {
    eventId: id,
    idempotencyKey: `${id}-once`,
    actorId,
    occurredAt: "2026-07-14T09:30:00+01:00",
    expectedRevision: ledger.revision,
    actorCapabilities: allCapabilities,
  }
}

export function createFamilyLedgerScenario(stage: FamilyLedgerFixtureStage) {
  if (stage === "source-conflict") return createConflictedFamilyLedgerFixture()
  let ledger = createFamilyLedgerFixture()
  if (stage === "duplicate-review") {
    return { ...ledger, draftPayment: { ...ledger.draftPayment!, reference: "BANK-441" } }
  }
  if (stage === "ready-to-record") return ledger
  ledger = recordLedgerPayment(ledger, {
    ...baseCommand(ledger, "record-payment"),
    paymentId: "payment-bank-442",
    draft: ledger.draftPayment!,
  })
  if (stage === "needs-allocation") return ledger
  const payment = projectFamilyLedger(ledger).latestModernPayment!
  ledger = allocateLedgerPayment(ledger, {
    ...baseCommand(ledger, "allocate-october"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    lines: [{ allocationId: "allocation-october", chargeId: "charge-october", expectedChargeRevision: 4, amountMinor: 50000 }],
  })
  if (stage === "partially-allocated") return ledger
  ledger = allocateLedgerPayment(ledger, {
    ...baseCommand(ledger, "allocate-remainder"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    lines: [
      { allocationId: "allocation-november", chargeId: "charge-november", expectedChargeRevision: 2, amountMinor: 50000 },
      { allocationId: "allocation-bus", chargeId: "charge-bus", expectedChargeRevision: 1, amountMinor: 18000 },
    ],
  })
  if (stage === "receipt-ready") return ledger
  ledger = generateLedgerReceipt(ledger, {
    ...baseCommand(ledger, "generate-receipt"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    receiptId: "receipt-bank-442",
  })
  if (stage === "delivery-pending") return ledger
  const receipt = projectFamilyLedger(ledger).latestReceipt!
  ledger = deliverLedgerReceipt(ledger, {
    ...baseCommand(ledger, "deliver-receipt"),
    receiptId: receipt.id,
    expectedReceiptRevision: receipt.sourceRevision,
    deliveryReceiptId: "family-delivery-442",
  })
  if (stage === "settled") return ledger
  return reverseLedgerPayment(ledger, {
    ...baseCommand(ledger, "reverse-payment", "manager-maya"),
    paymentId: payment.id,
    expectedPaymentRevision: payment.recordedRevision,
    expectedAllocationIds: ledger.allocations.filter((allocation) => allocation.paymentId === payment.id).map((allocation) => allocation.id),
    reversalId: "reversal-bank-442",
    reason: "Bank confirmed the transfer was returned to the family",
  })
}

export function formatMinorUnits(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value / 100)
}
