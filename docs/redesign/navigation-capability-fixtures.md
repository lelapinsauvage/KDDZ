# Redesign Navigation Capability Fixtures

**Date:** 2026-07-10
**Status:** Territory-neutral fixture contract complete; production authorization integration open
**Executable sources:** `src/lib/redesign-navigation-contracts.ts`, `src/scripts/verify-redesign-navigation-contracts.ts`
**Interactive consumer:** `/design-lab/ia`

## Purpose

This contract closes one architecture question: given a safe, server-derived set of effective capability decisions and record scopes, which staff destinations and branch contexts may the shell present?

It replaces the IA lab's hard-coded role-to-navigation and role-to-branch tables with a deterministic projector. It does not authorize a request. Production loaders, queries, mutations, exports, aliases, and APIs still need the server-owned authorization model in `authorization-scope-audit.md`.

## Why This Exists

The current product has three mismatched sources of truth:

1. `app-sidebar.tsx` hides destinations by modern role and optional legacy page grants.
2. The app layout currently loads organization-wide branches and classes for the shell, including for branch-bound staff.
3. Most direct routes and server actions do not independently enforce the same role, assignment, relation, capability, and transition decision.

That mismatch makes hidden navigation look safer than the underlying route. It also makes a simple role label too weak to drive a redesigned shell: imported grants, direct-user grants, branch assignments, room assignments, clinical review assignments, and incomplete setup can all change effective access.

## Contract Boundary

The projector consumes a safe snapshot that a future server policy service can serialize:

```text
NavigationSnapshot
- role: provenance and presentation context
- decisions[]: one effective decision per shell capability
- scope.kind: organization, assigned branches/rooms/reviews, or pending setup
- scope.branchIds[]: effective branch relations
- availableBranches[]: tenant-safe branch labels already authorized for evaluation
- preferredReadContextId: optional valid return context
```

It emits:

```text
NavigationProjection
- destinations[]: capability-derived IA domains with safe current route landings
- deniedDomains[]
- branchContext.readOptions[]
- branchContext.writeBranchIds[]
- default read and write contexts
- scope status
- generic contract issues with no private record identifier
```

The server must recompute authorization for every protected operation. The client projection is visibility and orientation only.

## Invariants

1. A role label is never projector authority. Two snapshots with identical decisions and scope produce identical destinations even if the role field changes.
2. Every shell capability has exactly one effective decision. Missing or conflicting decisions default deny and emit a generic issue.
3. Imported legacy or direct-user policy may remove a destination that the provisional modern-role baseline would otherwise expose.
4. Scope is intersected with the available tenant-safe branch set. Unknown branch identifiers are removed and never echoed into output.
5. `All branches (read-only)` requires both organization scope and the explicit `context.branches.read-all` capability.
6. `All branches` is never a write target. Every mutation must use a concrete authorized branch.
7. Assigned branch, room, and review scopes expose only their effective branch relationships.
8. Pending setup produces no read or write branch and an explicit `pending-setup` status.
9. Every destination uses the current safe landing from `redesign-route-compatibility.ts`; no destination enters `/design-lab` or prematurely creates a planned root.
10. The projector emits no child, parent, staff, medical, financial, message, or organization record data.

## Capability Set

| IA destination | Required decision |
| --- | --- |
| Today | `today.view` |
| Children | `children.view` |
| Rooms | `rooms.view` |
| Team | `team.view` |
| Messages | `messages.view` |
| Finance | `finance.view` |
| Reports | `reports.run` |
| Settings | `settings.view` |
| Organization read context | `context.branches.read-all` |

These are shell-level capabilities, not the final domain transition inventory. Attendance correction, medical review, payment reversal, backup export, and similar consequential operations require narrower named capabilities before production rollout.

## Fixture Matrix

| Fixture | Policy/scope condition | Expected destinations | Read contexts | Write branches | Status |
| --- | --- | --- | --- | --- | --- |
| `administrator-organization` | Provisional administrator decisions, organization scope, read-all allowed | Today, Children, Rooms, Team, Messages, Finance, Reports, Settings | All read-only, Hamra, Riverside | Hamra, Riverside | Ready |
| `manager-two-branches` | Provisional manager decisions, two assigned branches | All eight staff destinations | Hamra, Riverside | Hamra, Riverside | Ready |
| `manager-finance-explicitly-denied` | Manager baseline plus imported legacy explicit deny | All manager destinations except Finance | Riverside | Riverside | Ready |
| `teacher-assigned-room` | Practitioner decisions, room assignment linked to Riverside | Today, Children, Messages | Riverside | Riverside | Ready |
| `nurse-assigned-branch` | Clinical decisions, assigned Riverside branch | Today, Children, Messages | Riverside | Riverside | Ready |
| `doctor-assigned-review` | Clinical decisions, review assignment linked to Riverside | Today, Children, Messages | Riverside | Riverside | Ready |
| `teacher-pending-setup` | Practitioner decisions, no resolved operational assignment | Today, Children, Messages | None | None | Pending setup |

The fixture names describe policy shapes, not final production entitlements. The provisional role baselines remain hypotheses until production policy, operator, legal, and jurisdiction gates close.

## Adversarial Verification

The verifier also proves behavior not represented by the seven happy-path fixtures:

- removing `finance.view` removes Finance and reports `missing-policy`;
- adding a conflicting Today decision removes Today and reports `conflicting-policy`;
- granting read-all without organization scope does not expose an all-branch context;
- an unknown assigned branch produces no branch option and does not appear in serialized output;
- changing only the role field does not alter capability-derived destinations;
- every all-branch option is read-only;
- every current landing remains outside `/design-lab`.

## Browser Evidence

The IA lab now consumes the same projector used by the verifier. Browser checks confirmed:

| Projection | Observed destinations | Observed branch behavior |
| --- | --- | --- |
| Administrator | Eight domains, with Settings separated visually | All branches is labeled read-only; Hamra and Riverside remain concrete contexts |
| Manager | Eight domains, with Settings separated visually | Hamra and Riverside only; no all-branch option |
| Teacher | Today, Children, Messages; no Settings | Riverside only |
| Nurse | Today, Children, Messages; no Settings | Riverside only |
| Doctor | Today, Children, Messages; no Settings | Riverside only |

Role changes preserve a still-valid branch context and fall back to the projected default when the previous context is no longer allowed. A no-longer-allowed domain returns to Today.

The role switch remains a research control. A shipping user cannot change their own authority from the shell.

## Verification

```bash
pnpm exec tsx src/scripts/verify-redesign-navigation-contracts.ts
pnpm exec tsx src/scripts/verify-redesign-route-compatibility.ts
pnpm exec eslint src/lib/redesign-navigation-contracts.ts src/scripts/verify-redesign-navigation-contracts.ts src/app/design-lab/ia/_components/ia-prototype.tsx --max-warnings=0
pnpm exec tsc --noEmit --pretty false
git diff --check
```

## Production Integration Work

This fixture contract does not close the authorization release gate. Production still requires:

1. Replace the first-organization fallback with a fail-closed account-scope result.
2. Inventory routes, loaders, queries, actions, APIs, exports, aliases, and transitions into named capabilities.
3. Map modern defaults, imported legacy grants, direct-user grants, qualifications, and temporary assignments into one versioned server decision.
4. Enforce effective branch, room, child, family, clinical-review, and record-relation scope in data access and mutations.
5. Decide what current branchless teachers represent and migrate each account to an explicit state.
6. Add allowed, denied, stale, revoked, and conflicting-policy contract tests for each production domain.
7. Add non-disclosing forbidden, pending-setup, request-access, and expired-assignment UX.
8. Run direct URL, current navigation, legacy alias, search, queue, export, native, and API tests against the same authorized record state.
9. Record policy version, reason, effective scope, and required audit evidence for consequential actions.
10. Prove that counts, search results, notifications, errors, and timing do not disclose out-of-scope records.

## Decision

The capability-derived destination and branch fixture gate is closed for territory-neutral architecture work. The projector may support wireflows, labs, and production planning. It must not be treated as server authorization or wired to production navigation until the production integration work and the full authorization acceptance gate pass.
