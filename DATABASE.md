# KiddzOnline — Database, Multi-Tenancy & Security Guide

> How multiple nurseries share one app without ever seeing each other's data.

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [The Solution: Shared Database with Row Isolation](#2-the-solution)
3. [How It Works (Plain English)](#3-how-it-works)
4. [Current State — What We Have](#4-current-state)
5. [Target State — What We Need](#5-target-state)
6. [Security Model (5 Layers)](#6-security-model)
7. [Schema Changes Required](#7-schema-changes)
8. [The Enforcement Layer](#8-enforcement-layer)
9. [How Nurseries Join (Onboarding)](#9-onboarding)
10. [How the Session Works](#10-session)
11. [Parent Portal Security](#11-parent-security)
12. [Threat Model — What Could Go Wrong](#12-threat-model)
13. [Implementation Plan & Timeline](#13-implementation-plan)
14. [Can This Be Done Overnight?](#14-overnight)
15. [Future Considerations](#15-future)

---

## 1. The Problem

Right now, KiddzOnline is a **single-tenant app**. One database, one nursery. If a second nursery wants to use it, we'd have to deploy a whole separate copy of the app + database. That doesn't scale.

We need **multi-tenancy**: many nurseries sharing the same app, each seeing only their own data. Nursery A must **never** see Nursery B's children, staff, payments, or messages. This is non-negotiable — nurseries store sensitive data about minors.

---

## 2. The Solution

**One database. One app. Every row tagged with who owns it.**

This is called "shared database with row-level isolation." It's what Shopify, Slack, Notion, and 90% of SaaS products use.

```
┌──────────────────────────────────────────────────────┐
│                  ONE Neon PostgreSQL                  │
│                                                      │
│  children table:                                     │
│  ┌────┬─────────┬───────────┬────────────────────┐   │
│  │ id │  name   │ branchId  │    organizationId  │   │
│  ├────┼─────────┼───────────┼────────────────────┤   │
│  │ 1  │ Ahmad   │ branch_1  │  happy_kids_sarl   │   │
│  │ 2  │ Sara    │ branch_1  │  happy_kids_sarl   │   │
│  │ 3  │ Maya    │ branch_2  │  tiny_tots_sarl    │ ← invisible to Happy Kids  │
│  └────┴─────────┴───────────┴────────────────────┘   │
│                                                      │
│  Every query automatically adds:                     │
│  WHERE organizationId = 'the-logged-in-user's-org'   │
└──────────────────────────────────────────────────────┘
```

### Why not separate databases per nursery?

| Factor | Shared DB (our choice) | Separate DBs |
|--------|----------------------|--------------|
| Prisma support | Native, clean | Hacky — need multiple clients |
| Run migrations | Once | N times (once per nursery) |
| Cost | 1 Neon project ($0-25/mo) | N projects ($$) |
| Complexity | Low | Very high |
| Cross-nursery analytics | Easy query | Aggregate across N databases |
| Data per nursery | ~10K-50K rows | Same |
| Max realistic scale | 500+ nurseries = ~5M rows | Same but fragmented |

A Lebanese nursery has 50-200 children and 10-30 staff. Even 500 nurseries means ~100K children total. That's **trivial** for PostgreSQL — it handles billions of rows. The separate-DB approach only makes sense at massive enterprise scale.

---

## 3. How It Works

### The hierarchy

```
Organization (= one nursery company)          ← "Happy Kids SARL"
  ├── Branch (= one physical location)        ← "Happy Kids - Achrafieh"
  │     ├── Class                             ← "Toddlers A"
  │     ├── Child                             ← "Ahmad"
  │     ├── Teacher                           ← "Miss Nour"
  │     ├── Settings                          ← branch-specific config
  │     ├── FoodCalendar                      ← what they eat
  │     └── ... everything else
  │
  ├── Branch                                  ← "Happy Kids - Jounieh"
  │     └── ... its own data
  │
  ├── SchoolYear                              ← shared across branches
  ├── Food items                              ← shared menu items
  └── Users (staff logins)                    ← can access their branch(es)
```

### The rules

1. **Organization** is the top-level tenant. One nursery company = one organization.
2. **Branch** is a physical location belonging to one organization.
3. **Most data** is scoped to a branch (children, staff, classes, reports, payments).
4. **Some data** is scoped to the organization but shared across branches (school years, food items, event types).
5. **Users** belong to an organization and optionally to a specific branch.
6. **Every query** is filtered by `organizationId`. No exceptions. Ever.

### What the user sees

```
Nursery A admin logs in
  → Session: { orgId: "nursery_a", branchId: "branch_1", role: ADMIN }
  → Sees: ONLY nursery_a's children, staff, payments, etc.
  → Can switch between nursery_a's branches (if they have multiple)
  → Cannot see or access anything from nursery_b

Nursery B teacher logs in
  → Session: { orgId: "nursery_b", branchId: "branch_3", role: TEACHER }
  → Sees: ONLY their branch's children and reports
  → Cannot see nursery_a or even nursery_b's other branches
```

---

## 4. Current State

### What's already right

The foundation exists:

- **Organization model** exists in the schema (id, name, logo, settings)
- **Branch** has `organizationId` foreign key with cascade delete
- **Most models have `branchId`**: Child, Teacher, Nurse, Doctor, Manager, Class, Settings, Event, Holiday, Alarm, AssessmentDate, FoodCalendar, BranchCompliance, BranchDocument
- **Some models are indirectly scoped** via child relationship: DailyReport, AbsenceReport, MedicalForm, Vaccination, Payment, AccountingEntry, CallLog
- **Session** includes branchId in JWT token
- **Middleware** protects routes from unauthenticated access

### What's broken or missing

**Critical gaps:**

| Model | Problem |
|-------|---------|
| `User` | Has `branchId` but NO `organizationId`. Admin users with null branchId have no org scope. |
| `SchoolYear` | No `organizationId`. School years are global — all nurseries share the same years. |
| `Food` | No `organizationId`. Menu items are global. |
| `EventType` | No `organizationId`. Event types are global. |
| `MessageThread` | No `organizationId` or `branchId`. Messages can cross nurseries. |
| `Message` | No `organizationId`. Only sender/recipient IDs, no org scope. |
| `EmployeeEvent` | No `branchId`. Employee attendance events float freely. |
| `ParentUser` | No `organizationId`. Only linked to child. |

**Enforcement gaps:**

| Issue | Severity | Description |
|-------|----------|-------------|
| No automatic org filtering | CRITICAL | Server actions accept `branchId` as optional parameter. If omitted, queries return ALL data across ALL nurseries. |
| No org in session | CRITICAL | JWT token has branchId but no organizationId. No way to scope queries by org. |
| No authorization checks | HIGH | No code verifies that the logged-in user's org matches the resource they're accessing. |
| No DB-level protection | HIGH | No PostgreSQL Row-Level Security policies. If app code has a bug, the DB won't catch it. |
| Admin can see everything | HIGH | Users with null branchId (admins) have no org scope at all — they could see every nursery's data. |

---

## 5. Target State

After implementation, the security model looks like this:

```
┌──────────────────────────────────────────────────────────────────┐
│                        REQUEST FLOW                              │
│                                                                  │
│  User clicks "View Children"                                     │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────┐                             │
│  │  LAYER 1: Middleware            │  Is user logged in?         │
│  │  (auth.config.ts)               │  Valid JWT token?           │
│  └──────────┬──────────────────────┘                             │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────┐                             │
│  │  LAYER 2: Server Action         │  Extract orgId from session │
│  │  (getChildren)                  │  Pass to scoped query       │
│  └──────────┬──────────────────────┘                             │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────┐                             │
│  │  LAYER 3: Scoped Prisma Client  │  Auto-inject:              │
│  │  (createScopedClient)           │  WHERE org_id = ?           │
│  └──────────┬──────────────────────┘                             │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────┐                             │
│  │  LAYER 4: PostgreSQL RLS        │  Even if app code has a     │
│  │  (Row-Level Security policies)  │  bug, DB blocks the query   │
│  └──────────┬──────────────────────┘                             │
│             │                                                    │
│             ▼                                                    │
│  ┌─────────────────────────────────┐                             │
│  │  LAYER 5: Encrypted at rest     │  Neon encrypts all data     │
│  │  + SSL in transit               │  on disk + wire             │
│  └─────────────────────────────────┘                             │
│                                                                  │
│  Result: User ONLY gets their org's children. Guaranteed by      │
│  4 independent layers. Even if one layer fails, the others       │
│  still protect the data.                                         │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Security Model (5 Layers)

### Layer 1 — Authentication (who are you?)

**What:** Verify the user is who they claim to be.

**Current:** Auth.js v5 with JWT strategy, bcrypt password hashing, credentials provider. This is solid.

**What changes:**
- Add `organizationId` to the JWT token (alongside existing branchId)
- Add `organizationId` to the session callback
- On login, look up the user's org via their branch relationship

**Result:** Every authenticated request carries `{ userId, orgId, branchId, role }` in the session.

```typescript
// auth.config.ts — session after changes
session = {
  user: {
    id: "user-uuid",
    email: "nour@happykids.lb",
    name: "Nour",
    role: "TEACHER",
    organizationId: "org-uuid",     // ← NEW
    branchId: "branch-uuid",
  }
}
```

### Layer 2 — Authorization (what can you do?)

**What:** Check that the user has permission for what they're trying to do.

**Current:** Nothing. Any logged-in user can access any page and any data. A teacher could theoretically access admin settings or another nursery's data.

**What changes:** Two levels of authorization checks.

**Level A — Role-based access control (RBAC):**
```
ADMIN:   Full access within their org
MANAGER: Full access within their branch
TEACHER: Daily reports, attendance for their branch only
NURSE:   Medical forms for their branch only
DOCTOR:  Medical forms for their branch only
```

**Level B — Org-scoped access:**
- Every server action extracts `session.user.organizationId`
- Every query includes `WHERE organizationId = <session org>`
- A user can NEVER specify a different org — it always comes from their session

### Layer 3 — Application Isolation (Prisma enforcement)

**What:** Automatic query filtering so developers can't accidentally forget the org filter.

**Current:** Nothing. Every action manually passes branchId (and often forgets).

**What changes:** A helper function wraps every database query:

```typescript
// BEFORE (dangerous — branchId is optional, orgId doesn't exist)
export async function getChildren({ branchId }: { branchId?: string }) {
  return db.child.findMany({
    where: branchId ? { branchId } : {},  // ← if omitted, returns ALL children
  });
}

// AFTER (safe — orgId is required, comes from session)
export async function getChildren({ branchId }: { branchId?: string }) {
  const session = await auth();
  const orgId = session?.user?.organizationId;
  if (!orgId) throw new Error("Unauthorized");

  return db.child.findMany({
    where: {
      branch: { organizationId: orgId },   // ← always scoped to org
      ...(branchId ? { branchId } : {}),   // ← optional branch filter within org
    },
  });
}
```

**Approach — `requireOrg()` helper:**
```typescript
// src/lib/require-org.ts
export async function requireOrg() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized: no organization context");
  }
  return {
    orgId: session.user.organizationId,
    branchId: session.user.branchId,
    userId: session.user.id,
    role: session.user.role,
  };
}
```

Every server action starts with `const { orgId, branchId } = await requireOrg();` — if there's no org context, it throws immediately. No data returned. No exceptions.

### Layer 4 — Database Isolation (PostgreSQL RLS)

**What:** Row-Level Security — the database itself enforces isolation. Even if the application has a bug, PostgreSQL blocks unauthorized access.

**Current:** No RLS policies. The database trusts whatever queries the app sends.

**What changes:** RLS policies on every table that contains tenant data.

```sql
-- How RLS works:

-- 1. Enable RLS on the table
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy
CREATE POLICY tenant_isolation ON children
  USING (branch_id IN (
    SELECT id FROM branches WHERE organization_id = current_setting('app.current_org_id')::uuid
  ));

-- 3. Before each request, the app sets the org context
SET app.current_org_id = 'org-uuid-here';

-- 4. Now ANY query on children automatically filters:
SELECT * FROM children;
-- PostgreSQL internally adds: WHERE branch_id IN (branches for this org)
-- Even if the app forgot to filter, the DB does it.
```

**Why this matters:** RLS is a safety net. The application layer (Layer 3) should handle everything correctly. But if a developer makes a mistake — forgets the org filter, writes a bad query, introduces a bug — the database catches it. Belt AND suspenders.

**Implementation notes for Prisma + RLS:**
- Prisma doesn't natively support `SET` commands per query
- We use `$executeRaw` inside a `$transaction` to set the org context before queries
- Or: use Neon's serverless driver with session parameters
- The RLS user is different from the migration/admin user (who bypasses RLS)

### Layer 5 — Infrastructure Security

**What:** Encryption, network security, backups.

**Current state with Neon (already provided):**
- All data encrypted at rest (AES-256)
- All connections encrypted in transit (TLS/SSL)
- Automatic daily backups with point-in-time recovery (up to 30 days on paid plans)
- IP allowlisting available (restrict which IPs can connect)
- Connection via connection pooler (PgBouncer) — no direct DB exposure
- Database credentials rotatable

**What we should add:**
- Environment variable management (no secrets in code — already using `.env`)
- Rate limiting on API routes (prevent brute-force login attempts)
- CSRF protection (Next.js has this built-in for Server Actions)
- Content Security Policy headers
- Audit logging (log who accessed what, when — for compliance)

---

## 7. Schema Changes Required

### Models that need `organizationId` added

| Model | Current scope | Change needed |
|-------|--------------|---------------|
| `User` | branchId only | Add `organizationId` (required). Admin users may have null branchId but always have orgId. |
| `SchoolYear` | Global | Add `organizationId`. Each nursery has own school years. |
| `Food` | Global | Add `organizationId`. Each nursery has own menu items. |
| `EventType` | Global | Add `organizationId`. Each nursery has own event types. |
| `MessageThread` | Unscoped | Add `organizationId`. Messages stay within an org. |
| `Message` | Unscoped | Add `organizationId`. |

### Models that need `branchId` added

| Model | Current scope | Change needed |
|-------|--------------|---------------|
| `EmployeeEvent` | employeeId only | Add `branchId`. Employee events should be branch-scoped. |

### Models that are already correct (no changes)

These are already scoped via `branchId` or via parent relationships:

- `Branch` (has organizationId)
- `Child`, `Class`, `Teacher`, `Nurse`, `Doctor`, `Manager` (have branchId)
- `Settings` (has branchId)
- `Event`, `Holiday`, `Alarm`, `FoodCalendar` (have branchId)
- `DailyReport`, `AbsenceReport`, `MedicalForm`, `Vaccination` (scoped via Child → branchId)
- `Payment`, `AccountingEntry`, `CallLog` (scoped via Child → branchId)
- `Assessment`, `AssessmentDate` (scoped via Child or branchId)
- `BranchCompliance`, `BranchDocument` (scoped via branchId)
- `Notification`, `PushToken` (scoped via User → organizationId, after User gets orgId)
- `ParentUser` (scoped via Child → branchId → organizationId)

### Organization model enhancements

```prisma
model Organization {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  slug      String   @unique                          // ← NEW: URL-friendly identifier
  logo      String?
  settings  Json?
  plan      String   @default("free")                 // ← NEW: subscription plan
  isActive  Boolean  @default(true)                   // ← NEW: can disable entire org
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  branches    Branch[]
  users       User[]                                  // ← NEW: direct relation
  schoolYears SchoolYear[]                            // ← NEW
  foods       Food[]                                  // ← NEW
  eventTypes  EventType[]                             // ← NEW
  threads     MessageThread[]                         // ← NEW

  @@map("organizations")
}
```

### User model changes

```prisma
model User {
  id             String    @id @default(uuid()) @db.Uuid
  email          String    @unique
  passwordHash   String?
  name           String?
  image          String?
  role           UserRole  @default(TEACHER)
  isActive       Boolean   @default(true)
  organizationId String    @db.Uuid                   // ← NEW (required)
  branchId       String?   @db.Uuid                   // stays optional (admins may manage multiple branches)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  branch       Branch?      @relation(fields: [branchId], references: [id], onDelete: SetNull)

  // ... rest stays the same

  @@index([organizationId])                           // ← NEW
  @@index([branchId])
  @@map("users")
}
```

---

## 8. The Enforcement Layer

### Pattern: Every server action uses `requireOrg()`

```typescript
// src/lib/require-org.ts

import { auth } from "./auth";

export async function requireOrg() {
  const session = await auth();

  if (!session?.user?.organizationId) {
    throw new Error("Unauthorized: no organization context");
  }

  return {
    orgId: session.user.organizationId,
    branchId: session.user.branchId ?? null,
    userId: session.user.id,
    role: session.user.role,
  };
}

/**
 * For actions that require a specific branch (teacher-level).
 * Throws if user doesn't have a branch assigned.
 */
export async function requireBranch() {
  const ctx = await requireOrg();

  if (!ctx.branchId) {
    throw new Error("Unauthorized: no branch context");
  }

  return ctx as typeof ctx & { branchId: string };
}
```

### How every server action changes

```typescript
// BEFORE: getChildren in src/lib/actions/children.ts
export async function getChildren({ branchId, search }: Filters) {
  const where: Prisma.ChildWhereInput = {};
  if (branchId) where.branchId = branchId;           // optional — data leak if omitted
  if (search) where.firstName = { contains: search };
  return db.child.findMany({ where });
}

// AFTER: getChildren
export async function getChildren({ branchId, search }: Filters) {
  const { orgId } = await requireOrg();              // ALWAYS required
  const where: Prisma.ChildWhereInput = {
    branch: { organizationId: orgId },                // ALWAYS filtered by org
  };
  if (branchId) where.branchId = branchId;           // optional branch within org
  if (search) where.firstName = { contains: search };
  return db.child.findMany({ where });
}
```

### Files that need updating

All 28 server action files need `requireOrg()` or `requireBranch()` added:

```
src/lib/actions/
├── absent-reports.ts       ← add org filter to all queries
├── accounting.ts           ← add org filter
├── alarms.ts               ← add org filter
├── assessments.ts          ← add org filter
├── attendance.ts           ← add org filter
├── branch-compliance.ts    ← add org filter
├── branches.ts             ← add org filter (critical — must only show org's branches)
├── calls.ts                ← add org filter
├── children.ts             ← add org filter
├── classes.ts              ← add org filter
├── daily-reports.ts        ← add org filter
├── dashboard.ts            ← add org filter
├── employee-events.ts      ← add org filter + add branchId to model
├── employees.ts            ← add org filter
├── food.ts                 ← add org filter + add orgId to model
├── header.ts               ← add org filter
├── medical-timeline.ts     ← add org filter
├── medical.ts              ← add org filter
├── messages.ts             ← add org filter + add orgId to model
├── notification-center.ts  ← add org filter
├── parent-users.ts         ← add org filter
├── payments.ts             ← add org filter
├── school-years.ts         ← add org filter + add orgId to model
├── search.ts               ← add org filter
├── settings.ts             ← add org filter
├── sidebar.ts              ← add org filter
├── timeline.ts             ← add org filter
└── today.ts                ← add org filter
```

---

## 9. Onboarding — How Nurseries Join

### Sign-up flow

```
NURSERY OWNER VISITS /signup
         │
         ▼
┌──────────────────────────────────┐
│  Step 1: Create Account          │
│  - Nursery name                  │
│  - Owner email                   │
│  - Owner password                │
│  - Owner full name               │
└──────────┬───────────────────────┘
           │
           ▼
  System creates:
  1. Organization { name, slug: auto-generated }
  2. Branch { name: "Main", organizationId }
  3. User { email, password, role: ADMIN, organizationId, branchId }
  4. SchoolYear { current year, organizationId }
           │
           ▼
┌──────────────────────────────────┐
│  Step 2: Setup Wizard            │
│  - Add classes (Toddlers, etc.)  │
│  - Invite first teacher          │
│  - Import children (or add one)  │
└──────────┬───────────────────────┘
           │
           ▼
  Redirect to /dashboard
  "Welcome! Here's your morning briefing."
```

### Staff invitation flow

```
Admin clicks "Invite Staff"
  → Enter: name, email, role (teacher/nurse/doctor)
  → System creates User with organizationId + branchId
  → Sends email with temporary password (or magic link)
  → Staff logs in, changes password, starts working
```

### Adding a second branch

```
Admin goes to Settings → Branches → Add Branch
  → Enter: branch name, address, phone
  → System creates Branch with same organizationId
  → Admin can now switch between branches
  → Assign staff and children to the new branch
```

---

## 10. How the Session Works

### Current session

```typescript
{
  user: {
    id: "user-uuid",
    email: "nour@happykids.lb",
    name: "Nour",
    role: "TEACHER",
    branchId: "branch-uuid",          // nullable
  }
}
```

### New session (after changes)

```typescript
{
  user: {
    id: "user-uuid",
    email: "nour@happykids.lb",
    name: "Nour",
    role: "TEACHER",
    organizationId: "org-uuid",       // ← ALWAYS present (never null)
    branchId: "branch-uuid",          // nullable (admins may not have a fixed branch)
  }
}
```

### How it flows

```
Login → Prisma looks up User → User has organizationId + branchId
  → Auth.js puts both in JWT token
  → JWT stored in httpOnly cookie (not accessible by JavaScript)
  → Every request: middleware validates JWT, session available server-side
  → Server actions call requireOrg() → extracts orgId from session
  → All queries filtered by orgId
```

### Branch switching (admin feature)

Admins who manage multiple branches can switch their "active branch":

```
Admin has: organizationId = "org-1", branchId = null (no default)
  → UI shows branch picker in header
  → Admin selects "Achrafieh" branch
  → Client stores selectedBranchId in cookie or URL param
  → Server actions use: orgId from session + branchId from cookie/param
  → Still scoped to their org — can't access other orgs even if they guess a branchId
```

---

## 11. Parent Portal Security

Parents have a separate auth system (`parent-auth.ts` with JWT via `jose`). This needs its own isolation:

### Current

- `ParentUser` linked to `Child` via `childId`
- JWT token contains `parentUserId` and `childId`
- Parent API routes at `/api/parent/*`

### After changes

- Parent session must also include `organizationId` (derived from child → branch → org)
- Parent API routes must verify orgId on every request
- Parents can ONLY see their own child's data
- Parent can never access staff data, other children, or admin features

```typescript
// Parent API — every endpoint starts with:
const parent = await verifyParentToken(request);
// parent = { parentUserId, childId, organizationId }
// All queries: WHERE childId = parent.childId AND child.branch.organizationId = parent.organizationId
```

---

## 12. Threat Model — What Could Go Wrong

### Threat 1: Horizontal privilege escalation (Nursery A accesses Nursery B)

**Attack:** User from Nursery A manipulates a request to include Nursery B's branchId or childId.

**Defense layers:**
1. `requireOrg()` extracts orgId from session (not from request body) — user can't forge it
2. All queries filter by orgId — even if branchId is from another org, the org filter catches it
3. RLS policies at DB level — even if app code fails, DB blocks it

**Example:**
```
User from org_1 sends: GET /api/children?branchId=org_2_branch
  → requireOrg() returns orgId = "org_1"
  → Query: WHERE branchId = "org_2_branch" AND branch.organizationId = "org_1"
  → Result: 0 rows (org_2_branch doesn't belong to org_1)
  → No data leaked
```

### Threat 2: JWT tampering

**Attack:** Attacker modifies JWT token to change orgId.

**Defense:** JWT tokens are cryptographically signed with AUTH_SECRET. Any modification invalidates the signature. Auth.js verifies signatures automatically.

### Threat 3: SQL injection

**Attack:** Attacker injects SQL through form fields.

**Defense:** Prisma uses parameterized queries. User input is NEVER interpolated into SQL strings. This is inherent to Prisma and doesn't require any action.

### Threat 4: Brute-force login

**Attack:** Attacker tries many passwords to guess a user's credentials.

**Defense (needs implementation):**
- Rate limiting on `/api/auth` endpoints (e.g., 5 attempts per minute per IP)
- Account lockout after N failed attempts
- bcrypt's built-in slowness (each hash takes ~100ms)

### Threat 5: Session hijacking

**Attack:** Attacker steals a user's session cookie.

**Defense:**
- httpOnly cookies (JavaScript can't read them)
- Secure flag (only sent over HTTPS)
- SameSite flag (prevents CSRF)
- Short JWT expiry (e.g., 24 hours)
- Auth.js handles all of this by default

### Threat 6: Data at rest theft (database breach)

**Attack:** Someone gains access to the Neon database directly.

**Defense:**
- Neon encrypts all data at rest (AES-256)
- Passwords stored as bcrypt hashes (irreversible)
- Connection via SSL only
- IP allowlisting (restrict which IPs can connect to Neon)
- Rotate database credentials periodically

### Threat 7: Insider threat (developer or staff)

**Attack:** A developer or nursery staff member tries to access data they shouldn't.

**Defense:**
- RLS policies enforce isolation even for direct SQL access
- Audit logging records all data access (future implementation)
- Principle of least privilege: app DB user has limited permissions; only migration user has full access
- Separate Neon roles: `app_user` (limited, RLS-enforced) vs `admin_user` (full, for migrations only)

### Threat 8: Data export / scraping

**Attack:** Authorized user exports large amounts of data.

**Defense:**
- Rate limiting on data-heavy endpoints
- Pagination limits (max 100 records per page)
- Audit logging of export actions
- Consider: restrict Excel export to admin role only

---

## 13. Implementation Plan

### Phase 1 — Schema Foundation (4-6 hours)

**What:** Add `organizationId` to models that need it. Update the Organization model. Run migrations.

**Changes:**
1. Update `Organization` model (add slug, plan, isActive)
2. Add `organizationId` to `User` model
3. Add `organizationId` to `SchoolYear`, `Food`, `EventType`, `MessageThread`, `Message`
4. Add `branchId` to `EmployeeEvent`
5. Create migration SQL
6. Seed: create one Organization, link existing branches and users to it

**Risk:** LOW — additive changes only (new columns with defaults or backfill).

### Phase 2 — Auth Changes (2-3 hours)

**What:** Add organizationId to session, update login flow.

**Changes:**
1. Update `auth.ts` authorize function — look up user's organizationId
2. Update `auth.config.ts` JWT and session callbacks — include organizationId
3. Update Auth.js type declarations — add organizationId to Session
4. Create `src/lib/require-org.ts` helper

**Risk:** LOW — extends existing auth, doesn't break current login.

### Phase 3 — Enforcement Layer (10-14 hours)

**What:** Update all 28 server action files to use `requireOrg()`. This is the bulk of the work.

**Changes per file:**
1. Import `requireOrg` (or `requireBranch`)
2. Call it at the top of every exported function
3. Add `organizationId` to WHERE clauses
4. For models scoped via child/branch relationship, use nested filter: `branch: { organizationId }`

**Risk:** MEDIUM — touching every action file. Needs careful testing. One missed filter = potential data leak.

**Approach:** Systematic. Do one file at a time. Verify types compile. Test the page that uses those actions.

### Phase 4 — PostgreSQL RLS Policies (3-4 hours)

**What:** Add Row-Level Security as a safety net.

**Changes:**
1. Create a new database role `app_user` with limited permissions
2. Enable RLS on all tenant-scoped tables
3. Create policies that filter by `current_setting('app.current_org_id')`
4. Update `db.ts` to set the org context before queries
5. Keep `admin_user` role (current) for migrations (bypasses RLS)

**Risk:** MEDIUM — RLS can lock you out if misconfigured. Test thoroughly. Keep admin connection available for emergencies.

### Phase 5 — Onboarding Flow (6-8 hours)

**What:** Build the sign-up page and setup wizard.

**Changes:**
1. `/signup` page — create org + branch + admin user
2. `/setup` wizard — add classes, invite staff
3. Staff invitation system (email with temp password)
4. Welcome state on dashboard ("no data yet" vs populated)

**Risk:** LOW — new pages, doesn't affect existing functionality.

### Phase 6 — Testing & Hardening (4-6 hours)

**What:** Verify isolation works. Try to break it.

**Tests:**
1. Create 2 test organizations with sample data
2. Log in as Org A admin — verify can't see Org B data
3. Log in as Org A teacher — verify can't see Org B data
4. Try manipulating branchId in requests — verify blocked
5. Direct database query with RLS — verify filtered
6. Test branch switching within org
7. Test parent portal isolation
8. Test all 28 action files with wrong org context

---

## 14. Can This Be Done Overnight?

**Honest answer: No. It's 2-3 focused days of work.**

Here's why:

| Phase | Hours | Can be automated? |
|-------|-------|-------------------|
| 1. Schema | 4-6h | Partially (schema changes are mechanical) |
| 2. Auth | 2-3h | No — needs careful integration |
| 3. Enforcement (28 action files) | 10-14h | Partially — pattern is repetitive but each file is different |
| 4. RLS policies | 3-4h | Mostly — SQL is templated |
| 5. Onboarding | 6-8h | No — new UI + logic |
| 6. Testing | 4-6h | No — needs manual verification |
| **Total** | **30-40h** | |

**What COULD be done overnight (Phase 1 + 2 + start of 3):**
- Schema changes ✓
- Auth changes ✓
- Maybe 10-15 of the 28 action files ✓

**What should NOT be rushed:**
- RLS policies (misconfigured = locked out or data leak)
- Testing (the whole point is security — untested security is no security)
- Onboarding (needs good UX design, not just code)

**Recommended approach:** Do it in 3 sprints:
1. **Sprint 1 (Day 1):** Phases 1 + 2 — lay the foundation
2. **Sprint 2 (Day 2):** Phase 3 — update all action files
3. **Sprint 3 (Day 3):** Phases 4 + 5 + 6 — RLS, onboarding, testing

---

## 15. Future Considerations

### Billing & Subscription (not blocking, build later)

```
Organization
  ├── plan: "free" | "starter" | "professional"
  ├── limits: { maxChildren: 50, maxBranches: 1, maxStaff: 10 }
  ├── subscription: { status, startDate, renewDate, stripeCustomerId }
  └── usage: { currentChildren, currentBranches, currentStaff }
```

Enforce limits in `requireOrg()`:
```typescript
if (org.usage.currentChildren >= org.limits.maxChildren) {
  throw new Error("Plan limit reached: upgrade to add more children");
}
```

### Super-admin dashboard (for you, the platform owner)

A separate admin panel to:
- View all organizations
- Monitor usage
- Handle support requests
- Disable problematic orgs
- View platform-wide analytics

### Data export & portability

Nurseries should be able to export all their data (GDPR-like compliance). Build an export endpoint that dumps all org data to JSON/CSV.

### Audit logging

For sensitive operations (delete child, modify payment, export data):
```
AuditLog { orgId, userId, action, resourceType, resourceId, timestamp, metadata }
```

This creates an immutable trail of who did what, when. Critical for compliance and dispute resolution.

### Database performance at scale

At 500+ nurseries:
- Add composite indexes: `(organizationId, createdAt)` on frequently queried tables
- Consider read replicas for heavy reporting queries
- Neon's autoscaling handles compute automatically
- Monitor query performance with `pg_stat_statements`

---

## Summary

| Aspect | Decision |
|--------|----------|
| **Architecture** | Single shared database, row-level isolation |
| **Tenant key** | `organizationId` on every model (directly or via branch) |
| **Session** | JWT with `{ userId, orgId, branchId, role }` |
| **App enforcement** | `requireOrg()` helper in every server action |
| **DB enforcement** | PostgreSQL RLS policies as safety net |
| **Encryption** | At rest (Neon AES-256) + in transit (TLS) |
| **Passwords** | bcrypt hashed, never stored in plain text |
| **Timeline** | 3 days for core implementation |
| **Blocking for production?** | Yes — cannot go live without tenant isolation |
