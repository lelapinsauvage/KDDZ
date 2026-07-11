# Kiddz Online Redesign Decision Log

**Status:** Living evidence index
**Started:** 2026-07-11

This log records consequential redesign decisions from this point forward. Earlier decisions remain authoritative in their linked research, contract, and progress artifacts; this file does not rewrite their evidence or imply an unselected creative direction.

## 2026-07-11 - Daily care completion ends at delivered evidence, not a report row

- **Decision:** Begin factual care fields unset; apply shared observations only to explicitly selected, confirmed-present children; preserve child exceptions and immutable report revisions; keep draft, submission, parent delivery, and correction as separate source-linked states.
- **Why:** Current batch defaults can invent care facts, any report row can appear done, report-owned absence conflicts with attendance, nested update can partially delete evidence, and `SUBMITTED` alone cannot prove parent delivery.
- **Evidence:** `docs/redesign/daily-care-contract.md`, current DailyReport/nested/AbsenceReport schema and actions, batch and full forms, approval setting, parent/native adapters, J03 audit/blueprint, deterministic verifier, 36 Agent Browser role/state/viewport scans, 12 live manager transitions, privacy checks, visual scrolling, and empty browser logs.
- **Reversibility:** The contract and prototype are additive, synthetic, territory-neutral, and policy-neutral. Production policy, models, transactions/outbox, adapters, authorization, deletion/correction rules, and visual treatment remain open.
- **Parity boundary:** No production daily report, nested evidence, absence, attendance, list/draft, approval, print/export, schema, database row, query, mutation, permission, route, PHP alias, parent/native payload, or restored capability changed.

## 2026-07-11 - Staffing readiness is a source-linked interval calculation

- **Decision:** Keep availability, scheduled shift, room assignment, observed presence, effective qualification, reported/confirmed absence, break obligation, candidate preview, and temporary cover as separate facts. Accept cover only after both target-room and source-room consequences remain safe at the current plan revision.
- **Why:** Current static class placement, day-level employee events, profile evidence, and appendable scanner logs cannot prove who contributes to one room at one time. Treating them as a rota would hide overlaps, expired qualifications, unknown presence, unstaffed breaks, and risk transferred between rooms.
- **Evidence:** `docs/redesign/staffing-rota-contract.md`, current Teacher/EmployeeEvent/TeacherAttendance schema and actions, employee calendar/attendance surfaces, J05 workflow blueprint, deterministic contract verifier, 27 Agent Browser role/state/viewport scans, nine live manager transitions, privacy checks, visual scrolling, and empty browser logs.
- **Reversibility:** The contract and prototype are additive, synthetic, territory-neutral, and policy-neutral. Production models, policy, source adapters, payroll effects, visual treatment, and activation remain open.
- **Parity boundary:** No production staff, event, attendance, calendar, class, branch, ratio, payroll, schema, database row, query, mutation, route, permission, export, PHP alias, parent/native payload, or restored capability changed.

## 2026-07-11 - A roster count is not occupancy or availability

- **Decision:** Keep current roster, confirmed session bookings, explicit live attendance, physical/policy/staffing capacity, named capacity blocks, expiring place holds, future sellable places, and booked/attended/funded/invoiced hours as separate source-linked facts. Confirming a held place creates distinct expected-attendance and billing-input identities atomically.
- **Why:** Current class assignment and active-child counts have no day/session semantics. Relabeling them as occupancy would make future places, staffing consequences, funding, and invoices look precise while being unsupported.
- **Evidence:** `docs/redesign/occupancy-planning-contract.md`, current Class/Child/BranchCompliance schema and actions, class/child migration semantics, dashboard/class count projections, official competitor flow synthesis, deterministic verifier, 27 Agent Browser role/state/viewport scans, nine focused mobile regressions, and live capacity/request/hold/booking/recovery transitions.
- **Reversibility:** The contract and prototype are additive, synthetic, territory-neutral, and policy-neutral. Production sessions, bookings, capacity rules, funding policy, visual treatment, and activation remain open.
- **Parity boundary:** No production class, child, branch, attendance, finance, schema, query, mutation, route, permission, export, legacy alias, parent/native payload, or restored capability changed.

## 2026-07-11 - Inspection completeness begins with a versioned manifest

- **Decision:** Build inspection output only from a policy-supplied requirement profile and immutable evidence manifest. Bind exceptions and redactions to exact source revisions, generate through a retryable server job, checksum the manifest and artifact, expire recipient access, audit downloads, and mark prior output historical after source drift. Keep SQL backup categorically separate.
- **Why:** Current exports are feature-specific tables or browser downloads, current compliance documents lack package provenance, and the admin SQL export is for restoration. Presenting any of them as complete inspection evidence would overstate coverage and can leak or omit sensitive records.
- **Evidence:** `docs/redesign/inspection-package-contract.md`, J07 journey audit and blueprint, branch/staff compliance schema and actions, current export/monthly-report/storage/SQL-backup surfaces, deterministic contract verifier, 33 Agent Browser state/role/viewport scans, and live manager/retry/expiry/contributor transitions.
- **Reversibility:** The contract and prototype are additive, synthetic, territory-neutral, and policy-neutral. Production models, source adapters, first-market requirements, visual treatment, and activation remain open.
- **Parity boundary:** No production export, report, backup, storage object, compliance document, query, mutation, schema, route, permission, native payload, legacy alias, or restored capability changed.

## 2026-07-11 - Action Center closes only from source evidence

- **Decision:** Keep viewed, claimed, deferred, and source-resolved as independent facts. Remove an item from active work only after a newer canonical source revision supplies resolution evidence.
- **Why:** Current alarm dismissal, snooze, read receipts, drafts, payments, ratios, and handovers use incompatible meanings of attention and completion. Collapsing them would create false closure and hide operational risk.
- **Evidence:** `docs/redesign/action-center-contract.md`, `docs/redesign/journey-state-audit.md`, `docs/redesign/operational-architecture-synthesis.md`, current alarm/message/report/payment actions, deterministic verifier, and 21 Agent Browser state/viewport combinations.
- **Reversibility:** The contract and fixture are additive and territory-neutral. Production source adapters, escalation policy, persistence, and visual treatment remain open.
- **Parity boundary:** No production query, mutation, schema, route, permission, export, legacy alias, native payload, or restored capability changed.

## Open Irreversible Decision

- **Creative territory:** Daylight, Signal, or Carebook requires explicit user selection before `docs/brand-design-constitution.md`, final tokens, or production visual migration.
- **Recommendation:** Daylight remains recommended; `docs/redesign/creative-selection-gate.md` and `docs/redesign/territory-evaluation.md` contain the scored evidence.

## 2026-07-11 - Child workspace access composes by section and event

- **Decision:** Resolve base child access first, then independently authorize workspace sections, timeline events, safety notices, and actions. Publish separate parent-safe content and preserve append-only corrections.
- **Why:** Current organization-level child access can load a full dossier and cross-domain timeline, while parent adapters, clinical details, finance, calls, drafts, and safeguarding require different policy and language.
- **Evidence:** `docs/redesign/child-workspace-contract.md`, current child/timeline/subnav actions, parent daily/notification contracts, child parity rows, deterministic role fixtures, and browser evidence recorded with the slice.
- **Reversibility:** The contract is additive and territory-neutral. Production source adapters, capability decisions, persistence, labels, and selected-system composition remain open.
- **Parity boundary:** No production child query, mutation, route, output, legacy alias, parent/native contract, or restored capability changed.

## 2026-07-11 - Medical incidents close from obligations, not one status

- **Decision:** Keep the incident source revision separate from manager review, clinical review, parent delivery, parent acknowledgment, follow-up, and closure. Require typed capabilities and fresh source revisions for every transition; append correction cycles instead of overwriting or deleting submitted evidence.
- **Why:** The current `DRAFT`/`SUBMITTED`/`REVIEWED` status can be assigned directly and cannot prove delivery, acknowledgment, follow-up, retry ownership, or accountable closure. Legacy alarm receipts preserve compatibility but are not parent acknowledgment.
- **Evidence:** `docs/redesign/medical-incident-contract.md`, J04 journey audit and blueprint, current medical actions and accident form, legacy medical alarm/receipt verifiers, deterministic lifecycle verifier, and 30 Agent Browser state/viewport combinations.
- **Reversibility:** The contract and prototype are additive and territory-neutral. Jurisdiction policy, storage schema, transaction/outbox design, provider integration, production authorization, and final selected-system composition remain open.
- **Parity boundary:** No production medical query, mutation, upload, alarm, receipt, schema, database row, route, PDF, export, legacy alias, parent/native payload, or restored capability changed.

## 2026-07-11 - Family finance derives from one immutable event set

- **Decision:** Treat imported payment/accounting disagreement as an explicit source conflict. Record charges, payments, allocations, receipts, delivery, and correction as immutable events in integer minor units; derive family and invoice balances from that one set.
- **Why:** Current `Payment` and `AccountingEntry` stores have no allocation relation. The same child page displays paid totals from one store and balance from the other, while receipt routes, parent/native finance, reminders, and soft deletion cannot prove a shared result.
- **Evidence:** `docs/redesign/family-ledger-contract.md`, J06 journey audit and blueprint, current payment/accounting actions and UI, migration/parity/native contracts, deterministic verifier, and 27 Agent Browser state/viewport combinations.
- **Reversibility:** The contract is additive and territory-neutral. Source reconciliation, account identity, schema, transaction/outbox design, invoice/receipt policy, production authorization, and selected-system composition remain open.
- **Parity boundary:** No production payment, accounting entry, reminder, alarm, receipt, parent/native response, invoice, print, export, schema, database row, route, permission, or restored capability changed.
