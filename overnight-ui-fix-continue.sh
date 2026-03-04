#!/bin/bash
# Continuation — Phases 1-2 done. Start from Phase 3.
# Smaller phases to avoid agent getting stuck.
unset CLAUDECODE
cd /Users/karimsaab/Desktop/garderie
LOG_FILE="./overnight-ui-fix-log.txt"
BRANCH="main"
OLD="$HOME/Desktop/Garderie-old-backup/Front/templates/admin"
OLD_CSS="$HOME/Desktop/Garderie-old-backup/Front"

echo "=== OVERNIGHT UI FIX CONTINUE — $(date) ===" >> "$LOG_FILE"

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
# PHASE 3: Header — dark bar
# ═══════════════════════════════════════════════

run_phase "Phase 3 — Header dark" '
Working in /Users/karimsaab/Desktop/garderie.

Read src/components/layout/header.tsx or find the header component (glob for src/components/layout/header*).
Also read src/app/globals.css (the .header-bar class).

The header must be a dark bar like old Metronic (#2b3643). Make these changes:
1. All text in the header: text-white or text-[#b4bcc8]
2. All icons: text-[#b4bcc8] hover:text-white
3. Remove any backdrop-blur or backdrop-filter from the component
4. Sidebar trigger button icon: light colored
5. Any breadcrumbs: light text
6. Search input if present: dark bg (#455263), light text, placeholder #959fad

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: dark header bar"
'

# ═══════════════════════════════════════════════
# PHASE 4a: Card + Dialog — flat style
# ═══════════════════════════════════════════════

run_phase "Phase 4a — Card and Dialog flat" '
Working in /Users/karimsaab/Desktop/garderie.

Read:
- src/components/ui/card.tsx
- src/components/ui/dialog.tsx

Old Metronic portlets had: no rounded corners, border 1px solid #e5e5e5, no shadow, white bg.

1. In card.tsx: replace any rounded-xl or rounded-2xl with rounded-sm. Remove shadow-* classes, use shadow-none or shadow-sm at most.
2. In dialog.tsx: replace rounded-2xl or rounded-xl with rounded-sm. Overlay should be bg-black/50.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: flat cards and dialogs"
'

# ═══════════════════════════════════════════════
# PHASE 4b: Table — striped, bordered, hover
# ═══════════════════════════════════════════════

run_phase "Phase 4b — Table striped" '
Working in /Users/karimsaab/Desktop/garderie.

Read src/components/ui/table.tsx

Old Metronic tables: striped rows, bordered cells, hover highlight, uppercase header.

Add to the shadcn Table component:
1. TableRow in body: add "even:bg-[#f9f9f9] hover:bg-[#f5f5f5]" to className
2. TableHead cells: add "bg-[#f4f4f4] text-[12px] font-semibold uppercase text-[#505f72]"
3. TableCell: ensure "border-b border-[#e5e5e5]" exists
4. Table wrapper: add "border border-[#e5e5e5]"

Keep all existing functionality, just add classes.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: striped bordered tables"
'

# ═══════════════════════════════════════════════
# PHASE 4c: Badge — solid colors
# ═══════════════════════════════════════════════

run_phase "Phase 4c — Solid badges" '
Working in /Users/karimsaab/Desktop/garderie.

Read src/components/ui/badge.tsx

Old Metronic badges were SOLID colored (not light tints):
- default: bg-[#1caf9a] text-white
- destructive: bg-[#d64635] text-white
- secondary: bg-[#e1e5ec] text-[#333]

Update the badge variants in badge.tsx to use solid backgrounds.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: solid colored badges"
'

# ═══════════════════════════════════════════════
# PHASE 5: Dashboard stat cards — solid colored
# ═══════════════════════════════════════════════

run_phase "Phase 5 — Stat cards solid colored" '
Working in /Users/karimsaab/Desktop/garderie.

Read:
- src/components/dashboard/stat-card.tsx
- '"$OLD"'/index.php (first 150 lines — look for .dashboard-stat classes)

Old stat cards had SOLID colored backgrounds with white text/icon. Not white cards with a thin top accent.

Rewrite stat-card.tsx to match:
1. Card background should be the accent color (solid), not white
2. Text (value + title) should be WHITE on the colored bg
3. Icon should be large, semi-transparent white, positioned right side
4. If there is an href, add a darker footer strip with "View More →" link
5. Number: text-2xl font-bold text-white
6. Title: text-xs text-white/80

Color map:
- "blue" → bg-[#327ad5]
- "sky" → bg-[#67809F]
- "emerald" → bg-[#1caf9a]
- "green" → bg-[#008200]
- "rose" → bg-[#d64635]
- "amber" → bg-[#c29d0b]
- "purple" → bg-[#8e44ad]

Keep the same props interface (title, value, icon, color, href).

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: solid colored stat cards like old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 6: Children listing
# ═══════════════════════════════════════════════

run_phase "Phase 6 — Children listing style" '
Working in /Users/karimsaab/Desktop/garderie.

Read '"$OLD"'/children.php (first 120 lines)
Read src/components/children/children-page-client.tsx
Read src/components/children/children-columns.tsx

Match old style:
1. Status badges solid: ACTIVE=bg-[#008200] text-white, INACTIVE=bg-[#d64635] text-white, DRAFT=bg-[#c29d0b] text-white
2. Action column: replace DropdownMenu with visible small icon buttons (Eye, Pencil, Trash2) using Button size="icon" variant="ghost" size="sm"
3. Page wrapped in a Card with card header showing title + "Add Child" button
4. Table should already look striped/bordered from Phase 4b changes

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: children listing matches old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 7: Daily + Absent reports
# ═══════════════════════════════════════════════

run_phase "Phase 7 — Reports style" '
Working in /Users/karimsaab/Desktop/garderie.

Read '"$OLD"'/dailyreports.php (first 100 lines)
Find and read the daily-reports client component (glob src/app/(app)/daily-reports/*client*)
Find and read the absent-reports client component (glob src/app/(app)/absent-reports/*client*)

Match old style for BOTH:
1. Status badges solid colored (SUBMITTED=#008200, MISSING=#d64635, DRAFT=#c29d0b, INCOMPLETE=#659be0)
2. Action column: visible icon buttons not dropdown
3. Page wrapped in Card with title in header

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: reports match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 8: Medical pages (all 5)
# ═══════════════════════════════════════════════

run_phase "Phase 8 — Medical pages style" '
Working in /Users/karimsaab/Desktop/garderie.

Glob for medical client components: src/app/(app)/medical/*/
Read the first client component you find to understand the pattern.

Apply to ALL 5 medical pages (general, suffering, visits, vaccinations, accidents):
1. Solid status badges
2. Action column: visible icon buttons not dropdown
3. Card wrapper
4. Fix accidents: if it calls deleteMedicalForm, find the correct accident delete action in src/lib/actions/

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: medical pages match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 9: Employee listings
# ═══════════════════════════════════════════════

run_phase "Phase 9 — Employee style" '
Working in /Users/karimsaab/Desktop/garderie.

Read src/components/employees/employee-columns.tsx
Read src/components/employees/employee-listing-client.tsx

Match old style:
1. Solid status badges
2. Action column: visible icon buttons. Wire up delete with confirmation dialog + toast.
3. Card wrapper with title in header

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: employee listings match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 10: Classes, Food, Accounting
# ═══════════════════════════════════════════════

run_phase "Phase 10 — Classes, Food, Accounting style" '
Working in /Users/karimsaab/Desktop/garderie.

Find and read: classes client component, food listing client, accounting client
Glob: src/components/classes/*client* src/app/(app)/food/*client* src/app/(app)/accounting/*client*

Apply old Metronic style:
1. All in Card wrappers
2. Tables striped/bordered (already from table.tsx changes)
3. Solid badges
4. Visible action buttons

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: classes, food, accounting match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 11: Settings pages
# ═══════════════════════════════════════════════

run_phase "Phase 11 — Settings pages style" '
Working in /Users/karimsaab/Desktop/garderie.

Find and read: zones client, parent-users client, nursery client, alarms client
Glob: src/app/(app)/settings/*/

Fix:
1. Zones: add delete confirmation AlertDialog + toast (currently no confirmation). Card wrapper.
2. Parent users: replace prompt()/alert() with Dialog + toast. Card wrapper.
3. Nursery: flat card sections, no rounded corners
4. All: solid badges, visible actions

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: settings pages match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 12: Messages, Attendance, Calendars
# ═══════════════════════════════════════════════

run_phase "Phase 12 — Messages, Attendance" '
Working in /Users/karimsaab/Desktop/garderie.

Find and read: messages inbox client, attendance heatmap client
Glob: src/app/(app)/messages/*client* src/app/(app)/attendance/*client*

1. Messages: Card wrapper, solid badges, visible actions
2. Attendance heatmap: Card wrapper, flat style

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: messages and attendance match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 13: Child + Class dashboards
# ═══════════════════════════════════════════════

run_phase "Phase 13 — Dashboards style" '
Working in /Users/karimsaab/Desktop/garderie.

Read:
- src/app/(app)/children/[id]/dashboard/dashboard-client.tsx
- src/app/(app)/classes/[id]/page.tsx
- src/components/dashboard/stat-card.tsx

1. Child dashboard: replace ALL manual Card+CardContent stat blocks with the shared StatCard component. The StatCard was updated in Phase 5 to be solid colored, so just use it.
2. Class dashboard: verify it uses StatCard already (it should from earlier work)
3. Charts in child dashboard: flat card wrapper

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: child and class dashboards match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 14: Global sweep
# ═══════════════════════════════════════════════

run_phase "Phase 14 — Global sweep" '
Working in /Users/karimsaab/Desktop/garderie.

Final sweep:
1. Grep for rounded-xl and rounded-2xl in src/ — change to rounded-sm (except rounded-full for avatars/dots)
2. Grep for backdrop-blur in src/components/ — remove (except mobile nav)
3. Grep for bg-\[#0B7464\] or bg-\[#0B9178\] — replace with bg-primary
4. Grep for shadow-lg or shadow-xl on Card components — reduce to shadow-sm or remove

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: final Metronic consistency sweep"
'

# ═══════════════════════════════════════════════
# PHASE 15: Type check
# ═══════════════════════════════════════════════

run_phase "Phase 15 — Type check" '
Working in /Users/karimsaab/Desktop/garderie.
Run: npx tsc --noEmit
Fix any errors. Run again.
Commit: git add -A && git commit -m "fix: resolve type errors"
'

echo "" >> "$LOG_FILE"
echo "=== ALL PHASES COMPLETE — $(date) ===" >> "$LOG_FILE"
