#!/bin/bash
# Overnight UI Fix — Copy old Metronic PHP app's EXACT visual style page by page
# For each page: read old PHP template → read new Next.js page → make it look identical
# NO set -e — we want to continue on failure
unset CLAUDECODE
cd /Users/karimsaab/Desktop/garderie
LOG_FILE="./overnight-ui-fix-log.txt"
BRANCH="main"
OLD="$HOME/Desktop/Garderie-old-backup/Front/templates/admin"
OLD_CSS="$HOME/Desktop/Garderie-old-backup/Front"

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
# PHASE 1: globals.css + fonts — Metronic foundation
# ═══════════════════════════════════════════════

run_phase "Phase 1 — Metronic color system + Open Sans" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

The old PHP app used Metronic v3 dark-blue theme. We must match it EXACTLY.

Read these old CSS files to understand the exact colors:
- '"$OLD_CSS"'/assets/global/css/components.css (first 200 lines)
- '"$OLD_CSS"'/assets/admin/css/custom.css

Read the current new CSS:
- src/app/globals.css

And the font loading:
- src/app/layout.tsx

TASK 1: Update ALL CSS variables in globals.css :root to match old Metronic:
  --background: #F5F5F5
  --foreground: #333333
  --primary: #1caf9a (old teal accent)
  --primary-foreground: #FFFFFF
  --secondary: #f4f4f4
  --secondary-foreground: #333333
  --muted: #f4f4f4
  --muted-foreground: #505f72
  --accent: #e8f8f5
  --accent-foreground: #1caf9a
  --destructive: #d64635
  --border: #e5e5e5
  --input: #e5e5e5
  --ring: #1caf9a
  --sidebar: #364150
  --sidebar-foreground: #b4bcc8
  --sidebar-primary: #1caf9a
  --sidebar-primary-foreground: #FFFFFF
  --sidebar-accent: #2c3542
  --sidebar-accent-foreground: #FFFFFF
  --sidebar-border: #3f4b5a
  --radius: 0.1875rem (old app had ~3px rounding, almost flat)
  --chart-1: #1caf9a
  --chart-2: #327ad5
  --color-success: #008200
  --color-warning: #c29d0b
  --color-error: #d64635
  --color-info: #327ad5

  Header bar class: bg #2b3643, no blur, border-bottom #455263
  Shadows: flatten to near-zero

TASK 2: In layout.tsx, replace Nunito/Cairo font loading with Open Sans:
  import { Open_Sans } from "next/font/google"
  const openSans = Open_Sans({ subsets: ["latin", "latin-ext"], weight: ["300","400","500","600","700","800"], variable: "--font-body", display: "swap" })
  Remove separate heading font. Set both --font-heading and --font-body to Open Sans.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: Metronic color system + Open Sans font"
'

# ═══════════════════════════════════════════════
# PHASE 2: Sidebar — exact copy of old leftmenu
# ═══════════════════════════════════════════════

run_phase "Phase 2 — Sidebar exact copy" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read the OLD sidebar:
- '"$OLD"'/leftmenu.php

Read the NEW sidebar:
- src/components/layout/app-sidebar.tsx

Make the new sidebar look EXACTLY like the old one:

Old sidebar visual:
- Background: #364150 (solid, no gradient, no blur)
- Menu text: #b4bcc8, icons: #606c7d
- Each top-level item has border-top: 1px solid #3f4b5a
- Hover: bg #2c3542
- ACTIVE item: bg #1caf9a, text white, icon white
- Active SUB-item: bg #3e4b5c with left border 4px solid #1caf9a, text white
- Sub-menu bg: same #364150, items indented
- NO rounded corners on any menu items
- Header/brand area: bg #2b3643 (darker than sidebar body)

Changes to make:
1. Remove ALL rounded-lg, rounded-md on sidebar menu items → rounded-none
2. Active top-level: className="bg-[#1caf9a] text-white" with icon white
3. Active sub-item: className="bg-[#3e4b5c] text-white border-l-4 border-l-[#1caf9a]"
4. Hover: className="hover:bg-[#2c3542]"
5. Add border-top to each top-level section separator
6. Sidebar brand/header: bg-[#2b3643]
7. Remove any blur/glass effects
8. Footer area (user dropdown, quick actions): bg-[#2b3643] or match sidebar

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: sidebar exact visual copy of old Metronic leftmenu"
'

# ═══════════════════════════════════════════════
# PHASE 3: Header — dark bar like old app
# ═══════════════════════════════════════════════

run_phase "Phase 3 — Header dark bar" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old layout header area:
- '"$OLD"'/layout.php (first 100 lines, look for the header/navbar section)

Read new header:
- src/components/layout/header.tsx (find the actual header component)
- src/app/(app)/layout.tsx

Old header: dark bg #2b3643, height 46px, text/icons light #b4bcc8, no shadow, flat.

Make the new header match:
1. Background: bg-[#2b3643] (solid dark, NOT frosted glass)
2. All text: text-[#b4bcc8] or text-white
3. All icons: text-[#b4bcc8]
4. Remove backdrop-filter, backdrop-blur from both CSS class and component
5. Any buttons in header (sidebar toggle, notifications, search): light colored icons on dark bg
6. Breadcrumb text: light (#b4bcc8)
7. Remove the bottom border glow — just a simple border-[#455263]

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: dark header bar matching old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 4: UI primitives — Card, Table, Button, Badge, Dialog
# ═══════════════════════════════════════════════

run_phase "Phase 4 — UI primitives match old style" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old CSS:
- '"$OLD_CSS"'/assets/global/css/components.css (search for .portlet, .table, .btn, .badge, .modal)
- '"$OLD_CSS"'/assets/admin/css/custom.css

Read new components:
- src/components/ui/card.tsx
- src/components/ui/table.tsx
- src/components/ui/button.tsx
- src/components/ui/badge.tsx
- src/components/ui/dialog.tsx

Match each to old Metronic:

CARD (was .portlet.light.bordered):
- Border: 1px solid #e5e5e5
- No rounded corners (rounded-sm at most, --radius is now 3px)
- No shadow (or barely perceptible)
- White bg
- Remove any rounded-xl, rounded-2xl hardcoded in card.tsx

TABLE (was .table.table-striped.table-bordered.table-hover):
- Striped: alternate rows bg #f9f9f9
- Bordered: all cells have border #e5e5e5
- Hover: row bg #f5f5f5
- Header: bg #f4f4f4, text uppercase 12px semibold
- Add these classes to TableRow, TableHead, TableCell in table.tsx

BUTTON (was .btn):
- Default: bg #e1e5ec text #333 hover #c2cad8
- Primary: already uses --primary (#1caf9a) — verify
- Danger: already uses --destructive (#d64635) — verify
- Minimal rounding (radius already 3px from Phase 1)

BADGE (was .badge):
- Default: bg #1caf9a text white (solid teal, not outline)
- Destructive: bg #d64635 text white
- Secondary: bg #e1e5ec text #333
- All solid backgrounds, no light tints

DIALOG (was .modal):
- No rounded corners (rounded-sm at most)
- Overlay: bg black/50
- Header: border-bottom #e5e5e5

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: card, table, button, badge, dialog match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 5: Dashboard page — match old index.php exactly
# ═══════════════════════════════════════════════

run_phase "Phase 5 — Dashboard visual copy" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old dashboard:
- '"$OLD"'/index.php
- '"$OLD"'/js/index.js (first 150 lines)

Read new dashboard:
- src/app/(app)/dashboard/page.tsx
- src/components/dashboard/stat-card.tsx
- src/components/dashboard/demographics-section.tsx

The old dashboard had:
- Colored stat cards with SOLID colored backgrounds (not white cards with colored accents)
  - .dashboard-stat.blue — solid blue bg
  - .dashboard-stat.green — solid green bg
  - .dashboard-stat.red — solid red bg
  - .dashboard-stat.blue-hoki — lighter blue bg
- Large icon on the left, number + description on the right
- "More..." footer link on each card
- Charts below: AmCharts pie/donut charts

Make stat-card.tsx match the old visual:
1. The card should have a SOLID colored background (not white with a thin colored top bar)
2. The number should be large (text-2xl or text-3xl), bold, WHITE text on colored bg
3. The description should be lighter white text below the number
4. The icon should be on the right side, large (size-12), semi-transparent white
5. The "href" should render as a darker footer bar "View More →"

Color map for stat-card.tsx:
- "blue" → bg-[#327ad5] (old blue)
- "sky" → bg-[#67809F] (old blue-hoki)
- "emerald" → bg-[#1caf9a] (old green/teal)
- "green" → bg-[#008200] (dark green)
- "rose" → bg-[#d64635] (old red)
- "amber" → bg-[#c29d0b] (old gold)
- "purple" → bg-[#8e44ad]

For the charts (demographics-section.tsx):
- Use the same Metronic color palette for chart segments
- Card wrapper should be flat (no rounded corners, border #e5e5e5)

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: dashboard matches old Metronic index.php exactly"
'

# ═══════════════════════════════════════════════
# PHASE 6: Children listing — match children.php
# ═══════════════════════════════════════════════

run_phase "Phase 6 — Children page visual copy" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old page:
- '"$OLD"'/children.php

Read new page:
- src/components/children/children-page-client.tsx
- src/components/children/children-columns.tsx

Look at the old page layout: it has a portlet (card) wrapping a DataTable with filters above. The table has striped rows, bordered cells, and action buttons.

Make the new page match visually:
1. The page should be wrapped in a single Card (portlet) with a card header showing the title + add button
2. Filters should be inside the card header or a toolbar row within the card
3. Table should fill the card body
4. Status badges should be solid colored (not light-tinted):
   - ACTIVE: bg-[#008200] text-white
   - INACTIVE: bg-[#d64635] text-white
   - DRAFT: bg-[#c29d0b] text-white
5. Gender badges: solid colored
6. Action column: small icon buttons (view/edit/delete) in a row, not a dropdown
   The old app had visible icon buttons, not hidden in a dropdown menu.
   Use Button size="icon" variant="ghost" with small icons.

7. Remove any card-grid/tile view toggle — the old app was TABLE ONLY. If theres a grid view, keep it but make table the default.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: children listing matches old children.php"
'

# ═══════════════════════════════════════════════
# PHASE 7: Daily reports + Absent reports — match old
# ═══════════════════════════════════════════════

run_phase "Phase 7 — Reports pages visual copy" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old pages:
- '"$OLD"'/dailyreports.php
- '"$OLD"'/absentreports.php

Read new pages:
- src/app/(app)/daily-reports/ (find the client component)
- src/app/(app)/absent-reports/ (find the client component)

Match old visual style for BOTH pages:
1. Page wrapped in Card (portlet) with title in card header
2. Filters: toolbar row inside card (Status dropdown, Branch dropdown, Date range)
3. Table: striped, bordered, hover — using the table.tsx styles from Phase 4
4. Status badges SOLID:
   - SUBMITTED: bg-[#008200] text-white
   - MISSING: bg-[#d64635] text-white
   - DRAFT: bg-[#c29d0b] text-white
   - INCOMPLETE: bg-[#659be0] text-white
5. Action buttons: visible icon buttons not dropdown
6. Avatar: small circle on the left of first column

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: daily/absent reports match old PHP pages"
'

# ═══════════════════════════════════════════════
# PHASE 8: Medical pages — all 5 types
# ═══════════════════════════════════════════════

run_phase "Phase 8 — Medical pages visual copy" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old pages:
- '"$OLD"'/Medical_forms1.php (first 150 lines — general info)
- '"$OLD"'/Medical_forms5.php (first 150 lines — accidents)

Read new pages:
- src/app/(app)/medical/general/ (find client component)
- src/app/(app)/medical/suffering/ (find client component)
- src/app/(app)/medical/visits/ (find client component)
- src/app/(app)/medical/vaccinations/ (find client component)
- src/app/(app)/medical/accidents/ (find client component)

All 5 medical listing pages should match the old style:
1. Card wrapper with title in header
2. Striped bordered table
3. Solid status badges
4. Action buttons visible (not dropdown) — view, edit, delete as small icon buttons
5. Avatar in first column

Also fix the bug in accidents: it calls deleteMedicalForm() instead of the correct delete action. Check src/lib/actions/ for an accident-specific delete.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: all 5 medical pages match old Metronic PHP"
'

# ═══════════════════════════════════════════════
# PHASE 9: Employee pages — all 4 types
# ═══════════════════════════════════════════════

run_phase "Phase 9 — Employee pages visual copy" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old page:
- '"$OLD"'/teachers.php (first 150 lines)

Read new:
- src/components/employees/employee-listing-client.tsx
- src/components/employees/employee-columns.tsx

Match old style:
1. Card wrapper with title + add button in header
2. Filters toolbar inside card
3. Striped bordered table
4. Solid status badges
5. Action buttons visible (not dropdown)
6. Avatar small circle in first column

Also fix: delete action is a no-op stub — wire it up with proper delete + confirmation dialog.

This shared component is used by all 4 employee types (teachers, nurses, doctors, managers).

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: employee listings match old Metronic PHP"
'

# ═══════════════════════════════════════════════
# PHASE 10: Classes, Branches, Food, Accounting pages
# ═══════════════════════════════════════════════

run_phase "Phase 10 — Classes, Branches, Food, Accounting" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old pages:
- '"$OLD"'/classes.php (first 100 lines)
- '"$OLD"'/food.php (first 100 lines)

Read new pages:
- src/components/classes/classes-client.tsx (or find the classes listing component)
- src/app/(app)/food/food-listing-client.tsx
- src/app/(app)/accounting/ (find client component)

Match old style for each:
1. Classes: table view (not card grid) as default. Card wrapper. Striped table.
2. Food: table listing in a card. Category badges solid colored.
3. Accounting: table listing with payment details. Card wrapper.
4. All pages: consistent portlet/card wrapper, striped table, solid badges, visible action buttons.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: classes, food, accounting match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 11: Settings pages — zones, parent-users, nursery, alarms
# ═══════════════════════════════════════════════

run_phase "Phase 11 — Settings and admin pages" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old pages:
- '"$OLD"'/Zones_Management.php (first 100 lines)
- '"$OLD"'/parent_users.php (first 100 lines)

Read new:
- src/app/(app)/settings/zones/zones-client.tsx
- src/app/(app)/settings/parent-users/parent-users-client.tsx
- src/app/(app)/settings/nursery/nursery-client.tsx
- src/app/(app)/alarms/ (find client component)

Fix:
1. Zones/Areas/Regions: Card wrapper, table view, add delete confirmation dialog with toast
2. Parent users: fix prompt()/alert() — replace with Dialog. Two-section layout like old app.
3. Nursery settings: form sections in cards, flat style, no rounded corners
4. Alarms: card wrapper, table listing, solid badges for alarm status

All should follow the Metronic visual pattern: card wrapper, flat, solid badges, visible actions.

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: settings and admin pages match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 12: Messages, Attendance, Calendars
# ═══════════════════════════════════════════════

run_phase "Phase 12 — Messages, Attendance, Calendars" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old pages:
- '"$OLD"'/alarmsMsg.php (first 100 lines — inbox)
- '"$OLD"'/Monthly_report.php (first 100 lines — attendance heatmap)

Read new:
- src/app/(app)/messages/inbox/ (find client component)
- src/app/(app)/attendance/heatmap/ (find client component)
- src/app/(app)/food/calendar/food-calendar-client.tsx
- src/app/(app)/settings/holidays/ (find client component)

Match:
1. Messages inbox: card wrapper, table with From/Date/Nature/Subject/Status/Actions, solid badges
2. Attendance heatmap: keep the heatmap grid but make the surrounding card flat. Legend colors match old: green=present, pink=absent, red=weekends, yellow=holidays.
3. Food calendar: flat card wrapper, calendar grid
4. Holiday calendar: flat card wrapper

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: messages, attendance, calendars match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 13: Child dashboard + Class dashboard
# ═══════════════════════════════════════════════

run_phase "Phase 13 — Child and Class dashboards" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Read old pages:
- '"$OLD"'/child_dashboard.php (first 200 lines)
- '"$OLD"'/class_dashboard.php (first 200 lines)

Read new:
- src/app/(app)/children/[id]/dashboard/dashboard-client.tsx
- src/app/(app)/classes/[id]/page.tsx (class dashboard)

Match old style:
1. Child dashboard:
   - Use StatCard component (not manual Card+CardContent) for all stat cards
   - Stat cards should be solid colored (from Phase 5 stat-card changes)
   - Data tables below should be striped/bordered
   - Profile section: clean layout with child info

2. Class dashboard:
   - Tab sections (Daily Reports / Medical / Assessments)
   - Stat cards per section, solid colored
   - Use StatCard component

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: child and class dashboards match old Metronic"
'

# ═══════════════════════════════════════════════
# PHASE 14: Global cleanup sweep
# ═══════════════════════════════════════════════

run_phase "Phase 14 — Global style sweep" '
You are a Senior Frontend Engineer in /Users/karimsaab/Desktop/garderie.

Do a final sweep across the entire app for visual consistency:

1. Search for rounded-xl, rounded-2xl, rounded-3xl in src/ — change to rounded or rounded-sm (except rounded-full for avatars)

2. Search for backdrop-blur, backdrop-filter in components — remove (except mobile nav overlay)

3. Search for bg-[#0B7464], bg-[#0B9178], text-[#0B7464] (old meadow greens) — replace with bg-primary, text-primary

4. Search for shadow-lg, shadow-xl on cards — remove or reduce to shadow-sm

5. Search for any remaining light-tinted status badges (bg-emerald-50, bg-red-50, bg-amber-50 on badges) — replace with solid colored versions

6. Verify all page wrappers use a Card portlet pattern

Run: npx tsc --noEmit
Commit: git add -A && git commit -m "style: final Metronic visual consistency sweep"
'

# ═══════════════════════════════════════════════
# PHASE 15: Type check + verify
# ═══════════════════════════════════════════════

run_phase "Phase 15 — Final verification" '
You are a QA Engineer in /Users/karimsaab/Desktop/garderie.

Run: npx tsc --noEmit

Fix any type errors. Run again to verify zero errors.

Commit: git add -A && git commit -m "fix: resolve type errors from Metronic visual migration"
'

echo "" >> "$LOG_FILE"
echo "=== ALL PHASES COMPLETE — $(date) ===" >> "$LOG_FILE"
