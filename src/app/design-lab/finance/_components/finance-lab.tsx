"use client"

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Landmark,
  Link2,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react"
import { useMemo, useRef, useState, useSyncExternalStore } from "react"
import {
  allocateLedgerPayment,
  createFamilyLedgerScenario,
  deliverLedgerReceipt,
  formatMinorUnits,
  generateLedgerReceipt,
  projectFamilyLedger,
  projectFamilyLedgerForParent,
  recordLedgerPayment,
  reverseLedgerPayment,
  type FamilyLedger,
  type FamilyLedgerFixtureStage,
  type FamilyLedgerStatus,
  type FinanceCapability,
} from "@/lib/redesign-family-ledger-contracts"
import { FinanceAxeHarness } from "./finance-axe-harness"

type FinanceRole = "finance" | "manager" | "parent"

const stages: Array<{ value: FamilyLedgerFixtureStage; label: string }> = [
  { value: "source-conflict", label: "Source conflict" },
  { value: "ready-to-record", label: "Ready to record" },
  { value: "duplicate-review", label: "Duplicate review" },
  { value: "needs-allocation", label: "Needs allocation" },
  { value: "partially-allocated", label: "Partial allocation" },
  { value: "receipt-ready", label: "Receipt ready" },
  { value: "delivery-pending", label: "Delivery pending" },
  { value: "settled", label: "Settled" },
  { value: "correction-recorded", label: "Correction recorded" },
]

const roleLabels: Record<FinanceRole, string> = {
  finance: "Finance coordinator",
  manager: "Nursery manager",
  parent: "Alma's parent",
}

const capabilities: Record<FinanceRole, FinanceCapability[]> = {
  finance: ["finance.query", "finance.record", "finance.allocate", "finance.export", "finance.communicate"],
  manager: ["finance.query", "finance.correct"],
  parent: ["finance.query"],
}

const statusContent: Record<FamilyLedgerStatus, { label: string; title: string; detail: string }> = {
  SOURCE_CONFLICT: {
    label: "Balance withheld",
    title: "Source reconciliation required",
    detail: "Payment rows and accounting entries disagree, so the product does not assert a canonical balance.",
  },
  READY_TO_RECORD: {
    label: "Charges confirmed",
    title: "Record the incoming payment",
    detail: "The family, amount, date, method, reference, and evidence are ready for duplicate preflight.",
  },
  DUPLICATE_REVIEW: {
    label: "Review before recording",
    title: "A possible duplicate exists",
    detail: "A corrected historical payment shares this reference. Confirm why this bank event is distinct.",
  },
  NEEDS_ALLOCATION: {
    label: "Payment recorded",
    title: "Allocate the payment",
    detail: "The family balance reflects the payment, but invoice balances remain open until allocation.",
  },
  PARTIALLY_ALLOCATED: {
    label: "Allocation incomplete",
    title: "Allocate the remaining credit",
    detail: "One charge is settled. Remaining credit and invoice outstanding still reconcile exactly.",
  },
  RECEIPT_READY: {
    label: "Allocation complete",
    title: "Generate the receipt",
    detail: "Payment, allocations, invoice balances, and family balance agree.",
  },
  DELIVERY_PENDING: {
    label: "Receipt generated",
    title: "Deliver the confirmed receipt",
    detail: "Receipt generation is complete; family communication remains a separate event.",
  },
  SETTLED: {
    label: "Receipt delivered",
    title: "Account settled",
    detail: "Every charge is allocated, the balance is zero, and delivery has its own receipt.",
  },
  CORRECTION_RECORDED: {
    label: "History retained",
    title: "Payment reversal recorded",
    detail: "The returned transfer reopened the charges without deleting payment, allocation, or receipt history.",
  },
}

function subscribeToLocation(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange)
  return () => window.removeEventListener("popstate", onStoreChange)
}

function getLocationSnapshot() {
  return window.location.search
}

function parseStage(search: string): FamilyLedgerFixtureStage {
  const value = new URLSearchParams(search).get("state")
  return stages.some((stage) => stage.value === value)
    ? (value as FamilyLedgerFixtureStage)
    : "ready-to-record"
}

function parseRole(search: string): FinanceRole {
  const value = new URLSearchParams(search).get("role")
  return value && value in roleLabels ? (value as FinanceRole) : "finance"
}

function commandBase(ledger: FamilyLedger, id: string, role: FinanceRole) {
  const actorIds: Record<FinanceRole, string> = {
    finance: "finance-nadia",
    manager: "manager-maya",
    parent: "parent-alma",
  }
  return {
    eventId: `${id}-${ledger.revision}`,
    idempotencyKey: `${id}-${ledger.revision}-once`,
    actorId: actorIds[role],
    occurredAt: "2026-07-14T09:35:00+01:00",
    expectedRevision: ledger.revision,
    actorCapabilities: capabilities[role],
  }
}

function paymentMethodLabel(value: string) {
  if (value === "TRANSFER") return "Bank transfer"
  if (value === "CREDIT_CARD") return "Credit card"
  if (value === "CHECK") return "Cheque"
  return "Cash"
}

export function FinanceLab() {
  const search = useSyncExternalStore(subscribeToLocation, getLocationSnapshot, () => "")
  const stage = parseStage(search)
  const role = parseRole(search)
  const axeAudit = new URLSearchParams(search).get("audit") === "axe"
  return <FinanceScenario key={`${stage}:${role}:${axeAudit}`} stage={stage} initialRole={role} axeAudit={axeAudit} />
}

function FinanceScenario({
  stage,
  initialRole,
  axeAudit,
}: {
  stage: FamilyLedgerFixtureStage
  initialRole: FinanceRole
  axeAudit: boolean
}) {
  const [ledger, setLedger] = useState(() => createFamilyLedgerScenario(stage))
  const [role, setRole] = useState(initialRole)
  const [announcement, setAnnouncement] = useState("")
  const [error, setError] = useState("")
  const actionHeadingRef = useRef<HTMLHeadingElement>(null)
  const projection = useMemo(() => projectFamilyLedger(ledger), [ledger])
  const parentProjection = useMemo(() => projectFamilyLedgerForParent(ledger), [ledger])
  const content = statusContent[projection.status]

  function focusAction() {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => actionHeadingRef.current?.focus())
    })
  }

  function accept(next: FamilyLedger, message: string) {
    setLedger(next)
    setError("")
    setAnnouncement(message)
    focusAction()
  }

  function runAction() {
    try {
      if ((projection.status === "READY_TO_RECORD" || projection.status === "DUPLICATE_REVIEW") && role === "finance") {
        accept(
          recordLedgerPayment(ledger, {
            ...commandBase(ledger, "record-payment", role),
            paymentId: `payment-bank-${ledger.revision + 442}`,
            draft: ledger.draftPayment!,
            ...(projection.status === "DUPLICATE_REVIEW"
              ? {
                  duplicateDecision: "CONFIRMED_DISTINCT" as const,
                  duplicateReason: "Bank statement confirms a different settlement trace",
                }
              : {}),
          }),
          "Payment recorded. Family balance updated and allocation work remains open.",
        )
        return
      }
      if (projection.status === "NEEDS_ALLOCATION" && role === "finance" && projection.latestModernPayment) {
        const payment = projection.latestModernPayment
        accept(
          allocateLedgerPayment(ledger, {
            ...commandBase(ledger, "allocate-october", role),
            paymentId: payment.id,
            expectedPaymentRevision: payment.recordedRevision,
            lines: [{ allocationId: `allocation-october-${ledger.revision}`, chargeId: "charge-october", expectedChargeRevision: 4, amountMinor: 50000 }],
          }),
          "October tuition settled. Sixty-eight thousand minor units remain to allocate.",
        )
        return
      }
      if (projection.status === "PARTIALLY_ALLOCATED" && role === "finance" && projection.latestModernPayment) {
        const payment = projection.latestModernPayment
        accept(
          allocateLedgerPayment(ledger, {
            ...commandBase(ledger, "allocate-remainder", role),
            paymentId: payment.id,
            expectedPaymentRevision: payment.recordedRevision,
            lines: [
              { allocationId: `allocation-november-${ledger.revision}`, chargeId: "charge-november", expectedChargeRevision: 2, amountMinor: 50000 },
              { allocationId: `allocation-bus-${ledger.revision}`, chargeId: "charge-bus", expectedChargeRevision: 1, amountMinor: 18000 },
            ],
          }),
          "Remaining credit allocated atomically. Payment and invoice balances now agree.",
        )
        return
      }
      if (projection.status === "RECEIPT_READY" && role === "finance" && projection.latestModernPayment) {
        const payment = projection.latestModernPayment
        accept(
          generateLedgerReceipt(ledger, {
            ...commandBase(ledger, "generate-receipt", role),
            paymentId: payment.id,
            expectedPaymentRevision: payment.recordedRevision,
            receiptId: `receipt-${payment.id}`,
          }),
          "Receipt generated from the confirmed allocation result. Delivery remains open.",
        )
        return
      }
      if (projection.status === "DELIVERY_PENDING" && role === "finance" && projection.latestReceipt) {
        accept(
          deliverLedgerReceipt(ledger, {
            ...commandBase(ledger, "deliver-receipt", role),
            receiptId: projection.latestReceipt.id,
            expectedReceiptRevision: projection.latestReceipt.sourceRevision,
            deliveryReceiptId: `delivery-${ledger.revision + 1}`,
          }),
          "Receipt delivered with a separate communication receipt.",
        )
        return
      }
      if (projection.status === "SETTLED" && role === "manager" && projection.latestModernPayment) {
        const payment = projection.latestModernPayment
        accept(
          reverseLedgerPayment(ledger, {
            ...commandBase(ledger, "reverse-payment", role),
            paymentId: payment.id,
            expectedPaymentRevision: payment.recordedRevision,
            expectedAllocationIds: ledger.allocations.filter((item) => item.paymentId === payment.id).map((item) => item.id),
            reversalId: `reversal-${payment.id}`,
            reason: "Bank confirmed the transfer was returned to the family",
          }),
          "Payment reversal appended. Original payment, allocation, and receipt evidence remains available.",
        )
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The finance transition could not be accepted.")
    }
  }

  function resetScenario() {
    setLedger(createFamilyLedgerScenario(stage))
    setError("")
    setAnnouncement("Finance scenario reset to its source fixture.")
    focusAction()
  }

  const primaryLabel = (() => {
    if (projection.status === "READY_TO_RECORD") return "Record payment"
    if (projection.status === "DUPLICATE_REVIEW") return "Confirm distinct payment"
    if (projection.status === "NEEDS_ALLOCATION") return "Allocate October tuition"
    if (projection.status === "PARTIALLY_ALLOCATED") return "Allocate remaining credit"
    if (projection.status === "RECEIPT_READY") return "Generate receipt"
    if (projection.status === "DELIVERY_PENDING") return "Deliver receipt"
    if (projection.status === "SETTLED") return "Record payment reversal"
    return "No permitted action"
  })()

  const canRun =
    (role === "finance" && ["READY_TO_RECORD", "DUPLICATE_REVIEW", "NEEDS_ALLOCATION", "PARTIALLY_ALLOCATED", "RECEIPT_READY", "DELIVERY_PENDING"].includes(projection.status)) ||
    (role === "manager" && projection.status === "SETTLED")

  return (
    <div className="finance-lab" data-axe-audit={axeAudit ? "axe" : "off"} data-status={projection.status}>
      <FinanceAxeHarness enabled={axeAudit} signature={`finance:${stage}:${role}:${projection.status}:${ledger.revision}`} />
      <header className="finance-topbar">
        <strong>Kiddz Online</strong>
        <span>Family finance / Riverside / Rahal</span>
        <div className="finance-topbar__controls">
          <label><span>Scenario</span><select aria-label="Finance test scenario" value={stage} onChange={(event) => { const url = new URL(window.location.href); url.searchParams.set("state", event.target.value); window.history.pushState({}, "", url); window.dispatchEvent(new PopStateEvent("popstate")) }}>{stages.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label><span>Role</span><select aria-label="Finance viewer role" value={role} onChange={(event) => setRole(event.target.value as FinanceRole)}>{(Object.keys(roleLabels) as FinanceRole[]).map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}</select></label>
          <button type="button" onClick={resetScenario} title="Reset finance scenario" aria-label="Reset finance scenario"><RefreshCw aria-hidden="true" /></button>
        </div>
      </header>

      <main className="finance-main">
        <header className="finance-heading">
          <div><span>One accountable family ledger</span><h1>Every payment explains the balance.</h1></div>
          <p>Record money once, allocate it against named charges, and keep invoice, family, receipt, parent, and correction views derived from the same accepted events.</p>
        </header>

        <dl className="finance-context" aria-label="Family finance context">
          <div><dt>Family</dt><dd>Rahal family</dd></div>
          <div><dt>Child</dt><dd>Alma Rahal</dd></div>
          <div><dt>Branch</dt><dd>Riverside</dd></div>
          <div><dt>Ledger revision</dt><dd>{ledger.revision}</dd></div>
        </dl>

        {role === "parent" ? (
          <section className="finance-parent" aria-labelledby="finance-parent-title">
            {parentProjection.status === "UNAVAILABLE" ? (
              <><div className="finance-parent__mark finance-parent__mark--warning" aria-hidden="true"><AlertTriangle /></div><span>Family statement</span><h2 id="finance-parent-title" ref={actionHeadingRef} tabIndex={-1}>Balance temporarily unavailable</h2><p>The nursery is reconciling imported financial records. No contradictory balance or internal source detail is shown.</p></>
            ) : (
              <>
                <div className="finance-parent__mark" aria-hidden="true"><CircleDollarSign /></div><span>Family statement</span><h2 id="finance-parent-title" ref={actionHeadingRef} tabIndex={-1}>{formatMinorUnits(parentProjection.balanceMinor, parentProjection.currency)} balance</h2><p>Your current charges, payments, corrections, and delivered receipts are shown from the same family ledger.</p>
                <div className="finance-parent__summary"><div><span>Charges</span><strong>{formatMinorUnits(parentProjection.charges.reduce((sum, item) => sum + item.amountMinor, 0))}</strong></div><div><span>Payments</span><strong>{formatMinorUnits(parentProjection.payments.filter((item) => !item.reversed).reduce((sum, item) => sum + item.amountMinor, 0))}</strong></div><div><span>Receipts</span><strong>{parentProjection.receipts.length}</strong></div></div>
                <div className="finance-parent__rows">{parentProjection.charges.map((charge) => <div key={charge.id}><span><strong>{charge.description}</strong><small>Due {charge.dueAt.slice(0, 10)}</small></span><span><strong>{formatMinorUnits(charge.amountMinor)}</strong><small>{formatMinorUnits(charge.outstandingMinor)} outstanding</small></span></div>)}</div>
                {parentProjection.receipts.length ? <div className="finance-parent__receipt"><CheckCircle2 aria-hidden="true" /><span><strong>Receipt delivered</strong><small>{parentProjection.receipts.at(-1)?.deliveredAt.slice(0, 16).replace("T", " ")}</small></span></div> : null}
              </>
            )}
          </section>
        ) : (
          <>
            <section className="finance-summary" aria-labelledby="finance-summary-title">
              <div className="finance-summary__icon" aria-hidden="true">{projection.status === "SOURCE_CONFLICT" ? <AlertTriangle /> : projection.status === "SETTLED" ? <ShieldCheck /> : projection.status === "CORRECTION_RECORDED" ? <RotateCcw /> : <Landmark />}</div>
              <div><span>{content.label}</span><h2 id="finance-summary-title">{content.title}</h2><p>{content.detail}</p></div>
              <dl><div><dt>Family balance</dt><dd>{ledger.sourceState === "TRUSTED" ? formatMinorUnits(projection.familyBalanceMinor) : "Withheld"}</dd></div><div><dt>Invoice outstanding</dt><dd>{ledger.sourceState === "TRUSTED" ? formatMinorUnits(projection.invoiceOutstandingMinor) : "Withheld"}</dd></div><div><dt>Unallocated credit</dt><dd>{ledger.sourceState === "TRUSTED" ? formatMinorUnits(projection.unallocatedCreditMinor) : "Withheld"}</dd></div></dl>
            </section>

            {ledger.sourceConflict ? <section className="finance-conflict" aria-labelledby="finance-conflict-title"><AlertTriangle aria-hidden="true" /><div><span>Compatibility source conflict</span><h2 id="finance-conflict-title">Payment rows and accounting entries disagree</h2><p>{ledger.sourceConflict.explanation}</p></div><dl><div><dt>Payment store</dt><dd>{formatMinorUnits(ledger.sourceConflict.paymentTotalMinor)}</dd></div><div><dt>Accounting payment entries</dt><dd>{formatMinorUnits(ledger.sourceConflict.accountingPaymentTotalMinor)}</dd></div></dl></section> : null}

            <div className="finance-grid">
              <div className="finance-source-plane">
                <section className="finance-charges" aria-labelledby="finance-charges-title">
                  <header><div><span>Invoice charges</span><h2 id="finance-charges-title">Allocation destination</h2></div><span>{projection.chargeRows.filter((item) => item.outstandingMinor > 0).length} open</span></header>
                  <div>{projection.chargeRows.map((charge) => <article key={charge.id} data-settled={charge.outstandingMinor === 0}><div className="finance-row__mark" aria-hidden="true">{charge.outstandingMinor === 0 ? <Check /> : <ReceiptText />}</div><div><span>{charge.provenance.toLowerCase().replaceAll("_", " ")}</span><h3>{charge.description}</h3><p>Due {charge.dueAt.slice(0, 10)} / source revision {charge.revision}</p></div><dl><div><dt>Charge</dt><dd>{formatMinorUnits(charge.amountMinor)}</dd></div><div><dt>Outstanding</dt><dd>{formatMinorUnits(charge.outstandingMinor)}</dd></div></dl></article>)}</div>
                </section>

                <section className="finance-payments" aria-labelledby="finance-payments-title">
                  <header><div><span>Immutable payments</span><h2 id="finance-payments-title">Recorded money and corrections</h2></div><span>{ledger.payments.length} records</span></header>
                  <div>{ledger.payments.map((payment) => { const reversal = ledger.reversals.find((item) => item.paymentId === payment.id); return <article key={payment.id} data-reversed={Boolean(reversal)}><div className="finance-row__mark" aria-hidden="true">{reversal ? <RotateCcw /> : <CircleDollarSign />}</div><div><span>{payment.provenance.toLowerCase().replaceAll("_", " ")}</span><h3>{formatMinorUnits(payment.amountMinor)} / {payment.reference}</h3><p>{paymentMethodLabel(payment.method)} / paid {payment.paidAt.slice(0, 10)}</p>{reversal ? <small>Reversed: {reversal.reason}</small> : payment.evidenceFilename ? <small><FileCheck2 aria-hidden="true" />{payment.evidenceFilename}</small> : null}</div><span className="finance-payment-state">{reversal ? "Reversed" : "Active"}</span></article> })}</div>
                </section>

                <section className="finance-history" aria-labelledby="finance-history-title"><header><span>Append-only ledger history</span><h2 id="finance-history-title">{ledger.events.length} accepted events</h2></header>{ledger.events.length ? <ol>{ledger.events.map((event) => <li key={event.eventId}><span>{event.occurredAt.slice(11, 16)}</span><div><strong>{event.kind.toLowerCase().replaceAll("_", " ")}</strong><p>{event.detail}</p><small>Revision {event.resultingRevision} / {event.actorId}</small></div></li>)}</ol> : <p>No modern ledger transition has been accepted yet.</p>}</section>
              </div>

              <aside className="finance-action" aria-labelledby="finance-action-title">
                <header><span>Next action for {roleLabels[role]}</span><h2 id="finance-action-title" ref={actionHeadingRef} tabIndex={-1}>{canRun ? primaryLabel : "No permitted action in this state"}</h2></header>
                <div className="finance-action__source"><span>{projection.status.toLowerCase().replaceAll("_", " ")}</span><strong>{content.title}</strong><p>{canRun ? content.detail : `This transition belongs to another role. ${roleLabels[role]} can inspect the permitted ledger without inheriting its authority.`}</p><small>Expected ledger revision {ledger.revision}</small></div>
                {projection.duplicateCandidates.length ? <div className="finance-duplicate"><AlertTriangle aria-hidden="true" /><span><strong>{projection.duplicateCandidates.length} corrected record matches</strong><small>Reference {ledger.draftPayment?.reference} remains in historical duplicate detection.</small></span></div> : null}
                {error ? <p className="finance-error" role="alert">{error}</p> : null}
                <button className="finance-primary" type="button" disabled={!canRun} onClick={runAction}>{primaryLabel}<ArrowRight aria-hidden="true" /></button>
                <div className="finance-equation"><Link2 aria-hidden="true" /><div><strong>Reconciliation invariant</strong><p>Invoice outstanding - unallocated credit = family balance</p><span>{projection.isReconciled ? <><CheckCircle2 aria-hidden="true" />Values agree</> : <><AlertTriangle aria-hidden="true" />Conflict</>}</span></div></div>
              </aside>
            </div>
          </>
        )}
      </main>
      <p className="finance-announcement" aria-live="polite">{announcement}</p>
    </div>
  )
}
