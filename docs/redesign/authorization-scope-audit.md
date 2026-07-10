# Kiddz Online Authorization And Scope Audit

**Status:** Source-backed and runtime-verified discovery baseline
**Last updated:** 2026-07-10
**Runtime persona:** Short-lived branch-bound teacher
**Privacy:** Structural counts only; no personal record content or screenshots preserved

## Purpose

The redesign will make powerful workflows easier to find and complete. That is only safe if visibility, route access, data scope, action authority, state transitions, and exports use one server-enforced policy. This audit distinguishes the current menu model from the current authorization boundary.

## Evidence

- `src/app/(app)/layout.tsx` authentication, legacy page guard, organization fallback, and shell data.
- `src/components/layout/app-sidebar.tsx` role-specific navigation and legacy page filtering.
- `src/lib/require-org.ts`, `require-role.ts`, and `verify-org-access.ts`.
- `src/lib/legacy-access-permissions.ts`, `legacy-page-guards.ts`, and action-specific legacy permission helpers.
- All 39 files under `src/lib/actions/`.
- Authenticated direct-route tests for eleven high-impact destinations using a temporary branch-bound teacher.
- Aggregate local database counts only; no user identity or record value was extracted.

## Executive Finding

Kiddz has three partially overlapping permission systems:

1. modern role-based navigation;
2. migrated PHP page and action grants;
3. organization/record ownership checks in server actions.

They do not yet form one complete authorization policy. Navigation usually reduces what a role sees, but many direct routes and mutations remain organization-wide. In the current local migration there are no imported legacy access-control records, so unconfigured page/action checks default to allowed. A branch-bound teacher can therefore reach multiple hidden high-risk surfaces directly.

The redesign must not reuse menu visibility as proof of permission. Authorization becomes a first-class domain service before new navigation exposes consolidated work.

## Current Permission Layers

### 1. Session and organization context

`requireOrg()` requires an authenticated user, then resolves organization in this order:

1. organization ID from session;
2. organization from the session branch;
3. organization/branch reloaded from the user record;
4. the first organization in the database.

The last fallback can attach an unscoped authenticated user to the first tenant. The current local database has one organization, so this pass did not demonstrate cross-tenant access. In a multi-tenant deployment the fallback is incompatible with least privilege and must not remain a runtime authorization mechanism.

### 2. Modern roles

Modern roles are `ADMIN`, `MANAGER`, `TEACHER`, `NURSE`, and `DOCTOR`.

- Administrator and manager receive the broad admin navigation.
- Teacher receives Today, Daily Operations, Children, and Communication.
- Nurse and doctor receive the same Health, Children, and Communication model.
- A few pages call `requireRole` or perform an explicit admin check.

Role-specific navigation is useful discovery logic, but most protected page files do not independently enforce a role.

### 3. Legacy page grants

The app layout maps modern and PHP-compatible routes to 45 guarded legacy page names. It loads `PAGE` decisions from migrated login levels and redirects denied requests to `/forbidden.php`.

The decision helper deliberately allows an action when no matching legacy action is configured:

```text
allowed = not configured OR explicitly granted
```

This preserves modern/seed operation when legacy controls are absent, but it is not a sufficient default for sensitive modern capabilities.

### 4. Legacy action grants

Legacy `ACTION` checks are applied to selected branch, class, child, teacher, food-calendar, holiday, nursery, and system-management mutations. Imported level grants and direct user grants are supported.

Seven action modules call `requireLegacyActionAllowed` directly:

- branch compliance;
- branches;
- children;
- classes;
- employees;
- food;
- settings.

Legacy admin/auth modules use a stricter administrator plus `manageSystem` boundary. Organizations uses an explicit administrator check.

### 5. Organization record checks

`verifyBranchAccess` proves a branch belongs to an organization. `verifyChildAccess` proves a child belongs to a branch in that organization. These checks are important and widely used.

They do not intersect the record with the current user's assigned branch, classes, children, role, or legacy branch/class restrictions. A branch-bound user therefore often receives organization-wide scope once a server action accepts the request.

## Local Migration State

Aggregate runtime evidence:

| Measure | Current local value |
| --- | ---: |
| Organizations | 1 |
| Administrators | 2 |
| Teachers | 18 |
| Managers | 0 |
| Nurses | 0 |
| Doctors | 0 |
| Imported legacy access-control records | 0 |
| Users linked to imported legacy login-user records | 0 |
| Branchless teachers | 8 |

Consequences:

- Every legacy page/action decision is currently unconfigured and therefore allowed.
- Modern role and explicit page checks carry the full local authorization burden.
- Manager, nurse, and doctor behavior required temporary personas during role discovery; their real migrated permission combinations are not represented locally.
- Branchless teachers make a branch-only assumption unsafe unless the product defines and enforces what branchless staff may access.

## Direct-Route Runtime Results

The temporary persona had role `TEACHER`, a real organization, and one assigned branch. The session began on Today. No record mutation was performed.

| Requested route | Result | Structural evidence |
| --- | --- | --- |
| `/accounting` | Blocked by role check, but generic app error rendered | No purposeful forbidden state |
| `/branches` | Blocked by role check, but generic app error rendered | No purposeful forbidden state |
| `/settings` | Redirected to `/dashboard` | Destination does not explain denial |
| `/medical/accidents` | Accessible | 10 table rows rendered |
| `/employees/attendance` | Accessible | Staff attendance interface and 10 rows rendered |
| `/employees/attendance-logs` | Accessible | Attendance log interface rendered |
| `/employees/teachers` | Accessible | Teacher management interface and 10 rows rendered |
| `/settings/parent-users` | Accessible | Parent-user interface and 20 rows rendered |
| `/settings/export` | Accessible | Sensitive export interface rendered |
| `/alarms` | Accessible | Organization alarm surface rendered |
| `/reports/monthly` | Accessible | 57 report rows rendered |

The headings recorded by the browser were generic shell headings and no row content was captured. The user was signed out and deleted with sessions/accounts after the pass; database verification returned zero audit users.

## Server-Action Coverage

There are 39 action modules. Thirty-one use `requireOrg` or `requireOrgSafe`; none imports `requireRole`. Fourteen contain some explicit role/action boundary through a legacy gate, admin-panel guard, or local role branch. Several modules are public authentication/recovery flows, so these counts are not a direct vulnerability count.

High-impact operational modules that primarily rely on authentication plus organization scope include:

- absence reports;
- accounting entries;
- alarms and notification work;
- assessments;
- child attendance;
- calls;
- daily reports;
- employee events and attendance logs;
- medical forms;
- parent users;
- payments.

This means the interface may hide the entry point while a direct server-action invocation still accepts an authenticated same-organization user. The exact gap differs by function and must be closed with explicit capability checks rather than blanket role checks.

## Confirmed Strengths

1. Authenticated app routes share a central layout guard.
2. Legacy page names map modern and PHP-compatible routes to the same decision.
3. Legacy level grants and direct-user action grants are preserved.
4. Important branch and child mutations verify organization ownership.
5. Organization administration and database export have explicit administrator boundaries.
6. Selected legacy create/update/delete actions are checked both in the UI and server mutation.
7. A dedicated forbidden screen already exists.

## Critical Risks

### A01 - First-organization fallback

An authenticated user without resolved organization context can be assigned the first organization. This is a multi-tenant boundary risk and can also hide account-configuration errors.

**Target:** Runtime requests fail closed with an actionable account-scope error. Any migration-only fallback is isolated to explicit tooling.

### A02 - Hidden is not forbidden

Role navigation removes entries, but direct URLs can open several high-risk surfaces.

**Target:** The same server capability decision powers navigation, route loaders, queries, mutations, exports, and API routes.

### A03 - Organization scope is broader than user scope

Branch/child helpers verify tenant ownership, not assignment. A teacher tied to one branch can load organization-wide staff, parents, medical lists, alarms, and reports where queries default to the organization.

**Target:** Every decision intersects tenant, assigned scope, record relationship, and action capability.

### A04 - Missing legacy configuration becomes allow

The compatibility default is useful for restored deployments but unsafe as a general modern policy.

**Target:** Missing legacy configuration may inherit a documented modern role default for low-risk capabilities. High-risk mutation, export, deletion, override, and backup capabilities default deny.

### A05 - Route denial is inconsistent

Some checks throw into the application error boundary; some redirect silently; legacy page denial uses the proper forbidden screen.

**Target:** Denial produces one accessible response with reason category, safe destination, request-access path where applicable, and no leaked record existence.

### A06 - Action authority and transition authority are conflated

Being able to edit a medical form is not the same as being able to submit, review, notify, void, or close it. Similar distinctions apply to attendance correction, rota publication, payment reversal, and inspection export.

**Target:** Capabilities name domain transitions, not only CRUD verbs.

### A07 - Branchless staff are undefined

Eight current teachers have no branch assignment. The product does not establish whether this means cross-branch staff, incomplete migration, substitute pool, or invalid state.

**Target:** Branchless access is explicit: organization-wide role, cover pool with time-bounded assignment, pending setup, or denied operational access.

## Target Authorization Model

### Decision inputs

Every authorization decision receives:

- user and organization;
- modern role;
- imported legacy page/action grants;
- assigned branches, rooms/classes, and children where applicable;
- requested record and its organization/branch/room relationships;
- capability and intended transition;
- operational context such as current assignment or emergency override;
- policy version and jurisdiction where relevant.

### Decision output

```text
AuthorizationDecision
- allowed
- capability
- effective scope
- policy source
- reason code
- requires step-up or secondary approval
- audit requirement
```

The client may use a serialized safe subset for visibility, but the server recomputes the decision for every protected read, mutation, export, and transition.

### Capability families

| Domain | Capability examples |
| --- | --- |
| Attendance | view roster, record state, confirm room, correct state, view history, export |
| Care reports | create draft, edit own draft, submit, approve, communicate, void |
| Medical/safety | view summary, view sensitive detail, draft, submit, triage, review, notify, close, void |
| Staffing | view own schedule, manage branch rota, assign room, publish, override ratio, approve exception |
| Finance | view family balance, record payment, allocate, reverse, refund, export, view all branches |
| Communication | view own thread, compose direct, compose class, broadcast, resend, inspect delivery |
| People/access | view profile, manage role, manage scope, reset access, edit legacy grants |
| Evidence/data | run report, export personal data, generate inspection package, download backup, restore backup |

### Scope families

- own user;
- own child/family;
- assigned child;
- assigned room/class;
- assigned branch;
- explicit temporary cover assignment;
- all branches in organization;
- system administration.

## Provisional Role Baselines

These are hypotheses for validation, not final policy.

| Role | Default scope | Primary authority | Explicit exclusions |
| --- | --- | --- | --- |
| Administrator | Organization | Tenant setup, access, data, cross-branch oversight | Clinical approval unless separately qualified |
| Manager | Assigned branch(es) | Opening, attendance oversight, staffing, finance, communication, compliance | System/tenant controls outside granted scope |
| Teacher/practitioner | Assigned room(s)/children | Attendance input, care drafts/submission, parent communication in scope, incident initiation | Broad staff/parent administration, finance, clinical review, bulk data export |
| Nurse | Assigned branch(es), health scope | Medication/health records, triage, follow-up, incident contribution | Finance and unrelated people administration |
| Doctor | Assigned review scope | Clinical review and authorized medical transitions | Routine attendance, finance, broad administration |
| Parent | Own linked child(ren) | Read permitted child state, message, absence/request input, own finance | Staff/internal notes, other children, operational administration |

## Migration Strategy

1. Inventory every modern route, action, API, export, and transition into named capabilities.
2. Map all preserved legacy page/action grants to those capabilities without deleting source provenance.
3. Define modern role defaults and scope rules for capabilities with no legacy equivalent.
4. Effective access is the intersection of tenant, role/capability, imported grants where configured, and assignment scope.
5. Default deny high-risk transitions and sensitive exports when policy is missing or ambiguous.
6. Replace direct `requireOrg` mutation boundaries with a domain authorization helper.
7. Use the same decision in navigation and route loaders, but never trust the client result for enforcement.
8. Add contract tests for role x scope x state x capability and browser tests for denial/recovery UX.
9. Preserve PHP aliases and native APIs behind the same decisions.
10. Record policy version and decision reason on high-risk audit events.

## Design Requirements

1. Users see actions they can complete, not controls that fail after a long form.
2. Disabled actions are shown only when their explanation or request-access path is useful.
3. Scope is visible in the shell and repeated at irreversible confirmation points.
4. Temporary cover or emergency override is time-bounded, prominent, reasoned, and audited.
5. Permission denial never reveals whether an out-of-scope child, parent, staff member, or record exists.
6. Role-specific homes change work priority, not the underlying security boundary.
7. Admin access-control UI uses human task language and previews effective access before save.
8. Legacy grants remain inspectable as policy sources rather than unexplained serialized metadata.

## Acceptance Gate

A redesigned domain cannot ship until:

- all reads, writes, exports, and transitions have named capabilities;
- route, action, API, and navigation decisions agree;
- organization fallback fails closed;
- branch/room/child scope is enforced server-side;
- high-risk missing policy defaults deny;
- denial and request-access behavior is accessible and tested;
- audit events record actor, effective scope, policy version, and reason where required;
- legacy aliases and native contracts pass the same authorization tests;
- role x scope x capability matrices have automated coverage;
- no personal data is exposed through counts, search, exports, notifications, or error differences outside effective scope.

## Open Validation Questions

1. What do branchless teachers represent in production?
2. Can managers be assigned multiple branches, and can assignments be time-bounded?
3. Which medical transitions require qualification, secondary approval, or parent acknowledgment?
4. Which records may teachers view outside their current room and why?
5. Who can correct confirmed attendance, and within what time window?
6. Who can record, allocate, reverse, refund, export, or communicate financial transactions?
7. Which emergency overrides are legally allowed, and who must be notified?
8. How should conflicting modern role defaults and imported grants resolve during migration?
