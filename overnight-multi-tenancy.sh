#!/bin/bash
# Multi-Tenancy Overnight Script
# NO set -e — we want to continue on failure
cd /Users/karimsaab/Desktop/garderie
LOG_FILE="./overnight-multi-tenancy-log.txt"
echo "=== MULTI-TENANCY OVERNIGHT START — $(date) ===" | tee "$LOG_FILE"

run_phase() {
  local name="$1"
  local prompt="$2"
  echo "" | tee -a "$LOG_FILE"
  echo "=============================================" | tee -a "$LOG_FILE"
  echo "=== $name — $(date) ===" | tee -a "$LOG_FILE"
  echo "=============================================" | tee -a "$LOG_FILE"
  claude --dangerously-skip-permissions -p "$prompt" 2>&1 | tee -a "$LOG_FILE"
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "⚠ $name FAILED (exit $exit_code) — continuing..." | tee -a "$LOG_FILE"
  fi
  # Push whatever was committed in this phase
  git push origin ux-improvements 2>&1 | tee -a "$LOG_FILE"
  echo "=== $name COMPLETE — $(date) ===" | tee -a "$LOG_FILE"
}

# ─────────────────────────────────────────────
# PHASE 1: Schema Changes
# ─────────────────────────────────────────────
run_phase "Phase 1 — Schema Changes" '
You are adding multi-tenancy to a Next.js nursery app. This phase: edit the Prisma schema.

Read: prisma/schema.prisma

Make these changes to prisma/schema.prisma:

1. ORGANIZATION model — add slug, plan, isActive fields and new relations. Replace the existing Organization model with:
```
model Organization {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  slug      String   @unique
  logo      String?
  plan      String   @default("free")
  isActive  Boolean  @default(true)
  settings  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  branches    Branch[]
  users       User[]
  schoolYears SchoolYear[]
  foods       Food[]
  eventTypes  EventType[]

  @@map("organizations")
}
```

2. USER model — add after the branchId field:
```
organizationId String?       @db.Uuid
```
Add relation (after the branch relation):
```
organization Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
```
Add to the existing indexes:
```
@@index([organizationId])
```

3. SCHOOLYEAR model — add:
```
organizationId String?       @db.Uuid
organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
@@index([organizationId])
```

4. FOOD model — add:
```
organizationId String?       @db.Uuid
organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
@@index([organizationId])
```

5. EVENTTYPE model — add:
```
organizationId String?       @db.Uuid
organization   Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
@@index([organizationId])
```

6. MESSAGETHREAD model — add:
```
organizationId String? @db.Uuid
@@index([organizationId])
```

7. MESSAGE model — add:
```
organizationId String? @db.Uuid
@@index([organizationId])
```

8. EMPLOYEEEVENT model — add:
```
branchId String? @db.Uuid
@@index([branchId])
```

9. TEACHERATTENDANCE model — add:
```
branchId String? @db.Uuid
@@index([branchId])
```

IMPORTANT: For Food model, put the organizationId field and organization relation BEFORE the breakfastReports relation. For EventType, put them BEFORE the events relation. For SchoolYear, put the org fields BEFORE the children relation.

After editing, run:
```
pnpm exec prisma db push && pnpm exec prisma generate
```

If prisma db push succeeds, commit:
```
git add prisma/schema.prisma && git commit -m "feat: add multi-tenancy fields to schema (org on User, SchoolYear, Food, EventType, Message, MessageThread; branchId on EmployeeEvent, TeacherAttendance)"
```
'

# ─────────────────────────────────────────────
# PHASE 2: Backfill Script
# ─────────────────────────────────────────────
run_phase "Phase 2 — Backfill Script" '
You are adding multi-tenancy to a Next.js nursery app. This phase: create and run a backfill script.

Read: prisma/schema.prisma (to understand the models)

Create file: scripts/backfill-org.ts

The script must:
1. Import PrismaClient from "@/generated/prisma" (but since this is a standalone script, use: import { PrismaClient } from "../src/generated/prisma")
2. Find the first existing Organization, or create one with name "KiddzOnline" and slug "kiddzoline"
3. If the org exists but has no slug, update it to set slug = "kiddzoline"
4. Update all Users where organizationId IS NULL → set to org.id
5. Update all SchoolYears where organizationId IS NULL → set to org.id
6. Update all Foods where organizationId IS NULL → set to org.id
7. Update all EventTypes where organizationId IS NULL → set to org.id
8. Update all Messages where organizationId IS NULL → set to org.id
9. Update all MessageThreads where organizationId IS NULL → set to org.id
10. For EmployeeEvents without branchId: for each event, look up the employee by employeeId using the employeeType field (query db.teacher, db.nurse, db.doctor, or db.manager accordingly with findUnique where id = employeeId, select branchId). Then update the event with that branchId.
11. Same logic for TeacherAttendance records without branchId — look up the employee by employeeId (default employeeType is "teacher", so query db.teacher).

Use updateMany where possible for bulk updates. For the employee lookups (steps 10-11), you may need to loop.

The script must be idempotent (safe to run multiple times). Log what it does with console.log.

Run it with:
```
npx tsx scripts/backfill-org.ts
```

If it succeeds, commit:
```
git add scripts/backfill-org.ts && git commit -m "feat: add backfill script for multi-tenancy org assignment"
```
'

# ─────────────────────────────────────────────
# PHASE 3: Auth Changes (types + config + auth.ts)
# ─────────────────────────────────────────────
run_phase "Phase 3 — Auth Changes" '
You are adding multi-tenancy to a Next.js nursery app. This phase: update auth types, config, and authorize function.

Read these files:
- src/types/next-auth.d.ts
- src/lib/auth.config.ts
- src/lib/auth.ts

Make these changes:

1. src/types/next-auth.d.ts — Add organizationId to all interfaces:

```typescript
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
      branchId: string | null;
      organizationId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
    branchId: string | null;
    organizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
    branchId: string | null;
    organizationId: string | null;
  }
}
```

2. src/lib/auth.config.ts — In jwt callback, add after token.branchId line:
```typescript
token.organizationId = user.organizationId;
```
In session callback, add after session.user.branchId line:
```typescript
session.user.organizationId = token.organizationId as string | null;
```

3. src/lib/auth.ts — In the authorize function:
Change the user query to include branch:
```typescript
const user = await db.user.findUnique({
  where: { email },
  include: { branch: { select: { organizationId: true } } },
});
```
Change the return to include organizationId:
```typescript
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  branchId: user.branchId,
  organizationId: user.organizationId ?? user.branch?.organizationId ?? null,
};
```

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/types/next-auth.d.ts src/lib/auth.config.ts src/lib/auth.ts && git commit -m "feat: add organizationId to auth session, JWT, and authorize flow"
```
'

# ─────────────────────────────────────────────
# PHASE 4: Create Helper Files + Edit Layout
# ─────────────────────────────────────────────
run_phase "Phase 4 — Helpers + Layout" '
You are adding multi-tenancy to a Next.js nursery app. This phase: create the requireOrg helper, verifyOrgAccess helper, and update the app layout.

Read: src/app/(app)/layout.tsx

1. Create file src/lib/require-org.ts:
```typescript
import { auth } from "@/lib/auth";

export interface OrgContext {
  userId: string;
  organizationId: string;
  branchId: string | null;
  role: "ADMIN" | "TEACHER" | "NURSE" | "DOCTOR" | "MANAGER";
}

/** For read functions — throws on missing org (caught by try/catch). */
export async function requireOrg(): Promise<OrgContext> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!session.user.organizationId) throw new Error("No organization context");
  return {
    userId: session.user.id,
    organizationId: session.user.organizationId,
    branchId: session.user.branchId ?? null,
    role: session.user.role,
  };
}

/** For write functions — returns error object instead of throwing. */
export async function requireOrgSafe(): Promise<
  | { ok: true; ctx: OrgContext }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };
  if (!session.user.organizationId) return { ok: false, error: "No organization context" };
  return {
    ok: true,
    ctx: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      branchId: session.user.branchId ?? null,
      role: session.user.role,
    },
  };
}
```

2. Create file src/lib/verify-org-access.ts:
```typescript
import { db } from "@/lib/db";

/** Verify a branchId belongs to the given org. */
export async function verifyBranchAccess(branchId: string, orgId: string): Promise<boolean> {
  const branch = await db.branch.findFirst({
    where: { id: branchId, organizationId: orgId },
    select: { id: true },
  });
  return !!branch;
}

/** Verify a child belongs to the given org via its branch. */
export async function verifyChildAccess(childId: string, orgId: string): Promise<boolean> {
  const child = await db.child.findFirst({
    where: { id: childId, branch: { organizationId: orgId } },
    select: { id: true },
  });
  return !!child;
}

/** Get all branch IDs for an organization (for IN-clause filters). */
export async function getOrgBranchIds(orgId: string): Promise<string[]> {
  const branches = await db.branch.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  });
  return branches.map((b) => b.id);
}
```

3. Edit src/app/(app)/layout.tsx — Change the data fetching to filter by org:
Replace the Promise.all block. The new version should first await auth(), then use the orgId to filter:

```typescript
const session = await auth()
const orgId = session?.user?.organizationId

const [branches, years, badges] = await Promise.all([
  orgId
    ? db.branch.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [],
  orgId
    ? db.schoolYear.findMany({
        where: { organizationId: orgId },
        select: { id: true, label: true },
        orderBy: { startDate: "desc" },
      })
    : [],
  getSidebarBadges(),
])
```

Keep the rest of the file the same (defaultBranchId, userRole, JSX).

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/require-org.ts src/lib/verify-org-access.ts src/app/\(app\)/layout.tsx && git commit -m "feat: add requireOrg/verifyOrgAccess helpers and filter layout by org"
```
'

# ─────────────────────────────────────────────
# PHASE 5: branches.ts + children.ts
# ─────────────────────────────────────────────
run_phase "Phase 5 — branches.ts + children.ts" '
You are adding multi-tenancy org scoping to a Next.js app. Every database query must be scoped to the logged-in users organization.

Read these files:
- src/lib/require-org.ts (to understand the helper)
- src/lib/verify-org-access.ts (to understand the helper)
- src/lib/actions/branches.ts
- src/lib/actions/children.ts

IMPORTANT PATTERN: In every function that currently calls `auth()` and uses session, replace that with `requireOrg()` or `requireOrgSafe()` from "@/lib/require-org". Use `requireOrg()` for read functions (inside try/catch). Use `requireOrgSafe()` for write/mutation functions that return `{ success, error }` objects.

For `requireOrgSafe()`, destructure like:
```typescript
const result = await requireOrgSafe();
if (!result.ok) return { success: false, error: result.error };
const { ctx } = result;
// use ctx.organizationId, ctx.userId, ctx.branchId, ctx.role
```

For `requireOrg()`:
```typescript
const { organizationId: orgId, userId, branchId, role } = await requireOrg();
```

Changes to src/lib/actions/branches.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess } from "@/lib/verify-org-access"
- Remove import of auth if it becomes unused
- getBranches(): replace auth() with requireOrg(), add where: { organizationId: orgId } to the findMany
- getBranch(id): replace auth() with requireOrg(), after fetching the branch verify branch.organizationId === orgId, throw if not
- If there is a getDefaultOrganizationId() function, DELETE it entirely
- createBranch(): replace auth() with requireOrgSafe(), always set organizationId: ctx.organizationId in the create data (never from client input)
- updateBranch(): replace auth() with requireOrgSafe(), first verify the branch belongs to org using verifyBranchAccess, never allow changing organizationId
- deleteBranch(): replace auth() with requireOrgSafe(), verify branch belongs to org before deleting

Changes to src/lib/actions/children.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess, verifyChildAccess } from "@/lib/verify-org-access"
- Remove auth import if unused
- getChildren(): replace auth() with requireOrg(), add branch: { organizationId: orgId } to the where clause
- getChild(id): replace auth() with requireOrg(), include branch in the query (select: { organizationId: true }), verify child.branch.organizationId === orgId
- createChild(): replace auth() with requireOrgSafe(), verify data.branchId belongs to org using verifyBranchAccess before creating
- updateChild(): replace auth() with requireOrgSafe(), verify existing child belongs to org using verifyChildAccess
- deleteChild(): replace auth() with requireOrgSafe(), verify child belongs to org using verifyChildAccess
- getDrafts(): if it delegates to getChildren, no change needed. If it queries directly, add org filter.
- getChildDashboardStats(): replace auth() with requireOrg(), verify child belongs to org

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/branches.ts src/lib/actions/children.ts && git commit -m "feat: add org scoping to branches and children actions"
```
'

# ─────────────────────────────────────────────
# PHASE 6: classes.ts + school-years.ts + food.ts
# ─────────────────────────────────────────────
run_phase "Phase 6 — classes.ts + school-years.ts + food.ts" '
You are adding multi-tenancy org scoping to a Next.js app.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/classes.ts
- src/lib/actions/school-years.ts
- src/lib/actions/food.ts

PATTERN: Replace auth() calls with requireOrg() (reads) or requireOrgSafe() (writes). Add org filters to every query.

Changes to src/lib/actions/classes.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess } from "@/lib/verify-org-access"
- getClasses(): add branch: { organizationId: orgId } to where
- getClass(id): include branch, verify branch.organizationId === orgId
- createClass(): verify branchId belongs to org
- updateClass(): fetch first, verify branch org
- deleteClass(): fetch first, verify branch org

Changes to src/lib/actions/school-years.ts:
- Import helpers
- getSchoolYears(): add where: { organizationId: orgId }
- createSchoolYear(): add organizationId: ctx.organizationId to create data
- updateSchoolYear(): verify year.organizationId === orgId before updating
- setActiveSchoolYear(): scope the updateMany to organizationId: orgId, verify target year belongs to org

Changes to src/lib/actions/food.ts:
- Import helpers
- getFoods(): add where: { organizationId: orgId }
- createFood(): add organizationId: ctx.organizationId to create data
- updateFood(): verify food.organizationId === orgId
- deleteFood(): verify food.organizationId === orgId
- getFoodCalendar(): verify branchId belongs to org
- getFoodCalendarMonth(): verify branchId belongs to org
- setFoodCalendarEntry(): verify both branchId and foodId belong to org. For foodId check: fetch the food and verify food.organizationId === orgId
- deleteFoodCalendarEntry(): fetch with branch, verify org

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/classes.ts src/lib/actions/school-years.ts src/lib/actions/food.ts && git commit -m "feat: add org scoping to classes, school-years, and food actions"
```
'

# ─────────────────────────────────────────────
# PHASE 7: employees.ts
# ─────────────────────────────────────────────
run_phase "Phase 7 — employees.ts" '
You are adding multi-tenancy org scoping to a Next.js app. File is large (576 lines).

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/employees.ts

Changes to src/lib/actions/employees.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess } from "@/lib/verify-org-access"
- getEmployees(): replace auth() with requireOrg(), add branch: { organizationId: orgId } to the where clause for every employee type query (teachers, nurses, doctors, managers)
- getEmployee(): replace auth() with requireOrg(), include branch in query, verify branch.organizationId === orgId
- createEmployee(): replace auth() with requireOrgSafe(), verify branchId belongs to org using verifyBranchAccess
- updateEmployee(): replace auth() with requireOrgSafe(), verify the employee branch belongs to org
- deleteEmployee(): replace auth() with requireOrgSafe(), verify employee branch belongs to org

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/employees.ts && git commit -m "feat: add org scoping to employees actions"
```
'

# ─────────────────────────────────────────────
# PHASE 8: employee-events.ts + attendance.ts
# ─────────────────────────────────────────────
run_phase "Phase 8 — employee-events.ts + attendance.ts" '
You are adding multi-tenancy org scoping to a Next.js app.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/employee-events.ts
- src/lib/actions/attendance.ts

Changes to src/lib/actions/employee-events.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess, verifyChildAccess, getOrgBranchIds } from "@/lib/verify-org-access"
- For functions that list employee events: call requireOrg(), then getOrgBranchIds(orgId), then filter by branchId: { in: orgBranchIds }
- For create functions: look up the employees branchId from their model (teacher/nurse/doctor/manager), verify it belongs to org, set branchId on the event
- For update/delete: fetch event, verify branchId belongs to org
- getAttendanceLogs(): same approach with org branch IDs
- createAttendanceLog(): look up employee, verify branch, set branchId
- bulkCreateAttendanceLogs(): verify all employees belong to org
- updateAttendanceLog(): fetch, verify org

Changes to src/lib/actions/attendance.ts:
- Import helpers
- getChildAttendance(): replace auth() with requireOrg(), verify child belongs to org using verifyChildAccess
- getChildAbsences(): same pattern
- createAbsenceReport(): verify childs branch belongs to org
- markBulkAttendance(): verify all children belong to org

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/employee-events.ts src/lib/actions/attendance.ts && git commit -m "feat: add org scoping to employee-events and attendance actions"
```
'

# ─────────────────────────────────────────────
# PHASE 9: daily-reports.ts + absent-reports.ts
# ─────────────────────────────────────────────
run_phase "Phase 9 — daily-reports.ts + absent-reports.ts" '
You are adding multi-tenancy org scoping to a Next.js app.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/daily-reports.ts
- src/lib/actions/absent-reports.ts

Changes to src/lib/actions/daily-reports.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyChildAccess } from "@/lib/verify-org-access"
- getDailyReports(): add child: { branch: { organizationId: orgId } } to where
- getDailyReport(id): include child with branch, verify child.branch.organizationId === orgId
- createDailyReport(): verify childs branch belongs to org using verifyChildAccess
- updateDailyReport(): fetch with child→branch, verify org
- submitDailyReport(): fetch with child→branch, verify org
- deleteDailyReport(): fetch with child→branch, verify org
- getDraftReports(): if it delegates to getDailyReports, already secured. If direct query, add org filter.

Changes to src/lib/actions/absent-reports.ts:
- Import helpers
- getAbsenceReports(): add child: { branch: { organizationId: orgId } } to where
- getAbsenceReport(id): include child→branch, verify org
- createAbsenceReport(): verify childs branch belongs to org
- updateAbsenceReport(): fetch, verify org
- updateAbsenceReportStatus(): fetch, verify org
- deleteAbsenceReport(): fetch, verify org
- getPendingAbsenceReports(): add child→branch→org filter

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/daily-reports.ts src/lib/actions/absent-reports.ts && git commit -m "feat: add org scoping to daily-reports and absent-reports actions"
```
'

# ─────────────────────────────────────────────
# PHASE 10: assessments.ts + medical.ts
# ─────────────────────────────────────────────
run_phase "Phase 10 — assessments.ts + medical.ts" '
You are adding multi-tenancy org scoping to a Next.js app.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/assessments.ts
- src/lib/actions/medical.ts

Changes to src/lib/actions/assessments.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyChildAccess, verifyBranchAccess } from "@/lib/verify-org-access"
- getAssessments(): add child: { branch: { organizationId: orgId } } to where
- getAssessment(id): include child→branch, verify org
- createAssessment(): verify childs branch belongs to org
- updateAssessment(): fetch, verify org
- deleteAssessment(): fetch, verify org
- getAssessmentDates(): add branch: { organizationId: orgId } to where
- createAssessmentDate(): verify branchId belongs to org
- deleteAssessmentDate(): fetch, verify branch org

Changes to src/lib/actions/medical.ts:
- Import helpers
- getMedicalForms(): add child: { branch: { organizationId: orgId } } to where
- getMedicalForm(id): include child→branch, verify org
- createMedicalForm(): verify childs branch
- updateMedicalForm(): fetch, verify org
- deleteMedicalForm(): fetch, verify org
- getVaccinations(): add child→branch→org filter
- createVaccination(): verify childs branch
- updateVaccination(): fetch, verify org
- getVaccination(id): include child→branch, verify org
- deleteVaccination(): fetch, verify org

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/assessments.ts src/lib/actions/medical.ts && git commit -m "feat: add org scoping to assessments and medical actions"
```
'

# ─────────────────────────────────────────────
# PHASE 11: payments.ts + accounting.ts
# ─────────────────────────────────────────────
run_phase "Phase 11 — payments.ts + accounting.ts" '
You are adding multi-tenancy org scoping to a Next.js app.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/payments.ts
- src/lib/actions/accounting.ts

Changes to src/lib/actions/payments.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyChildAccess, verifyBranchAccess } from "@/lib/verify-org-access"
- getPayments(): add child: { branch: { organizationId: orgId } } to where
- getPaymentsSummary(): add child→branch→org filter
- createPayment(): verify childs branch belongs to org
- updatePayment(): fetch with child→branch, verify org
- deletePayment(): fetch, verify org
- getChildPayments(): verify childs branch belongs to org
- getOverduePayments(): add child: { branch: { organizationId: orgId } } to where
- getChildrenForPayment(): add branch: { organizationId: orgId } to where
- recordPayment(): verify childs branch belongs to org

Changes to src/lib/actions/accounting.ts:
- Import helpers
- getChildAccounting(): verify childs branch belongs to org using verifyChildAccess
- createAccountingEntry(): verify childs branch
- getAccountingSummary(): add child→branch→org filter to all queries

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/payments.ts src/lib/actions/accounting.ts && git commit -m "feat: add org scoping to payments and accounting actions"
```
'

# ─────────────────────────────────────────────
# PHASE 12: messages.ts
# ─────────────────────────────────────────────
run_phase "Phase 12 — messages.ts" '
You are adding multi-tenancy org scoping to a Next.js app. messages.ts is large (687 lines).

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/messages.ts

Changes to src/lib/actions/messages.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess } from "@/lib/verify-org-access"
- getUnreadMessageCount(): add organizationId: orgId to the where clause alongside recipientId
- getInbox(): add organizationId: orgId alongside recipientId in where
- getSentMessages(): add organizationId: orgId alongside senderId in where
- getMessageById(): after fetching, verify message.organizationId === orgId (or add it to the where)
- sendMessage(): add organizationId: ctx.organizationId to both message create and thread create (if creating a thread)
- replyToMessage(): verify original message belongs to org (message.organizationId === orgId), add orgId to new message create
- markAsRead() / markAsUnread(): verify message belongs to org before updating
- bulkMarkAsRead(): add organizationId: orgId to updateMany where clause
- deleteMessage(): verify message belongs to org before deleting
- bulkDeleteMessages(): add organizationId: orgId to deleteMany where clause
- sendClassMessage(): verify the class belongs to org (include branch, check branch.organizationId), add orgId to all message creates

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/messages.ts && git commit -m "feat: add org scoping to messages actions"
```
'

# ─────────────────────────────────────────────
# PHASE 13: settings.ts
# ─────────────────────────────────────────────
run_phase "Phase 13 — settings.ts" '
You are adding multi-tenancy org scoping to a Next.js app. settings.ts is large (786 lines).

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/settings.ts

Changes to src/lib/actions/settings.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess } from "@/lib/verify-org-access"

For branch-specific settings:
- getSettings(): verify branchId belongs to org using verifyBranchAccess
- setSetting(): verify branchId belongs to org
- updateNurserySettings(): verify branchId belongs to org

Global reference data — NO CHANGE needed:
- getRegions(), create/update/deleteProvince(), create/update/deleteDistrict(), create/update/deleteRegion() — these are global Lebanese administrative data, do NOT add org scoping

Holidays:
- getHolidays(): add branch: { organizationId: orgId } or verify branchId belongs to org
- createHoliday(): verify branch belongs to org
- updateHoliday(): verify branch belongs to org
- deleteHoliday(): verify branch belongs to org

EventTypes:
- getEventTypes(): add where: { organizationId: orgId }
- createEventType(): add organizationId: ctx.organizationId to create
- updateEventType(): verify eventType.organizationId === orgId
- deleteEventType(): verify eventType.organizationId === orgId

Events:
- getEvents(): add branch: { organizationId: orgId } to where
- createEvent(): verify branch belongs to org
- updateEvent(): verify branch belongs to org
- deleteEvent(): verify branch belongs to org

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/settings.ts && git commit -m "feat: add org scoping to settings actions"
```
'

# ─────────────────────────────────────────────
# PHASE 14: alarms.ts
# ─────────────────────────────────────────────
run_phase "Phase 14 — alarms.ts" '
You are adding multi-tenancy org scoping to a Next.js app. alarms.ts is the largest file (629 lines).

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/alarms.ts

Changes to src/lib/actions/alarms.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess, getOrgBranchIds } from "@/lib/verify-org-access"

Alarm CRUD:
- getAlarms(): add branch: { organizationId: orgId } to where
- createAlarm(): verify branchId belongs to org
- updateAlarm(): fetch alarm first, verify alarm.branch.organizationId === orgId (include branch in query)
- dismissAlarm(): fetch first, verify branch org
- deleteAlarm(): fetch first, verify branch org

Dashboard queries:
- getUpcomingBirthdays(): add branch: { organizationId: orgId } to child query
- getOverdueVaccinations(): add child: { branch: { organizationId: orgId } } to where
- getUpcomingAssessments(): add branch: { organizationId: orgId } to where
- getAlarmOverviewCounts(): add org filter to EVERY sub-query in this function

Notifications — NO CHANGE (user-scoped):
- getNotifications() — already scoped by userId, no change
- getUnreadNotificationCount() — already scoped by userId, no change
- markNotificationRead() / markAllNotificationsRead() — already scoped by userId, no change

getHeaderAlarmCounts(): Add org filter to every sub-query. IMPORTANT: If there is a RAW SQL query (e.g. for birthday count using $queryRaw or Prisma.sql), add WHERE "branchId" IN (SELECT id FROM branches WHERE "organizationId" = cast(${orgId} as uuid)) or similar. For Prisma queries, use branch: { organizationId: orgId }.

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/alarms.ts && git commit -m "feat: add org scoping to alarms actions"
```
'

# ─────────────────────────────────────────────
# PHASE 15: calls.ts + medical-timeline.ts + timeline.ts + search.ts
# ─────────────────────────────────────────────
run_phase "Phase 15 — calls + medical-timeline + timeline + search" '
You are adding multi-tenancy org scoping to a Next.js app.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/calls.ts
- src/lib/actions/medical-timeline.ts
- src/lib/actions/timeline.ts
- src/lib/actions/search.ts

Changes to src/lib/actions/calls.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyChildAccess } from "@/lib/verify-org-access"
- getChildCallLogs(): verify childs branch belongs to org
- getCallLogs(): add child: { branch: { organizationId: orgId } } to where
- createCallLog(): verify childs branch belongs to org
- deleteCallLog(): fetch with child→branch, verify org

Changes to src/lib/actions/medical-timeline.ts:
- Import { requireOrg } from "@/lib/require-org" and { verifyChildAccess } from "@/lib/verify-org-access"
- getChildMedicalTimeline(): verify childs branch belongs to org

Changes to src/lib/actions/timeline.ts:
- Import { requireOrg } from "@/lib/require-org" and { verifyChildAccess } from "@/lib/verify-org-access"
- getChildTimeline(): verify childs branch belongs to org

Changes to src/lib/actions/search.ts:
- Import { requireOrg } from "@/lib/require-org"
- globalSearch(): add branch: { organizationId: orgId } to every findMany query (children, teachers, nurses, doctors, managers)

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/calls.ts src/lib/actions/medical-timeline.ts src/lib/actions/timeline.ts src/lib/actions/search.ts && git commit -m "feat: add org scoping to calls, medical-timeline, timeline, and search actions"
```
'

# ─────────────────────────────────────────────
# PHASE 16: notification-center.ts + parent-users.ts + branch-compliance.ts
# ─────────────────────────────────────────────
run_phase "Phase 16 — notification-center + parent-users + branch-compliance" '
You are adding multi-tenancy org scoping to a Next.js app.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/notification-center.ts
- src/lib/actions/parent-users.ts
- src/lib/actions/branch-compliance.ts

Changes to src/lib/actions/notification-center.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess, getOrgBranchIds } from "@/lib/verify-org-access"
- getActionableAlarms(): add org filter to every sub-query (alarms: branch→org, vaccinations: child→branch→org, children needing reports: branch→org, overdue payments: child→branch→org)
- snoozeAlarm(): fetch alarm with branch, verify branch belongs to org
- resolveAlarm(): same — fetch alarm with branch, verify org

Changes to src/lib/actions/parent-users.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyChildAccess } from "@/lib/verify-org-access"
- getParentUsers(): add child: { branch: { organizationId: orgId } } to where
- getParentUser(id): include child→branch, verify child.branch.organizationId === orgId
- createParentUser(): verify childs branch belongs to org using verifyChildAccess
- updateParentUser(): fetch with child→branch, verify org
- resetParentPassword(): fetch with child→branch, verify org
- toggleParentUserStatus(): fetch with child→branch, verify org

Changes to src/lib/actions/branch-compliance.ts:
- Import { requireOrg, requireOrgSafe } from "@/lib/require-org" and { verifyBranchAccess } from "@/lib/verify-org-access"
- getCompliance(): verify branchId belongs to org
- upsertCompliance(): verify branchId belongs to org
- getDocuments(): verify branchId belongs to org
- upsertDocument(): verify branchId belongs to org

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/notification-center.ts src/lib/actions/parent-users.ts src/lib/actions/branch-compliance.ts && git commit -m "feat: add org scoping to notification-center, parent-users, and branch-compliance actions"
```
'

# ─────────────────────────────────────────────
# PHASE 17: dashboard.ts + today.ts + sidebar.ts + header.ts
# ─────────────────────────────────────────────
run_phase "Phase 17 — dashboard + today + sidebar + header" '
You are adding multi-tenancy org scoping to a Next.js app. dashboard.ts is the MOST COMPLEX file — it has many aggregate queries and RAW SQL.

Read these files:
- src/lib/require-org.ts
- src/lib/verify-org-access.ts
- src/lib/actions/dashboard.ts
- src/lib/actions/today.ts
- src/lib/actions/sidebar.ts
- src/lib/actions/header.ts

Changes to src/lib/actions/dashboard.ts:
- Import { requireOrg } from "@/lib/require-org" and { getOrgBranchIds } from "@/lib/verify-org-access"
- getMorningBriefing(): replace auth() with requireOrg(). Add org filter to EVERY query:
  * db.child.count → add branch: { organizationId: orgId } to where
  * db.dailyReport.count → add child: { branch: { organizationId: orgId } } to where
  * db.absenceReport.count → same child→branch→org pattern
  * db.teacher.count → add branch: { organizationId: orgId }
  * db.nurse.count → same
  * db.doctor.count → same
  * db.employeeEvent.count → get orgBranchIds first, filter branchId: { in: orgBranchIds }
  * db.medicalForm queries → child→branch→org
  * db.alarm.count → branch: { organizationId: orgId }
  * db.foodCalendar.findMany → branch: { organizationId: orgId }
  * RAW SQL queries (weekly reports, chronic absences): Add JOIN to branches table with org filter. For example if there is $queryRaw, add: JOIN children ON daily_reports."childId" = children.id JOIN branches ON children."branchId" = branches.id WHERE branches."organizationId" = cast(${orgId} as uuid)
  * db.payment queries → child→branch→org
- getActionItems(): same org filter treatment on every sub-query

Changes to src/lib/actions/today.ts:
- Import { requireOrg } from "@/lib/require-org"
- getTodayData(): replace auth() with requireOrg(). Add org filter to every query: children → branch: { organizationId: orgId }, reports → child: { branch: { organizationId: orgId } }, etc.

Changes to src/lib/actions/sidebar.ts:
- Import { requireOrg } from "@/lib/require-org"
- getSidebarBadges(): replace auth() with requireOrg(). Add org filter to every count: db.child.count → branch: { organizationId: orgId }, db.dailyReport.count → child→branch→org, db.alarm.count → branch: { organizationId: orgId }

Changes to src/lib/actions/header.ts:
- Import { requireOrg } from "@/lib/require-org"
- getHeaderData(): call requireOrg(). Add org filter to any inline alarm or data queries. Functions that are delegated to other actions files (alarms, notifications, messages) are already secured by previous phases.

Run: npx tsc --noEmit
If it passes, commit:
```
git add src/lib/actions/dashboard.ts src/lib/actions/today.ts src/lib/actions/sidebar.ts src/lib/actions/header.ts && git commit -m "feat: add org scoping to dashboard, today, sidebar, and header actions"
```
'

# ─────────────────────────────────────────────
# PHASE 18: Final Verification
# ─────────────────────────────────────────────
run_phase "Phase 18 — Final Verification" '
You are verifying the multi-tenancy implementation. Run these checks:

1. Run: npx tsc --noEmit
   If there are TypeScript errors, fix them. Common issues:
   - Missing organizationId on session type
   - auth() vs requireOrg() return type mismatches
   - Missing imports

2. If tsc passes, try building: pnpm exec next build
   If build fails with errors, fix them.

3. Check that no action file still imports auth directly (it should use requireOrg instead):
   Run: grep -r "from.*auth.*import.*auth\b" src/lib/actions/ --include="*.ts" -l
   Or: grep -rn "await auth()" src/lib/actions/ --include="*.ts"

   If any action file still uses raw auth(), that is likely a bug — it should use requireOrg() or requireOrgSafe().
   EXCEPTION: If a function is explicitly user-scoped (like notifications where userId is enough), auth() is fine.

4. If there are remaining files using auth() that should use requireOrg(), fix them.

5. If everything passes, commit any fixes:
```
git add -A && git commit -m "fix: resolve remaining TypeScript errors from multi-tenancy migration"
```
'

# ═══════════════════════════════════════════════
# UI REDESIGN — CLAUDE AESTHETIC
# ═══════════════════════════════════════════════
# The following phases transform KiddzOnline from
# a playful teal theme into a warm, organic, minimal
# design inspired by Claude's UI: cream backgrounds,
# terracotta accents, generous whitespace, paper-like
# surfaces, and a sophisticated yet warm feel.
# ═══════════════════════════════════════════════

# ─────────────────────────────────────────────
# PHASE 19: Design System Foundation — globals.css
# ROLE: Creative Director + Design Systems Lead
# ─────────────────────────────────────────────
run_phase "Phase 19 — Design System: globals.css" '
You are a Senior Creative Director redesigning a nursery management app (KiddzOnline) to match the design language of Claude by Anthropic — warm, organic, minimal, paper-like. Think: cream parchment backgrounds, terracotta/sienna accents, soft warm shadows, generous whitespace, a feeling of calm intelligence.

This is NOT a corporate rebrand. This is an elevation to something that feels like a luxury stationery brand meets modern SaaS — warm and human, never cold or clinical.

Read: src/app/globals.css

Replace the ENTIRE `:root` color section and accent palette with this Claude-inspired design system. Keep the @import lines, @custom-variant, @theme inline block structure, @layer base, print styles, and scrollbar styles — but update ALL the color values.

New `:root` variables (replace the existing ones):
```css
:root {
  --radius: 0.875rem;

  /* Warm parchment canvas — the signature Claude feel */
  --background: #F5F0E8;
  --foreground: #1A1613;

  --card: #FFFFFF;
  --card-foreground: #1A1613;
  --popover: #FFFFFF;
  --popover-foreground: #1A1613;

  /* Primary = warm terracotta/sienna — Claudes signature warmth */
  --primary: #C35A2C;
  --primary-foreground: #FFFFFF;

  --secondary: #EDE8DF;
  --secondary-foreground: #3D3530;

  --muted: #EDE8DF;
  --muted-foreground: #8A7E74;

  --accent: #F7F2EB;
  --accent-foreground: #C35A2C;

  --destructive: #C53030;

  --border: #DDD6CB;
  --input: #CFC8BC;
  --ring: #C35A2C;

  /* Warm, muted chart palette */
  --chart-1: #C35A2C;
  --chart-2: #8B7355;
  --chart-3: #B08968;
  --chart-4: #6B8F71;
  --chart-5: #9B7653;

  /* Sidebar — warm dark surface, like aged leather */
  --sidebar: #2C2420;
  --sidebar-foreground: #E8DFD4;
  --sidebar-primary: #E8A87C;
  --sidebar-primary-foreground: #1A1613;
  --sidebar-accent: #3D3530;
  --sidebar-accent-foreground: #F0E9E0;
  --sidebar-border: #3D3530;
  --sidebar-ring: #E8A87C;
}
```

In the `@theme inline` block, REMOVE the old playful accent palette (--color-accent-coral, --color-accent-purple, etc.) and replace with:
```css
  /* Claude-inspired warm accent palette */
  --color-accent-terracotta: #C35A2C;
  --color-accent-sienna: #B08968;
  --color-accent-sage: #6B8F71;
  --color-accent-clay: #9B7653;
  --color-accent-sand: #D4C5B2;
  --color-accent-copper: #B87333;
  --color-accent-moss: #5B7B5E;
  --color-accent-warmgray: #8A7E74;
```

Update the font-sans:
```css
  --font-sans: "Söhne", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
```
Note: Söhne wont be available, but listing it first means the system fonts will kick in as beautiful fallbacks. The key is moving away from "Plus Jakarta Sans" to system fonts that feel more editorial.

Update .header-bar:
```css
.header-bar {
  background: rgba(245, 240, 232, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  height: 56px;
  border-bottom: 1px solid rgba(221, 214, 203, 0.6);
}
```

Update .footer-bar:
```css
.footer-bar {
  background: transparent;
  color: #8A7E74;
  border-top: 1px solid rgba(221, 214, 203, 0.4);
}
```

Update scrollbar thumb colors:
```css
::-webkit-scrollbar-thumb {
  background: #CFC8BC;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #8A7E74;
}
```

In the @layer base body style, change the font-size to 14.5px (slightly more generous) and add letter-spacing:
```css
  body {
    @apply bg-background text-foreground font-sans;
    font-size: 14.5px;
    line-height: 1.65;
    letter-spacing: -0.01em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
```

Run: npx tsc --noEmit
Commit:
```
git add src/app/globals.css && git commit -m "design: replace playful teal theme with Claude-inspired warm organic design system"
```
'

# ─────────────────────────────────────────────
# PHASE 20: Sidebar Redesign
# ROLE: Senior UX Designer
# ─────────────────────────────────────────────
run_phase "Phase 20 — Sidebar Redesign" '
You are a Senior UX Designer. The app now has a warm dark sidebar (--sidebar: #2C2420, --sidebar-foreground: #E8DFD4) inspired by Claudes dark warm aesthetic. Redesign the sidebar to feel like a premium, warm navigation — think aged wood, leather, warm paper.

Read: src/components/layout/app-sidebar.tsx

Make these changes:

1. Replace the sectionColors map — instead of teal/sky/violet/rose/amber colors, use warm muted tones that work on the dark sidebar:
```typescript
const sectionColors: Record<string, string> = {
  "Overview":       "text-sidebar-primary",
  "My Day":         "text-sidebar-primary",
  "Daily Ops":      "text-[#C9B99A]",
  "Reports":        "text-[#C9B99A]",
  "Children":       "text-[#D4A574]",
  "My Class":       "text-[#D4A574]",
  "Health":         "text-[#C4887A]",
  "Health Center":  "text-[#C4887A]",
  "Finance":        "text-[#C9B280]",
  "Staff & Setup":  "text-[#A89B8C]",
  "Communication":  "text-[#9BB0A0]",
  "Reference":      "text-[#A89B8C]",
}
```

2. Replace badgeColors with warm-toned badges that pop on dark background:
```typescript
const badgeColors: Record<keyof SidebarBadges, string> = {
  activeAlarms:   "bg-[#C35A2C]/20 text-[#E8A87C]",
  missingReports: "bg-[#C9B280]/20 text-[#E8D5A8]",
  unreadMessages: "bg-[#6B8F71]/20 text-[#9BB0A0]",
}
```

3. Update the Sidebar className to remove border-r and use the dark bg naturally:
```typescript
className="top-[56px] h-[calc(100svh-56px)]"
```
Note: changed from 52px to 56px to match new header height.

4. Update the active state styling — replace teal with warm terracotta that glows on the dark surface:
```typescript
isActive
  ? "border-l-[3px] border-sidebar-primary bg-sidebar-accent text-sidebar-primary font-semibold hover:bg-sidebar-accent hover:text-sidebar-primary rounded-none rounded-r-lg transition-all duration-200"
  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 hover:translate-x-0.5"
```

5. Update the icon active state:
```typescript
<item.icon className={`size-4 ${isActive ? "text-sidebar-primary" : ""}`} />
```

6. Update the footer styling:
```typescript
<SidebarFooter className="border-t border-sidebar-border p-3">
```

7. Update the Quick Actions kbd style to work on dark background:
```typescript
<kbd className="ml-auto rounded-md bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-medium text-sidebar-foreground/60 border border-sidebar-border">
```

Run: npx tsc --noEmit
Commit:
```
git add src/components/layout/app-sidebar.tsx && git commit -m "design: redesign sidebar with warm dark Claude aesthetic"
```
'

# ─────────────────────────────────────────────
# PHASE 21: Header + Mobile Nav Redesign
# ROLE: Senior UI Designer
# ─────────────────────────────────────────────
run_phase "Phase 21 — Header + Mobile Nav + Footer Redesign" '
You are a Senior UI Designer. The app now uses a warm Claude-inspired design system with terracotta accents (#C35A2C), cream backgrounds (#F5F0E8), and a dark warm sidebar (#2C2420). Update the header, mobile nav, and footer to match.

Read these files:
- src/components/layout/header.tsx
- src/components/layout/mobile-nav.tsx
- src/components/layout/footer.tsx

Changes to header.tsx:

1. Update logo area — replace the teal gradient with a warm terracotta/sienna gradient. The header height is now 56px:
```tsx
<div className="flex h-[56px] w-auto shrink-0 items-center gap-2.5 px-3 md:w-[270px] md:px-4">
```

2. Replace the logo box gradient:
```tsx
<div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8A87C] to-[#C35A2C] text-white text-xs font-bold shadow-sm group-hover:shadow-md transition-shadow">
```

3. Update brand text — make the accent letter use primary:
```tsx
<span className="text-primary">z</span>
```
(This already uses primary, but now primary = terracotta, so it will work.)

4. Update the search bar — warmer styling:
```tsx
className="hidden items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-3 py-1.5 text-sm text-muted-foreground transition-all hover:bg-secondary hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 lg:flex"
```

5. Update user avatar — replace teal/emerald gradient with warm gradient:
```tsx
<div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-[#E8A87C] to-[#C35A2C] text-white text-xs font-bold shadow-sm ring-2 ring-background">
```

6. Update dropdown menu rounded corners:
```tsx
<DropdownMenuContent align="end" className="w-48 rounded-2xl">
```

Changes to mobile-nav.tsx:

1. Update the nav bar — warm glass effect with cream tint:
```tsx
<nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border/40 bg-[#F5F0E8]/90 backdrop-blur-xl shadow-[0_-1px_3px_rgba(0,0,0,0.04)] md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
```

2. Active indicator — use terracotta:
The active state already uses "text-primary" which is now terracotta, so it should work. But update the active dot:
```tsx
<span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-[3px] w-4 rounded-full bg-primary" />
```
This already references primary, which is now terracotta. Good.

Changes to footer.tsx:
- Read the file and update any teal/emerald references to use the warm palette (primary, muted-foreground, etc.)

Run: npx tsc --noEmit
Commit:
```
git add src/components/layout/header.tsx src/components/layout/mobile-nav.tsx src/components/layout/footer.tsx && git commit -m "design: redesign header, mobile nav, and footer with Claude warm aesthetic"
```
'

# ─────────────────────────────────────────────
# PHASE 22: Page Header + Data Table + Shared Components
# ROLE: Senior UI Designer
# ─────────────────────────────────────────────
run_phase "Phase 22 — Page Header + Data Table + Shared" '
You are a Senior UI Designer. The app uses a Claude-inspired warm design system: cream background (#F5F0E8), terracotta primary (#C35A2C), warm borders (#DDD6CB). Redesign the page header and shared components.

Read these files:
- src/components/layout/page-header.tsx
- src/components/shared/data-table.tsx
- src/components/ui/empty-state.tsx
- src/components/ui/form-section.tsx

Changes to page-header.tsx:

1. Update the container — remove hard white bg, use a subtle warm surface:
```tsx
<div className="flex flex-col gap-2 border-b border-border/60 bg-card/50 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-5">
```

2. Increase title size slightly and add warmth:
```tsx
<h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
```
Note: changed from "font-bold" to "font-semibold" for a more refined feel.

3. Update breadcrumb link hover to use primary:
```tsx
<Link href="/dashboard" className="transition-colors hover:text-primary">
```
And for each breadcrumb link:
```tsx
className="transition-colors hover:text-primary"
```

Changes to data-table.tsx:
- Read the file. Update any hardcoded colors. Make sure table rows have warm hover states like "hover:bg-accent/50". If there are striped rows, use "even:bg-secondary/30". Ensure headers use "text-muted-foreground font-medium" (not bold). Add generous padding.

Changes to empty-state.tsx:
- Read the file. Update styling to use warm tones. Any "text-gray-" or "text-slate-" should become "text-muted-foreground". Any blue/teal call-to-action should use "text-primary".

Changes to form-section.tsx:
- Read the file. Update section headings to use "font-semibold" (not bold). Use warm borders. Add a left accent line using "border-l-2 border-primary/30 pl-4" on the section header if it makes sense.

Run: npx tsc --noEmit
Commit:
```
git add src/components/layout/page-header.tsx src/components/shared/data-table.tsx src/components/ui/empty-state.tsx src/components/ui/form-section.tsx && git commit -m "design: redesign page header, data table, and shared components with warm Claude aesthetic"
```
'

# ─────────────────────────────────────────────
# PHASE 23: Dashboard — Stat Cards + Status Board
# ROLE: Senior UI Designer + Data Visualization Lead
# ─────────────────────────────────────────────
run_phase "Phase 23 — Dashboard Cards Redesign" '
You are a Senior UI Designer and Data Visualization Lead. The app now has a warm Claude-inspired design system: cream (#F5F0E8), terracotta (#C35A2C), sienna (#B08968), sage (#6B8F71). Redesign the dashboard cards from playful colorful to warm, sophisticated, and organic.

Read these files:
- src/components/dashboard/stat-card.tsx
- src/components/dashboard/status-board.tsx
- src/components/dashboard/today-menu-widget.tsx

Changes to stat-card.tsx:

1. Replace the entire colorStyles map with warm, earthy tones that feel Claude-like:
```typescript
const colorStyles: Record<StatCardColor, { bg: string; icon: string; text: string }> = {
  teal:    { bg: "bg-card", icon: "text-[#C35A2C] bg-[#C35A2C]/10", text: "text-[#C35A2C]" },
  blue:    { bg: "bg-card", icon: "text-[#6B8F71] bg-[#6B8F71]/10", text: "text-[#6B8F71]" },
  purple:  { bg: "bg-card", icon: "text-[#8B7355] bg-[#8B7355]/10", text: "text-[#8B7355]" },
  rose:    { bg: "bg-card", icon: "text-[#B07070] bg-[#B07070]/10", text: "text-[#B07070]" },
  amber:   { bg: "bg-card", icon: "text-[#B08968] bg-[#B08968]/10", text: "text-[#B08968]" },
  orange:  { bg: "bg-card", icon: "text-[#B87333] bg-[#B87333]/10", text: "text-[#B87333]" },
  sky:     { bg: "bg-card", icon: "text-[#5B7B5E] bg-[#5B7B5E]/10", text: "text-[#5B7B5E]" },
  emerald: { bg: "bg-card", icon: "text-[#6B8F71] bg-[#6B8F71]/10", text: "text-[#6B8F71]" },
};
```

2. Update the card container — refined, minimal:
```tsx
<div className={`rounded-2xl border border-border/40 bg-card p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] ${href ? "cursor-pointer" : ""}`}>
```

3. Update the value text — use a more elegant weight:
```tsx
<p className={`text-3xl font-semibold tracking-tight ${styles.text}`}>{value}</p>
```

Changes to status-board.tsx:

1. Replace the pillarThemes with warm, muted, organic tones:
```typescript
const pillarThemes: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; iconBg: string; iconColor: string; cardBg: string; cardBorder: string; metricColor: string }
> = {
  Attendance: {
    icon: Users,
    iconBg: "bg-[#C35A2C]/10",
    iconColor: "text-[#C35A2C]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#C35A2C]",
  },
  Reports: {
    icon: FileText,
    iconBg: "bg-[#8B7355]/10",
    iconColor: "text-[#8B7355]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#8B7355]",
  },
  Staff: {
    icon: Briefcase,
    iconBg: "bg-[#6B8F71]/10",
    iconColor: "text-[#6B8F71]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#6B8F71]",
  },
  Finance: {
    icon: DollarSign,
    iconBg: "bg-[#B08968]/10",
    iconColor: "text-[#B08968]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#B08968]",
  },
  Health: {
    icon: Heart,
    iconBg: "bg-[#B07070]/10",
    iconColor: "text-[#B07070]",
    cardBg: "bg-card",
    cardBorder: "border-border/40",
    metricColor: "text-[#B07070]",
  },
};
```

2. Update the card styling — remove gradient backgrounds, use clean white cards with warm shadows:
```tsx
className={`relative flex min-w-[120px] flex-col items-center gap-2.5 rounded-2xl border px-4 py-5 transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${theme.cardBg} ${theme.cardBorder}`}
```

Changes to today-menu-widget.tsx:
- Read the file. Remove any teal/colorful gradients. Use warm card styling: white bg, warm borders, terracotta accents for meal type labels.

Run: npx tsc --noEmit
Commit:
```
git add src/components/dashboard/stat-card.tsx src/components/dashboard/status-board.tsx src/components/dashboard/today-menu-widget.tsx && git commit -m "design: redesign dashboard cards with warm earthy Claude palette"
```
'

# ─────────────────────────────────────────────
# PHASE 24: Dashboard — Charts + Action Center + Insights
# ROLE: Data Visualization Lead
# ─────────────────────────────────────────────
run_phase "Phase 24 — Dashboard Charts + Panels Redesign" '
You are a Data Visualization Lead. The app uses a warm Claude-inspired palette. Update the dashboard panels and charts to use warm, muted, earthy colors instead of vivid teal/violet/sky.

Read these files:
- src/components/dashboard/action-center.tsx
- src/components/dashboard/insights-panel.tsx
- src/components/dashboard/attendance-chart.tsx
- src/components/dashboard/weekly-attendance-chart.tsx
- src/components/dashboard/children-per-class-chart.tsx
- src/components/dashboard/gender-stats-chart.tsx

For ALL chart components:
- Replace any hardcoded chart colors with the warm palette:
  * Teal/cyan → #C35A2C (terracotta)
  * Purple/violet → #8B7355 (warm brown)
  * Blue/sky → #6B8F71 (sage green)
  * Rose/pink → #B07070 (dusty rose)
  * Amber/orange → #B08968 (sienna)
  * Green/emerald → #5B7B5E (moss)
- Use CSS variables where possible: "var(--chart-1)" through "var(--chart-5)"
- Update any "fill-teal-" or "stroke-teal-" classes to use the warm palette
- Card containers should use: "rounded-2xl border border-border/40 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.03)]"

For action-center.tsx:
- Replace any teal/violet/rose badge/icon colors with warm tones
- Urgent items: use #C35A2C (terracotta)
- Warning items: use #B08968 (sienna)
- Info items: use #6B8F71 (sage)
- Update card styling to match the warm minimal aesthetic

For insights-panel.tsx:
- Replace any bright colors with muted warm tones
- Use "font-semibold" instead of "font-bold" for headings
- Update backgrounds from colorful gradients to "bg-card" with warm border

Run: npx tsc --noEmit
Commit:
```
git add src/components/dashboard/ && git commit -m "design: redesign dashboard charts and panels with warm earthy Claude palette"
```
'

# ─────────────────────────────────────────────
# PHASE 25: Children + Employees List Pages
# ROLE: Senior UX Designer
# ─────────────────────────────────────────────
run_phase "Phase 25 — Children + Employees Lists Redesign" '
You are a Senior UX Designer. The app uses a warm Claude-inspired design system. Update the main list page components.

Read these files:
- src/components/children/children-page-client.tsx
- src/components/children/children-columns.tsx
- src/components/children/drafts-page-client.tsx
- src/components/employees/employee-listing-client.tsx
- src/components/employees/employee-columns.tsx

For children-page-client.tsx:
- Replace any teal/emerald/violet badge colors with warm Claude tones
- Active status badge: use "bg-[#6B8F71]/10 text-[#6B8F71]" (sage green = healthy/active)
- Draft badge: use "bg-[#B08968]/10 text-[#B08968]" (sienna = pending/draft)
- Inactive badge: use "bg-muted text-muted-foreground"
- Gender badge colors if present: use muted warm tones, not bright pink/blue
- Update any card hover states to use warm shadows
- Replace any "bg-teal-" or "bg-emerald-" with the warm palette equivalents

For children-columns.tsx:
- Update avatar placeholder colors (if any use teal/emerald gradients): use "bg-gradient-to-br from-[#E8A87C] to-[#C35A2C]"
- Update status badges to warm palette
- Ensure action button icons use "text-muted-foreground hover:text-primary"

For employee-listing-client.tsx and employee-columns.tsx:
- Same warm palette treatment
- Staff type indicators: use warm differentiators:
  * Teacher: #C35A2C (terracotta)
  * Nurse: #6B8F71 (sage)
  * Doctor: #8B7355 (warm brown)
  * Manager: #B08968 (sienna)

Run: npx tsc --noEmit
Commit:
```
git add src/components/children/ src/components/employees/ && git commit -m "design: redesign children and employee list pages with warm Claude palette"
```
'

# ─────────────────────────────────────────────
# PHASE 26: Form Pages + Dialogs
# ROLE: Senior UI Designer
# ─────────────────────────────────────────────
run_phase "Phase 26 — Forms + Dialogs Redesign" '
You are a Senior UI Designer. Update key form components and dialogs to use the warm Claude-inspired design system.

Read these files:
- src/components/children/child-form.tsx
- src/components/daily-reports/daily-report-form.tsx
- src/components/accounting/quick-payment-dialog.tsx
- src/components/children/child-sub-nav.tsx

For child-form.tsx:
- Replace any teal/emerald section headers or accents with warm tones
- Section dividers: use "border-border/40" not heavy borders
- Required field asterisks: use "text-primary" (terracotta)
- Form section icons: use "text-muted-foreground" not vivid colors
- Tab navigation: active tab should use "border-primary text-primary" not teal

For daily-report-form.tsx:
- Replace any colorful section headers (teal/violet) with warm muted headers
- Meal portion indicators: use warm scale (sand → sienna → terracotta)
- Health indicators: use #B07070 for warnings, #6B8F71 for healthy
- Submit button already uses "bg-primary" which is now terracotta

For quick-payment-dialog.tsx:
- Update any teal/green success indicators to use sage (#6B8F71)
- Update currency/amount display to use warm typography

For child-sub-nav.tsx:
- Replace any teal active states with warm primary
- Update hover states to use "hover:bg-accent" (warm cream)

Run: npx tsc --noEmit
Commit:
```
git add src/components/children/child-form.tsx src/components/daily-reports/daily-report-form.tsx src/components/accounting/quick-payment-dialog.tsx src/components/children/child-sub-nav.tsx && git commit -m "design: redesign forms and dialogs with warm Claude aesthetic"
```
'

# ─────────────────────────────────────────────
# PHASE 27: Alarms + Notifications + Medical
# ROLE: Senior UI Designer
# ─────────────────────────────────────────────
run_phase "Phase 27 — Alarms + Notifications + Medical Redesign" '
You are a Senior UI Designer. Update alarm, notification, and medical components to match the warm Claude aesthetic.

Read these files:
- src/components/alarms/alarm-action-card.tsx
- src/components/alarms/notification-center.tsx
- src/components/medical/medical-hub.tsx
- src/components/layout/notification-dropdown.tsx
- src/components/layout/inbox-tray.tsx

For alarm-action-card.tsx:
- Replace vivid colored badges (red/amber/teal) with warm muted versions:
  * Critical: #C35A2C bg with #C35A2C/10 background
  * Warning: #B08968 bg with #B08968/10 background
  * Info: #6B8F71 bg with #6B8F71/10 background
- Card styling: "rounded-2xl border border-border/40 bg-card" with warm shadow on hover

For notification-center.tsx:
- Update notification badges and icons to warm tones
- Replace any blue/teal action links with "text-primary" (terracotta)
- Unread indicator: use "bg-primary" (terracotta dot)

For medical-hub.tsx:
- Replace any teal/violet medical category colors with warm palette:
  * General: #8B7355
  * Conditions: #B07070
  * Visits: #6B8F71
  * Vaccinations: #B08968
  * Accidents: #C35A2C

For notification-dropdown.tsx and inbox-tray.tsx:
- Update badge counts to use "bg-primary text-primary-foreground" (terracotta)
- Replace any teal notification indicators
- Update dropdown/sheet styling: warm borders, rounded-2xl

Run: npx tsc --noEmit
Commit:
```
git add src/components/alarms/ src/components/medical/ src/components/layout/notification-dropdown.tsx src/components/layout/inbox-tray.tsx && git commit -m "design: redesign alarms, notifications, and medical components with Claude aesthetic"
```
'

# ─────────────────────────────────────────────
# PHASE 28: Skeletons + Remaining Components
# ROLE: Senior UI Designer
# ─────────────────────────────────────────────
run_phase "Phase 28 — Skeletons + Remaining Components" '
You are a Senior UI Designer. Final cleanup — update all skeleton loading states and remaining components.

Read these files:
- src/components/skeletons/card-grid-skeleton.tsx
- src/components/skeletons/detail-page-skeleton.tsx
- src/components/skeletons/form-page-skeleton.tsx
- src/components/skeletons/page-header-skeleton.tsx
- src/components/skeletons/table-page-skeleton.tsx
- src/components/food/food-listing-client.tsx
- src/components/classes/classes-client.tsx
- src/components/branches/branches-client.tsx
- src/components/assessments/assessment-form.tsx

For ALL skeleton files:
- Update skeleton colors to use warm tones: "bg-secondary" instead of any "bg-gray-" or "bg-slate-"
- Shimmer animation gradient should go from secondary to secondary/50 (warm cream tones)
- Card skeletons should use "rounded-2xl border border-border/40" to match real cards

For food-listing-client.tsx:
- Replace any teal category colors with warm palette
- Food category badges: use warm muted tones (terracotta for lunch, sienna for breakfast, sage for snack, clay for dessert)

For classes-client.tsx:
- Replace any colorful class cards with warm white cards
- Class capacity indicators: use warm progress bar colors

For branches-client.tsx:
- Replace any teal branch cards with warm card styling
- Branch status indicators: active = sage (#6B8F71), inactive = muted

For assessment-form.tsx:
- Replace any vivid assessment type colors with warm tones
- Progress indicators: use warm gradient (sand → sienna → terracotta)

Run: npx tsc --noEmit
Commit:
```
git add src/components/skeletons/ src/components/food/ src/components/classes/ src/components/branches/ src/components/assessments/ && git commit -m "design: redesign skeletons, food, classes, branches, and assessments with Claude aesthetic"
```
'

# ─────────────────────────────────────────────
# PHASE 29: Login Page + Global Search + Context Switcher
# ROLE: Creative Director
# ─────────────────────────────────────────────
run_phase "Phase 29 — Login + Search + Context Switcher" '
You are a Creative Director. The app now has a warm Claude-inspired design. Polish the login page, global search, and context switcher — these are high-visibility surfaces that define first impressions.

First, find the login page:
```
find src/app -path "*login*page.tsx" -o -path "*login*" -name "*.tsx"
```

Read these files:
- The login page (likely src/app/login/page.tsx or src/app/(auth)/login/page.tsx)
- src/components/layout/global-search.tsx
- src/components/layout/context-switcher.tsx
- src/components/layout/branch-year-selector.tsx

For the login page:
- Replace any teal/emerald gradients with warm terracotta/sienna tones
- Background: use the warm cream (#F5F0E8) with a subtle warm radial gradient overlay
- Login card: white with warm shadow, rounded-2xl
- Logo: use "bg-gradient-to-br from-[#E8A87C] to-[#C35A2C]"
- Submit button: already uses "bg-primary" which is terracotta
- Input focus rings: already use "ring-primary" which is terracotta
- Add subtle warmth: maybe a faint pattern or gradient in the page background

For global-search.tsx:
- Update command palette styling: warm border, cream background tints
- Search result highlights: use "bg-primary/10" for matches
- Replace any teal icons with "text-primary" or "text-muted-foreground"
- Keyboard shortcut badges: use "bg-secondary text-muted-foreground border border-border/50"

For context-switcher.tsx and branch-year-selector.tsx:
- Replace any teal active indicators with primary (terracotta)
- Dropdown styling: warm borders, rounded-2xl, "bg-popover"
- Selected branch indicator: "text-primary font-medium"

Run: npx tsc --noEmit
Commit:
```
git add src/app/ src/components/layout/global-search.tsx src/components/layout/context-switcher.tsx src/components/layout/branch-year-selector.tsx && git commit -m "design: redesign login page, search, and context switcher with Claude aesthetic"
```
'

# ─────────────────────────────────────────────
# PHASE 30: Final Visual QA + Build Check
# ROLE: Creative Director — Final Review
# ─────────────────────────────────────────────
run_phase "Phase 30 — Final Visual QA + Build" '
You are the Creative Director doing a final quality pass. The entire app should now feel warm, organic, and minimal — like Claudes UI. Verify consistency.

1. Run: npx tsc --noEmit
   Fix any TypeScript errors.

2. Do a search for any remaining old-theme references that were missed:
   - Search for "teal-" in all .tsx files under src/components/ and src/app/
   - Search for "emerald-" in all .tsx files
   - Search for "violet-" in all .tsx files
   - Search for "#14B8A6" (old primary) in all files
   - Search for "#0D9488" in all files
   - Search for "from-teal" in all files

3. For each file that still has old teal/emerald/violet references:
   - Replace teal-50/100 backgrounds → "[#C35A2C]/5" or "[#C35A2C]/10"
   - Replace teal-500/600 text → "primary" or "[#C35A2C]"
   - Replace emerald references → "[#6B8F71]" (sage)
   - Replace violet references → "[#8B7355]" (warm brown)
   - Replace sky/blue references → "[#6B8F71]" or "[#8B7355]"
   - Replace rose/pink references → "[#B07070]" (dusty rose)
   - Replace amber references → "[#B08968]" (sienna)

4. After fixing, run: npx tsc --noEmit

5. Try: pnpm exec next build
   If it fails, fix the errors.

6. Commit all remaining fixes:
```
git add -A && git commit -m "design: final QA pass — remove remaining old-theme color references"
```
'

echo "" | tee -a "$LOG_FILE"
echo "=============================================" | tee -a "$LOG_FILE"
echo "=== ALL PHASES COMPLETE — $(date) ===" | tee -a "$LOG_FILE"
echo "=============================================" | tee -a "$LOG_FILE"
