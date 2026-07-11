# Kiddz Online Family Ledger and Payment Allocation Contract

**Date:** 2026-07-11
**Status:** Executable territory-neutral behavior contract; production persistence, reconciliation policy, and operator validation open
**Prototype:** `/design-lab/finance`
**Contract:** `src/lib/redesign-family-ledger-contracts.ts`

## Question

Can finance staff record, allocate, receipt, communicate, and correct a family payment while every invoice balance, family balance, parent view, and restored legacy output remains explainable from one event set?

## Current Product Audit

The restored product contains useful payment, accounting, receipt, reminder, alarm, parent, and native behavior, but no single ledger owns their agreement:

- `Payment` stores received money, method, category, coverage dates, reference, receipt evidence, and soft deletion.
- `AccountingEntry` separately stores fee, discount, payment, and adjustment amounts. It has no relation to `Payment`, allocation, actor, correction, or receipt.
- The child accounting balance is calculated from `AccountingEntry`, while total paid is calculated from `Payment` rows on the same screen.
- Recording a payment creates only `Payment`; it does not create or allocate an accounting payment entry, update a charge, or atomically reconcile the displayed balance.
- The organization accounting matrix loads all payments and groups them by category/month; it is a collection matrix, not an invoice ledger.
- `/accounting/invoice/[id]` renders the legacy receipt voucher for a `Payment`. There is no canonical invoice or charge-line object behind the route.
- Payment updates mutate amount, child, currency, date, method, category, status, reference, notes, and receipt in place. A changed child is not independently revalidated in the update path.
- Payment deletion sets `deletedAt` and deletes linked reminders, but records no reasoned reversal, original/current amount lineage, allocation consequence, or correction receipt.
- Parent and native finance endpoints return active `Payment` rows and preserve parser-safe legacy fields; they do not expose charge allocation or the separately calculated accounting balance.
- Imported `t_payments`, `t_accounting`, and `newpayment` provenance is preserved. Imported payment and accounting totals are not proven to describe the same canonical event.

The redesign must not choose one current store silently. A source conflict is an explicit state, not a zero balance.

## Executable Contract

### Money and source boundary

Every canonical amount uses integer minor units with one ledger currency. Binary floating-point values never decide allocation or balance.

The family ledger owns immutable charge, payment, allocation, receipt, delivery, and reversal records plus accepted transition events. Imported rows retain provenance. A compatibility source conflict includes both observed totals and withholds the canonical balance until reconciliation.

### Shared balance invariant

For trusted sources, every projection derives:

- charge total;
- active payment total;
- active allocation total;
- invoice outstanding;
- unallocated credit;
- family balance.

The required invariant is:

`invoice outstanding - unallocated credit = family balance`

Allocation changes invoice outstanding and unallocated credit by the same amount. It does not change family balance. Recording or reversing a payment changes family balance. The same accepted event set feeds staff, receipt, export, parent-safe, native, and compatibility projections.

### Transition boundary

Record, allocate, correct, export/receipt, and communicate are separate capabilities. Every accepted command requires event ID, idempotency key, actor, timestamp, and expected ledger revision.

Payment recording additionally requires positive integer minor units, exact currency, a reference, and duplicate preflight. Historical and reversed payments remain duplicate candidates. A possible duplicate requires an explicit distinct-payment decision and reason.

Allocation additionally requires:

- the payment's immutable recorded revision;
- every charge's current source revision;
- unique allocation IDs;
- positive integer amounts;
- matching currency;
- total not exceeding payment credit;
- each charge total not exceeding its outstanding amount.

All lines validate before any line is appended. A stale or invalid line rejects the entire command.

### Receipt, delivery, and correction

A receipt can be generated only after full allocation and is tied to that confirmed source revision. Delivery is a later communication event with its own provider receipt. Neither event changes allocation completion.

Correction appends a reasoned payment reversal after revalidating the exact active allocation set. It does not edit or delete the payment, allocations, receipt, or delivery history. Active allocations from the reversed payment stop contributing to invoice settlement, so the original charges reopen and the family balance changes from the same reversal event.

## Role Projection

- Finance coordinator: query, record, allocate, generate receipt, and communicate.
- Nursery manager: query and reasoned correction/reversal.
- Parent: relation-scoped read-only statement with charges, active/reversed payment state, balance, and delivered receipts.

Parents never receive staff actor IDs, duplicate-review reasons, internal event history, compatibility source totals, or unconfirmed receipts. A conflicted source produces a temporarily unavailable statement instead of a contradictory number.

## Interaction Fixture

The synthetic Rahal/Riverside fixture contains three imported charge lines totaling `$1,180.00` and one imported, already-reversed payment retained for duplicate detection.

1. A payment/accounting source disagreement produces `SOURCE_CONFLICT` and blocks mutation.
2. A distinct `$1,180.00` bank transfer passes preflight and records one immutable payment event.
3. A matching historical reference produces `DUPLICATE_REVIEW` until a reasoned distinct-payment decision is supplied.
4. The recorded payment produces zero family balance, `$1,180.00` invoice outstanding, and `$1,180.00` unallocated credit.
5. Allocating `$500.00` settles October while `$680.00` remains both outstanding and unallocated.
6. One atomic two-line allocation settles November and bus service.
7. Receipt generation follows full allocation; family delivery follows generation.
8. A bank-return correction appends reversal evidence, restores `$1,180.00` family and invoice balances, and retains all original payment, allocation, receipt, and delivery records.

## Browser Evidence

Agent Browser replayed nine deterministic lifecycle states at `1440 x 900`, `390 x 844`, and `320 x 568`, for 27 state/viewport combinations:

- source conflict;
- ready to record;
- duplicate review;
- needs allocation;
- partial allocation;
- receipt ready;
- delivery pending;
- settled;
- correction recorded.

Every combination retains one H1, the expected projected status, the visible reconciliation invariant, zero horizontal overflow, zero unnamed visible controls, and no undersized compact controls. Axe 4.12.1 completed all 27 runs with zero violations and zero incomplete findings.

Parent-specific runs prove that a source conflict publishes no competing totals, internal source objects, staff actors, or duplicate detail. The settled parent view exposes only the relation-safe `$0.00` balance, three settled charge lines, active payment total, and one delivered receipt. Accepted payment recording updates family balance to `$0.00`, leaves `$1,180.00` invoice outstanding and unallocated credit, appends one event, announces the result, and focuses allocation. Accepted reversal restores `$1,180.00` family and invoice balances, retains both payments and all prior events, announces the correction, and focuses the new state heading. A manager cannot record a payment, and finance cannot invoke manager correction through the fixture.

Focused ESLint, full TypeScript, the family-ledger verifier, medical incident, child workspace, Action Center, handover, live operations, search, navigation, route, state, territory-selection, Calls, native-parent, and accounting/invoice/parent-parser regressions pass. Database-backed payment push, payment/vaccination message-side-effect, and accounting email-template delivery verifiers pass and clean up their synthetic rows. The production build passes, the route verifier covers 338 app routes and 30 critical aliases, and `/design-lab/finance` emits statically with only the repository's documented middleware, print CSS, PostgreSQL SSL-mode, and legacy dynamic-prerender warnings.

## Additive Production Migration

1. Add canonical family account, charge/invoice line, payment event, allocation, receipt, delivery, reversal, and ledger event persistence without removing `Payment`, `AccountingEntry`, `PaymentReminder`, alarms, notification receipts, legacy IDs, receipt files, or routes.
2. Store all new amounts in integer minor units with explicit currency. Define a reviewed conversion for existing decimal values and reject mixed-currency allocation.
3. Reconcile imported `t_payments` and `t_accounting` per family/child. Preserve conflicting values and provenance; never backfill a synthesized allocation, receipt, or balance as proven history.
4. Introduce compatibility adapters that project current `Payment` and `AccountingEntry` rows into candidate canonical events while dual-reading representative accounts.
5. Create record, allocate, correct, export, communicate, and query capabilities with organization, branch, family/child account, payment, charge, and receipt scope.
6. Record payment and allocation in one transaction when allocation is supplied. Lock or revalidate ledger, payment, and charge revisions before commit.
7. Use idempotency keys and duplicate fingerprints across UI retry, import, API, native, and provider callbacks. A duplicate warning requires a reasoned override, not silent acceptance.
8. Replace in-place financial edits and soft deletion with append-only correction/reversal. Existing mutation paths remain until compatibility and retention policy are verified.
9. Generate receipts and legacy receipt-voucher fields from the confirmed canonical result. Preserve `/invo.php?po=`, `/accounting/invoice/[id]`, receipt numbers, amount-in-words, validity dates, attachments, signature, and print behavior.
10. Project canonical events to the Oct-Sep accounting matrix, child accounting statement, payment alarms, legacy parent/native finance fields, exports, and parent-safe statement without removing complete historical access.
11. Keep reminder/alarm delivery separate from allocation completion. Continue generating required legacy `Alarm` and `NotificationReceipt` rows from a transactional outbox.
12. Reconcile totals and parser fields across staff, child, parent web, iOS/Android, invoice print, CSV/export, alarm, and legacy aliases before switching any current balance label.

## Parity Boundary

This slice is additive and synthetic. It changes no production payment, accounting entry, reminder, alarm, notification receipt, parent endpoint, native payload, invoice/receipt, print, export, server action, Prisma model, database row, permission, route, or legacy alias.

The production adapter must preserve:

- imported `t_payments`, `t_accounting`, and `newpayment` provenance and reconciliation counts;
- registration, monthly, bus, extra-time, food, and other categories;
- cash, cheque, transfer, and credit-card method labels, including legacy parser spellings;
- coverage month/date range, notes, reference, creator, status, and receipt attachment fields;
- Oct-Sep matrix, child category tables, CSV statement, receipt voucher, amount in words, and print actions;
- payment reminder, alarm, parent receipt, and provider-delivery audit behavior;
- parent/native `ws/finance.php` and parser-safe payment fields;
- organization, branch, child, page, action, and legacy privilege guards.

## Open Validation

- Is the canonical account family-level, child-level, or a family account with child-attributed charge lines?
- Which imported fee totals represent gross, net, discount, or already-settled values?
- What are the approved allocation defaults for monthly coverage, registration, bus, food, credits, and overpayment?
- Which currencies, exchange-rate rules, rounding rules, and historical currency labels are allowed?
- Which correction types require refund, reversal, credit note, replacement receipt, parent communication, or manager approval?
- Which invoice/receipt numbering, tax, retention, signature, and stationery rules apply in the first market?
- Which parent payment and balance details may be shown before imported-account reconciliation is complete?

These questions block production convergence, not continued reversible schema, adapter, authorization, transaction, browser, and compatibility work.
