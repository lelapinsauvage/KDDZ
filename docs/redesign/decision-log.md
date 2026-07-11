# Kiddz Online Redesign Decision Log

**Status:** Living evidence index
**Started:** 2026-07-11

This log records consequential redesign decisions from this point forward. Earlier decisions remain authoritative in their linked research, contract, and progress artifacts; this file does not rewrite their evidence or imply an unselected creative direction.

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
