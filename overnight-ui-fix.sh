#!/bin/bash
# Overnight UI Fix — Polish all pages from the structure script
# Clean up: design tokens, shared components, delete confirmations, toasts
# NO set -e — we want to continue on failure
unset CLAUDECODE
cd /Users/karimsaab/Desktop/garderie
LOG_FILE="./overnight-ui-fix-log.txt"
BRANCH="main"

echo "=== OVERNIGHT UI FIX START — $(date) ===" > "$LOG_FILE"

run_phase() {
  local name="$1"
  local prompt="$2"
  echo "" >> "$LOG_FILE"
  echo "=============================================" >> "$LOG_FILE"
  echo "=== $name — $(date) ===" >> "$LOG_FILE"
  echo "=============================================" >> "$LOG_FILE"
  claude --dangerously-skip-permissions -p "$prompt" >> "$LOG_FILE" 2>&1
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    echo "WARNING: $name FAILED (exit $exit_code) — continuing..." >> "$LOG_FILE"
  fi
  git push origin $BRANCH >> "$LOG_FILE" 2>&1
  echo "=== $name COMPLETE — $(date) ===" >> "$LOG_FILE"
}

# ═══════════════════════════════════════════════
# PHASE 1: Child Dashboard — use StatCard + DataTable
# ═══════════════════════════════════════════════

run_phase "Phase 1 — Child Dashboard rewrite" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie (Next.js 15, shadcn/ui, Tailwind v4).

Read these files:
- src/app/(app)/children/[id]/dashboard/dashboard-client.tsx
- src/components/dashboard/stat-card.tsx (the shared StatCard component)
- src/app/(app)/classes/[id]/page.tsx (example of correct StatCard usage)

The child dashboard has ~11 manually-built stat cards using raw Card+CardContent+inline colors. Replace ALL of them with the shared StatCard component. Look at how classes/[id]/page.tsx does it — each card is just:
```tsx
<StatCard title="..." value={...} icon={IconName} color="emerald" href="..." />
```

Also:
1. Replace the hand-rolled PaginatedTable (raw <table> element with manual pagination) with the shared DataTable component from @/components/shared/data-table
2. Replace hardcoded hex chart colors like `["#22c55e", "#ef4444"]` with the design system constants from src/components/dashboard/demographics-section.tsx
3. Replace `bg-emerald-50 text-emerald-600` and similar raw Tailwind on status badges with `var(--color-success-light)` / `var(--color-success-dark)` pattern used in children-columns.tsx
4. Replace `text-blue-600`, `text-green-600` on contact links with `text-primary` and `text-emerald-600`

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): child dashboard — use StatCard and DataTable components"
```
'

# ═══════════════════════════════════════════════
# PHASE 2: Medical pages — fix delete action + consistency
# ═══════════════════════════════════════════════

run_phase "Phase 2 — Medical pages fixes" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read these files:
- src/app/(app)/medical/accidents/accident-reports-client.tsx
- src/app/(app)/medical/general/medical-general-client.tsx
- src/components/children/children-columns.tsx (for getAvatarColor, getInitials)

Fix these issues:

1. CRITICAL: In accident-reports-client.tsx, the delete handler calls `deleteMedicalForm(id)` which is the WRONG action. Find or create a proper `deleteAccidentReport` action. Check src/lib/actions/ for existing accident actions. If `deleteAccidentReport` exists, import and use it. If not, create it in the appropriate actions file following the same pattern as deleteMedicalForm.

2. In accident-reports-client.tsx, replace the manual useState delete handling with useTransition pattern matching medical-general-client.tsx.

3. In BOTH medical files, replace the locally-reimplemented avatar color arrays with imports from children-columns:
```tsx
import { getAvatarColor, getInitials } from "@/components/children/children-columns"
```
Remove the local duplicate arrays.

4. In BOTH files, replace `className="bg-destructive text-white hover:bg-destructive/90"` on AlertDialogAction with just `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`.

5. Fix the Button with `size="icon-sm"` — check if that variant exists in src/components/ui/button.tsx. If not, change to `size="sm"` with appropriate icon sizing.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): medical pages — correct delete action, shared avatar utils"
```
'

# ═══════════════════════════════════════════════
# PHASE 3: Zones/Address — add delete confirmation + toasts
# ═══════════════════════════════════════════════

run_phase "Phase 3 — Zones/Address pages" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read these files:
- src/app/(app)/settings/zones/zones-client.tsx
- src/app/(app)/settings/areas/areas-client.tsx (if exists, likely has same issues)
- src/app/(app)/settings/regions/regions-client.tsx (if exists, likely has same issues)
- src/app/(app)/food/food-listing-client.tsx (reference for correct delete+toast pattern)

Fix ALL three address pages (zones, areas, regions) with these changes:

1. Add `import { toast } from "sonner"` — currently missing entirely.

2. Add an AlertDialog for delete confirmation. Copy the pattern from food-listing-client.tsx:
   - State: `const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null)`
   - Trash button opens the dialog instead of directly deleting
   - AlertDialog with "Are you sure?" confirmation
   - On confirm, call the delete action and show toast

3. Add toast.success() on successful create/update and toast.error() on failure in handleSave.

4. Replace bare `<label>` elements with shadcn `<Label>` component (import from @/components/ui/label).

5. Replace `export default function` with `export function` (named export) to match codebase convention.

6. Remove eslint-disable-next-line comments on useMemo — fix the actual dependency arrays instead.

7. Replace manual Button color overrides (`className="bg-primary text-white"`) with just `<Button>` (default variant already handles this).

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): address pages — add delete confirmation, toasts, design tokens"
```
'

# ═══════════════════════════════════════════════
# PHASE 4: Parent Users — replace prompt/alert with Dialog
# ═══════════════════════════════════════════════

run_phase "Phase 4 — Parent Users dialog fix" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read:
- src/app/(app)/settings/parent-users/parent-users-client.tsx
- src/components/ui/dialog.tsx (for Dialog imports)
- src/components/ui/input.tsx

CRITICAL FIX: The password reset uses `prompt()` and `alert()` — native browser dialogs that look terrible and are a security issue (password visible in plain text).

Replace with a proper shadcn Dialog:
1. Add a resetPasswordDialog state: `useState<{userId: string, childName: string} | null>(null)`
2. Add a password input state with `useState("")`
3. Create a Dialog that shows:
   - Title: "Reset Password for {childName}"
   - A password Input (type="password")
   - Cancel + Confirm buttons
4. On confirm, call the resetPassword server action and show toast.success() or toast.error()
5. Replace `alert()` calls with `toast.success()` / `toast.error()` from sonner

Also fix:
6. Add toast import if missing: `import { toast } from "sonner"`
7. Add toast.success() on successful user creation (handleCreate)
8. Replace the destructive-semantic badge on section "2" header — use `bg-amber-500` instead of `bg-destructive` since its just a section number, not a danger indicator
9. Remove eslint-disable-next-line comments — fix actual deps

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): parent users — replace prompt/alert with proper Dialog"
```
'

# ═══════════════════════════════════════════════
# PHASE 5: Messages + Daily Reports — SortableHeader + tokens
# ═══════════════════════════════════════════════

run_phase "Phase 5 — Messages and Daily Reports polish" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read:
- src/app/(app)/messages/inbox/inbox-client.tsx
- src/app/(app)/daily-reports/daily-reports-client.tsx
- src/components/shared/data-table/sortable-header.tsx (the shared SortableHeader)

Fix messages inbox:
1. Replace manual sort headers (Button ghost + ArrowUpDown) with SortableHeader component — import from @/components/shared/data-table
2. Replace `className="text-red-600"` on delete DropdownMenuItem with `variant="destructive"`
3. Replace `className="bg-red-600 hover:bg-red-700"` on AlertDialogAction with `className="bg-destructive text-destructive-foreground hover:bg-destructive/90"`
4. Replace hardcoded nature badge colors (bg-gray-100, bg-red-100, etc.) with design tokens: use the same var(--color-*) pattern as status badges in children-columns.tsx

Fix daily reports:
5. Replace column header abbreviations "F Name" / "L Name" with "First Name" / "Last Name" — same for all other pages that use these abbreviations (absent-reports, medical pages, employee columns)
6. Add SortableHeader to column definitions where missing
7. Wrap toolbar in a plain div instead of Card — match the children page toolbar pattern

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): messages + daily reports — SortableHeader, design tokens"
```
'

# ═══════════════════════════════════════════════
# PHASE 6: Employee columns — fix delete stub + avatar colors
# ═══════════════════════════════════════════════

run_phase "Phase 6 — Employee columns fix" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read:
- src/components/employees/employee-columns.tsx
- src/components/employees/employee-listing-client.tsx
- src/components/children/children-columns.tsx (reference for avatar pattern)

Fix:
1. The delete DropdownMenuItem is a no-op stub with no onClick handler. Wire it up:
   - Add a deleteEmployee prop/callback to the columns definition (same pattern as children-columns)
   - In employee-listing-client, pass the delete handler that calls the appropriate server action with confirmation dialog

2. Replace the local avatar color arrays (bg-amber-100, bg-emerald-100, etc.) with imports from children-columns: `import { getAvatarColor, getInitials }`

3. Replace "F Name" / "L Name" column headers with "First Name" / "Last Name"

4. Add SortableHeader to the Branch column (currently missing it while other columns have it)

5. Make the branch column consistent — use plain text like children-columns instead of Badge variant="secondary"

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): employee columns — wire delete, shared avatar utils, consistent headers"
```
'

# ═══════════════════════════════════════════════
# PHASE 7: Food pages — unify category colors
# ═══════════════════════════════════════════════

run_phase "Phase 7 — Food color unification" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read:
- src/app/(app)/food/food-listing-client.tsx
- src/app/(app)/food/calendar/food-calendar-client.tsx

The food listing uses brownish hex colors (bg-[#A0784C]/15, bg-[#C17C5A]/15) for categories while the calendar uses Tailwind semantic colors (bg-amber-100, bg-emerald-100). They should match.

1. Create a shared constant in a new file src/lib/food-colors.ts:
```tsx
export const FOOD_CATEGORY_COLORS = {
  BREAKFAST: { bg: "bg-amber-100", text: "text-amber-800", dot: "bg-amber-500" },
  LUNCH: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  DESSERT: { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-500" },
  SNACK: { bg: "bg-sky-100", text: "text-sky-800", dot: "bg-sky-500" },
} as const
```

2. Import and use this in BOTH food-listing-client.tsx and food-calendar-client.tsx, replacing their local color definitions.

3. Fix the empty useMemo dependency array in food-listing-client.tsx — add the missing deps or wrap the callbacks with useCallback.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): food pages — unified category colors"
```
'

# ═══════════════════════════════════════════════
# PHASE 8: Alarms + New Year + Invoice — tokens + stubs
# ═══════════════════════════════════════════════

run_phase "Phase 8 — Alarms, New Year, Invoice polish" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read:
- src/app/(app)/alarms/alarms-overview-client.tsx
- src/app/(app)/settings/new-year/page.tsx
- src/app/(app)/accounting/invoice/[id]/invoice-client.tsx
- src/components/ui/empty-state.tsx (if exists, for the EmptyState component)

Fix alarms-overview-client.tsx:
1. Replace raw <button> elements for filter chips with shadcn <Button variant="outline" size="sm"> or <Button variant="ghost" size="sm">. Use the active state class on the selected filter.
2. Replace hardcoded urgency colors (text-red-600, text-amber-600) with text-destructive, text-amber-600 (amber has no semantic token so keep it)
3. Replace hardcoded Badge className="bg-red-100 text-red-700" with variant="destructive"

Fix new-year page:
4. Replace the visible placeholder text ("Teacher reassignment table will be implemented here") with a proper EmptyState or a Card with a "Coming soon" Badge and muted description. Should look intentional, not broken.

Fix invoice page:
5. Replace `text-white` with `text-primary-foreground` on the print button
6. Replace hardcoded status colors (text-green-700, text-red-600, text-yellow-600) with design tokens: text-emerald-700 for paid, text-destructive for overdue, text-amber-600 for pending

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): alarms, new-year, invoice — design tokens and proper components"
```
'

# ═══════════════════════════════════════════════
# PHASE 9: Nursery Settings — ToggleGroup + token cleanup
# ═══════════════════════════════════════════════

run_phase "Phase 9 — Nursery Settings polish" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read:
- src/app/(app)/settings/nursery/nursery-client.tsx
- src/components/ui/toggle-group.tsx (if exists)

Fix:
1. Replace the hand-rolled owner type toggle buttons with shadcn ToggleGroup (if available) or at minimum use <Button variant="outline"> with proper active state (variant="default" when selected). The current raw <button> with border-violet-300 is not design-system aligned.

2. Same for the working days toggle — replace hand-rolled pill buttons with proper Button components.

3. Replace the one hex color icon container (`bg-[#4F46E5]/10 text-[#4F46E5]`) on the Defaults section with `bg-indigo-50 text-indigo-600` to match the pattern of all other sections.

4. Replace `text-white` on the save button with `text-primary-foreground`.

5. The icon container per-section rainbow (blue, emerald, violet, cyan, orange, amber, indigo, rose) is actually fine as a design choice — keep it but make sure they all use the same Tailwind-50/600 pattern consistently.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): nursery settings — proper toggles, consistent tokens"
```
'

# ═══════════════════════════════════════════════
# PHASE 10: Sidebar — fix calls nav active state
# ═══════════════════════════════════════════════

run_phase "Phase 10 — Sidebar nav fixes" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Read:
- src/components/layout/app-sidebar.tsx

Fix:
1. The "Calls Management" nav item has href="/children?tab=calls". The active state detection uses pathname matching which ignores query params — so this item NEVER shows as active. Fix by either:
   a. Creating a dedicated /calls route that redirects to /children?tab=calls, OR
   b. Updating the isLeafActive function to also check searchParams for items with query params in their href

2. Replace the magic number 56px (top-[56px], h-[calc(100svh-56px)]) — check if there is a CSS variable for navbar height. If not, define one in globals.css and use it.

3. Replace border-l-[3px] with border-l-2 (standard Tailwind) and adjust pl-[9px] to pl-2.5 (standard Tailwind) on the active item styling.

4. The depth prop is passed recursively but never used — remove it from NavItemRenderer to clean up the component.

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): sidebar — fix calls active state, remove magic numbers"
```
'

# ═══════════════════════════════════════════════
# PHASE 11: Global text-white → text-primary-foreground sweep
# ═══════════════════════════════════════════════

run_phase "Phase 11 — Global token sweep" '
You are a Senior Frontend Engineer working in /Users/karimsaab/Desktop/garderie.

Search the entire src/ directory for these anti-patterns and fix them:

1. Search for `text-white` on Button or AlertDialogAction components. Replace with `text-primary-foreground` (for primary buttons) or `text-destructive-foreground` (for destructive buttons). Do NOT change text-white in print stylesheets, avatar initials, or actual white-on-dark backgrounds.

2. Search for `className="bg-red-600` or `bg-red-700` on AlertDialogAction. Replace with `bg-destructive hover:bg-destructive/90`.

3. Search for duplicate `getAvatarColor` / `getInitials` implementations. The canonical versions are in src/components/children/children-columns.tsx. Any other file that reimplements these arrays should import from there instead.

4. Search for `"F Name"` and `"L Name"` column headers across all files. Replace with "First Name" and "Last Name".

Be careful:
- Only change files in src/components/ and src/app/
- Do NOT modify src/components/ui/ (shadcn primitives)
- Read each file before editing to understand context
- Some text-white usages are correct (e.g., white text on colored avatar backgrounds)

Run: npx tsc --noEmit
Commit:
```
git add -A && git commit -m "fix(ui): global sweep — design tokens, shared utils, consistent headers"
```
'

# ═══════════════════════════════════════════════
# PHASE 12: Final type check + verify
# ═══════════════════════════════════════════════

run_phase "Phase 12 — Final verification" '
You are a QA Engineer working in /Users/karimsaab/Desktop/garderie.

Run: npx tsc --noEmit

If there are ANY type errors:
1. Read each file with errors
2. Fix the type errors
3. Run tsc again to verify

If zero errors, commit any remaining changes:
```
git add -A && git commit -m "fix: resolve type errors from UI polish"
```

If nothing to commit, thats fine — the job is done.
'

echo "" >> "$LOG_FILE"
echo "=== ALL PHASES COMPLETE — $(date) ===" >> "$LOG_FILE"
