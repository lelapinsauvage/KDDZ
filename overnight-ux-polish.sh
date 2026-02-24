#!/bin/bash
set -e

cd /Users/karimsaab/Desktop/garderie
LOG_FILE="/Users/karimsaab/Desktop/garderie/overnight-log.txt"

echo "=== OVERNIGHT BUILD — Started $(date) ===" | tee "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 1: Dashboard visual polish
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 1: Dashboard visual polish — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7, Recharts).

PHASE 1: Make the dashboard look beautiful and alive. Currently it's too clinical — just colored dots and plain text.

Read these files first to understand what exists:
- src/app/(app)/dashboard/page.tsx
- src/components/dashboard/status-board.tsx
- src/components/dashboard/action-center.tsx
- src/components/dashboard/insights-panel.tsx
- src/components/dashboard/weekly-attendance-chart.tsx
- src/components/dashboard/today-menu-widget.tsx
- src/lib/actions/dashboard.ts
- src/app/globals.css (for the color palette)
- src/app/(app)/dashboard/loading.tsx

Then make these improvements:

1. FIX THE HEALTH PILLAR DATA: In dashboard.ts, the health query counts ALL draft medical forms ever (giving 237). Change it to only count medical forms created in the last 30 days with status DRAFT, plus active health-related alarms. This should give a small, meaningful number.

2. REDESIGN STATUS PILLARS (status-board.tsx): Each pillar needs:
   - A unique icon (Users for attendance, FileText for reports, Briefcase for staff, DollarSign for finance, Heart for health) from lucide-react
   - Richer visual: the icon should be prominent (size-6) with a colored background circle
   - Each pillar should use a DIFFERENT color family — not just green/amber/red for status. Use the app's playful accent palette:
     * Attendance → teal/cyan family
     * Reports → purple/violet family
     * Staff → sky/blue family
     * Finance → amber/orange family
     * Health → pink/rose family
   - The status (green/amber/red) should be shown as a small indicator dot in the corner, not the dominant color
   - Make them feel like friendly dashboard cards, not traffic lights
   - Keep them clickable with hover effects

3. ACTION CENTER (action-center.tsx): Add icons per item type:
   - Overdue payments → DollarSign icon with rose bg
   - Missing reports → FileWarning icon with amber bg
   - Pending absences → UserX icon with violet bg
   - Draft registrations → FileEdit icon with sky bg
   - Make each row feel like a mini-card with subtle bg, not just a flat list row
   - The empty state (All clear) is good — keep it

4. INSIGHTS PANEL (insights-panel.tsx):
   - Add a Lightbulb icon in the header
   - Use small icons per insight type (TrendingUp for positive, TrendingDown for warning, Minus for neutral)
   - Give each insight a subtle pill/badge style background

5. TODAY'S MENU (today-menu-widget.tsx):
   - Add meal type icons (Coffee for breakfast, UtensilsCrossed for lunch, Cake for dessert, Cookie for snack) from lucide-react
   - Make the empty state warmer
   - Add a link to set/edit menu (small Pencil icon)

6. WEEKLY ATTENDANCE CHART (weekly-attendance-chart.tsx):
   - When data is all zeros, show a friendly empty state instead of empty bars
   - Use the app's teal color for bars instead of status colors
   - Add a subtle tooltip on hover showing the count

7. GREETING (page.tsx):
   - Add a Sun/Moon/Sunrise icon next to the greeting based on time of day
   - Make the attention summary more conversational

8. LOADING SKELETON (loading.tsx): Update to match the new pillar sizes.

IMPORTANT:
- Use lucide-react icons (already installed)
- Use the existing Tailwind color palette from globals.css
- Keep all existing functionality — just make it look better
- Don't break any TypeScript types
- Run 'npx tsc --noEmit' at the end to verify no type errors

After all changes, commit with message: 'polish: dashboard visual redesign — icons, colors, friendly empty states'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 1 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 2: Teacher Today page polish
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 2: Teacher Today page polish — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 2: Polish the teacher's Today page to feel warm and engaging.

Read these files first:
- src/app/(app)/today/page.tsx
- src/app/(app)/today/today-client.tsx
- src/app/globals.css (for the color palette)

Also check if there's a loading.tsx for the today page.

Then improve:

1. STATS CARDS at the top: Make them use different colors from the accent palette (teal, purple, rose, amber) with relevant icons (Users, CheckCircle, Clock, UserX). Show numbers prominently with the label smaller below. Add subtle colored left-border.

2. PROGRESS BAR: Use a gradient from amber to green as it fills. Show the percentage prominently. Feel encouraging.

3. CHILD ROSTER: Each child row should have avatar placeholder (colored circle with initials). Status badges with distinct accent colors. Action buttons more visible.

4. TODAY'S MENU card (sidebar): Add meal icons like the dashboard version.

5. ALERTS card (sidebar): Use colorful icons per alert type. Show counts as badges. Make them feel clickable.

6. QUICK ACTIONS: The action buttons should use different accent colors per action, have icons, feel like primary actions.

7. EMPTY STATES: If no children, no reports — add friendly messages.

8. Add a loading.tsx skeleton for the today page if one doesn't exist.

IMPORTANT: Keep all existing functionality. Don't break TypeScript. Run 'npx tsc --noEmit' at the end.

After all changes, commit with message: 'polish: teacher today page — colorful stats, friendly roster, rich actions'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 2 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 3: Children list & detail pages polish
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 3: Children pages polish — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 3: Polish the children list and detail pages.

Read all files in src/app/(app)/children/ and src/components/children/ first.
Also read src/app/globals.css for the color palette.

Then improve:

1. CHILDREN LIST: Avatar circles with initials (different colors based on name), distinct status badges, class name as colored pill, gender icons, warm empty state, polished pagination.

2. CHILD DASHBOARD: Tab nav with icons + labels, colored stat cards, large avatar circle in header, breadcrumb navigation.

3. FILTERS: Polished dropdowns with labels, search icon in search input, dismissible filter pills.

4. Add loading.tsx skeletons where missing.

IMPORTANT: Keep all existing functionality. Don't break TypeScript. Run 'npx tsc --noEmit' at the end.

After all changes, commit with message: 'polish: children pages — avatars, colorful badges, richer cards'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 3 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 4: Daily reports & absence pages polish
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 4: Reports & absence pages polish — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 4: Polish daily reports list, absence reports, and batch report page.

Read all relevant files in src/app/(app)/daily-reports/, src/app/(app)/absent-reports/, src/components/daily-reports/, src/components/absent-reports/.

Then improve:

1. DAILY REPORTS LIST: Child avatars, colored status badges with icons, visual meal/mood indicators, modern table feel.

2. BATCH REPORT: Colored class grouping headers, child avatars, clear status indicators per child, quick checklist feel.

3. ABSENCE REPORTS: Very visual status workflow (PENDING=amber, APPROVED=green, REJECTED=red with icons), child avatars, clear reason display, prominent approve/reject buttons.

4. Consistent polished filters across all pages.

5. Add loading.tsx skeletons where missing.

IMPORTANT: Keep all functionality. Don't break TypeScript. Run 'npx tsc --noEmit' at the end.

After all changes, commit with message: 'polish: reports & absence pages — avatars, visual status, modern tables'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 4 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 5: Accounting, medical & staff pages polish
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 5: Accounting, medical & staff polish — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 5: Polish accounting, medical records, and staff pages.

Read all files in src/app/(app)/accounting/, src/app/(app)/medical/, src/app/(app)/employees/ and related components.

Then improve:

1. ACCOUNTING: Colored summary cards (green revenue, amber pending, red overdue, blue current month) with icons. Child avatars. Payment method icons. Nice currency formatting.

2. MEDICAL: Distinct color+icon per record type. Colored status badges. Child avatars. Professional feel.

3. STAFF: Avatar initials. Role badges with distinct colors (Teacher=teal, Nurse=rose, Doctor=blue, Manager=purple). Visual active/inactive. Contact info with icons.

4. Loading skeletons where missing.

IMPORTANT: Keep all functionality. Don't break TypeScript. Run 'npx tsc --noEmit' at the end.

After all changes, commit with message: 'polish: accounting, medical & staff — colored cards, avatars, status icons'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 5 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 6: Sidebar, header, mobile nav polish
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 6: Shell & navigation polish — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 6: Polish the app shell — sidebar, header, mobile nav, footer.

Read src/components/layout/ (all files), src/app/(app)/layout.tsx, src/app/globals.css.

Then improve:

1. SIDEBAR: Subtle colored section headers. Better spacing. Stronger active indicator (colored left border + tinted bg). Accent-colored badges (rose for urgent, amber for warnings). Polished logo area. Hover animations.

2. HEADER: Lighter/cleaner feel. Styled branch/year selector. Search with focus state. User avatar with colored initials circle.

3. MOBILE BOTTOM NAV: Slightly larger icons. Colored active indicator. Readable labels. Subtle shadow.

4. FOOTER: Minimal, dynamic copyright year.

IMPORTANT: Keep all functionality (role-based nav, badge fetching). Don't break TypeScript. Run 'npx tsc --noEmit' at the end.

After all changes, commit with message: 'polish: sidebar, header & mobile nav — visual refinements'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 6 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 7: Settings, food, messaging pages polish
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 7: Settings, food & messaging polish — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 7: Polish settings, food calendar, and messaging pages.

Read all files in src/app/(app)/settings/, src/app/(app)/food/, src/app/(app)/messages/ and related components.

Then improve:

1. SETTINGS: Clear icon+description per section. Well-labeled form fields. Prominent save buttons. Organized sections.

2. FOOD CALENDAR: Meal-type colors in the grid. Clear food names. Empty slots invite adding (+). Visual, at-a-glance readable.

3. MESSAGING: Sender avatars (colored initials). Unread indicator (dot/bold). Clean compose. Conversation-style thread view.

4. Loading skeletons where missing.

IMPORTANT: Keep all functionality. Don't break TypeScript. Run 'npx tsc --noEmit' at the end.

After all changes, commit with message: 'polish: settings, food calendar & messaging — visual refinements'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 7 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ═════════════════════════════════════════════════════
# STRUCTURAL PHASES — Beyond visual polish
# ═════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────
# PHASE 8: Make settings actually editable
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 8: Make settings editable — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7, PostgreSQL via Neon).

PHASE 8: Make the nursery settings page actually editable. Currently many settings display data but can't be edited.

Read these files:
- src/app/(app)/settings/nursery/page.tsx and any client components
- src/lib/actions/ — look for any existing settings-related server actions
- prisma/schema.prisma — find the Branch model or any nursery/settings model
- src/components/settings/ (if exists)

Then:

1. NURSERY SETTINGS PAGE: The nursery info page should be a real editable form with:
   - Nursery name (text input)
   - Phone (text input)
   - Email (text input)
   - Address (textarea)
   - Opening hours (text input or time pickers)
   - A proper Save button that persists to the database

2. Create a server action 'updateNurserySettings' in src/lib/actions/settings.ts (or add to existing file) that:
   - Accepts the form data
   - Validates with zod
   - Updates the database
   - Returns success/error

3. Make the form a client component with react-hook-form + zod validation (both already installed)
   - Show loading state on save
   - Show success toast (sonner is installed) on save
   - Show error messages on validation failure

4. HOLIDAY SETTINGS: Check src/app/(app)/settings/holidays/ — if holidays are just displayed but can't be added/edited/deleted, add that functionality:
   - Add holiday button → opens a dialog with date picker + name input
   - Delete holiday with confirmation
   - Server actions for CRUD

5. EVENT SETTINGS: Same as holidays — check src/app/(app)/settings/events/ and make sure events can be created/edited/deleted.

IMPORTANT:
- Use react-hook-form + zod for all forms (already installed)
- Use sonner for toast notifications (already installed)
- Use shadcn/ui Dialog for modals (already installed)
- Keep existing read functionality working
- Don't break TypeScript — run 'npx tsc --noEmit' at the end

After all changes, commit with message: 'feat: editable nursery settings, holidays & events — forms with validation'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 8 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 9: PWA setup — make the app installable
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 9: PWA setup — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app.

PHASE 9: Set up PWA (Progressive Web App) so the app is installable on phone home screens.

1. Install serwist for Next.js PWA support:
   pnpm add @serwist/next
   pnpm add -D serwist

2. Create /public/manifest.json:
   - name: 'KiddzOnline'
   - short_name: 'KiddzOnline'
   - description: 'Nursery Management Platform'
   - start_url: '/'
   - display: 'standalone'
   - background_color: '#FAFAF9' (matches the app bg)
   - theme_color: '#14B8A6' (the teal primary)
   - icons: generate placeholder icon entries for 192x192 and 512x512 (we'll add real icons later)
   - For now, create simple SVG icons in /public/ — a rounded teal square with 'K' letter in white

3. Create the service worker at src/app/sw.ts using serwist:
   - Basic precaching of app shell
   - Runtime caching for API routes
   - Offline fallback page

4. Update next.config.ts to integrate serwist/next (withSerwist wrapper)

5. Add the manifest link and theme-color meta tag to src/app/layout.tsx (the root layout):
   - <link rel='manifest' href='/manifest.json'>
   - <meta name='theme-color' content='#14B8A6'>
   - <meta name='apple-mobile-web-app-capable' content='yes'>
   - <meta name='apple-mobile-web-app-status-bar-style' content='default'>
   - <link rel='apple-touch-icon' href='/icon-192.png'>

6. Create a simple offline fallback page at src/app/offline/page.tsx:
   - Friendly message: 'You appear to be offline'
   - Suggest checking connection
   - Use the app's styling

IMPORTANT:
- Read next.config.ts first to understand the existing config before modifying it
- Read src/app/layout.tsx first before modifying
- Don't break the existing build
- Run 'npx tsc --noEmit' and 'pnpm exec next build' at the end to verify
- If serwist causes build issues, document the problem and skip to a simpler approach: just add manifest.json and meta tags without the service worker

After all changes, commit with message: 'feat: PWA setup — manifest, service worker, installable on mobile'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 9 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 10: Consistent page headers + breadcrumbs
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 10: Page headers & breadcrumbs — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui).

PHASE 10: Create a consistent PageHeader component with breadcrumbs and apply it across all main pages.

1. Create a reusable PageHeader component at src/components/layout/page-header.tsx:
   - Props: title (string), description? (string), breadcrumbs? (array of {label, href}), actions? (ReactNode for right-side buttons)
   - Shows breadcrumbs at top (Home > Children > Karim) using subtle slash separators
   - Title in bold with optional description below
   - Action buttons aligned to the right (for 'Add New', 'Export', etc.)
   - Consistent spacing and typography
   - Use lucide-react ChevronRight or Slash for breadcrumb separators

2. Apply PageHeader to these pages (read each page first, then add the header):
   - /children — title: 'Children', action: 'Add Child' button
   - /children/[id]/dashboard — title: child name, breadcrumbs: Home > Children > [name]
   - /daily-reports — title: 'Daily Reports', action: 'New Report' button
   - /absent-reports — title: 'Absence Reports', action: 'Report Absence' button
   - /accounting — title: 'Accounting', action: 'Add Payment' button
   - /employees/staff — title: 'Staff', action: 'Add Staff' button
   - /medical/* pages — title varies, breadcrumbs: Home > Health > [type]
   - /messages/* pages — title varies, breadcrumbs: Home > Messages > [type]
   - /settings/* pages — title varies, breadcrumbs: Home > Settings > [section]
   - /food/calendar — title: 'Food Calendar', breadcrumbs: Home > Food > Calendar

3. Make sure existing 'Add' buttons / page actions are moved INTO the PageHeader (not duplicated).

IMPORTANT:
- Read each page before modifying to understand its current header
- Don't add PageHeader to dashboard or today pages (they have custom headers)
- Keep all functionality
- Run 'npx tsc --noEmit' at the end

After all changes, commit with message: 'feat: consistent page headers with breadcrumbs across all pages'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 10 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 11: Quick payment recording for admin
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 11: Quick payment recording — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 11: Build a quick payment recording flow. The admin needs to record cash payments fast — parent hands over money, admin records it in seconds.

Read these files first:
- prisma/schema.prisma — find the Payment model
- src/app/(app)/accounting/page.tsx and client components
- src/lib/actions/payments.ts (if exists)
- src/components/accounting/ (if exists)

Then build:

1. QUICK PAYMENT DIALOG: A dialog/sheet that can be opened from:
   - The accounting page (via 'Record Payment' button)
   - A child's profile accounting tab
   - Create component at src/components/accounting/quick-payment-dialog.tsx

2. The dialog should have:
   - Child selector (searchable combobox — type child name, select from results)
   - Amount input (number, with $ prefix)
   - Payment method: 4 icon buttons (Cash, Check, Transfer, Card) — tap to select, not a dropdown
   - Category: Quick select pills (Monthly, Registration, Bus, Food, Extra Time, Other)
   - Optional notes (textarea, collapsed by default)
   - 'Record Payment' button

3. Server action 'recordPayment' in src/lib/actions/payments.ts:
   - Creates a Payment record with status PAID
   - Validates with zod
   - Returns success with payment ID
   - Revalidates the accounting page

4. After recording, show a success toast: 'Payment of \$X recorded for [Child Name]'

5. The dialog should be fast — child selector should be the first field, auto-focused. After recording one payment, the form should reset for the next one (stay open for batch recording).

IMPORTANT:
- Use react-hook-form + zod
- Use sonner for toasts
- Use shadcn/ui Sheet or Dialog
- Use the existing shadcn Command component for searchable child selector
- Keep the existing accounting page working
- Run 'npx tsc --noEmit' at the end

After all changes, commit with message: 'feat: quick payment recording dialog — fast cash payment flow'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 11 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 12: Notification/alarm improvements
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 12: Notifications & alarms — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 12: Improve the notification/alarm system to be more useful and visual.

Read these files:
- src/app/(app)/alarms/ (all files)
- src/components/alarms/ (if exists)
- src/lib/actions/alarms.ts (if exists)
- prisma/schema.prisma — find the Alarm model
- src/components/layout/header.tsx — the notification bell icon

Then improve:

1. NOTIFICATION BELL in header:
   - Show a dropdown/popover when clicked (not navigate to a page)
   - Show the 5 most recent active alarms in the dropdown
   - Each alarm should have: icon based on type, message, time ago, dismiss button
   - 'View All' link at bottom → goes to /alarms page
   - Badge count on the bell should pulse when there are critical alarms

2. ALARM TYPES should have distinct icons and colors:
   - BIRTHDAY → Cake icon, pink
   - VACCINATION → Syringe icon, blue
   - MEDICAL → Heart icon, red
   - MEDICINE → Pill icon, purple
   - PAYMENT → DollarSign icon, amber
   - EVENT → Calendar icon, teal
   - INSURANCE → Shield icon, orange
   - CONTRACT → FileText icon, indigo
   - REQUEST → MessageSquare icon, sky

3. ALARMS PAGE (/alarms):
   - Show alarms grouped by type with colored section headers
   - Each alarm should be a card with icon, message, due date, and action button
   - Overdue alarms should have a red accent
   - Add ability to dismiss/snooze alarms (mark as inactive)

4. Create a server action to dismiss an alarm (set isActive: false)

IMPORTANT:
- Read the existing header notification implementation before changing it
- Keep existing alarm page functionality
- Run 'npx tsc --noEmit' at the end

After all changes, commit with message: 'feat: notification bell dropdown, visual alarm types, dismiss alarms'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 12 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 13: Parent user management improvements
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 13: Parent user management — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 13: Improve the parent user management page and add quick contact features.

Read these files:
- src/app/(app)/settings/parent-users/page.tsx and client components
- src/app/(app)/settings/parent-users/[id]/page.tsx
- prisma/schema.prisma — find the ParentUser or User models, and the Parent/Relative models
- src/lib/actions/ — any parent-related actions

Then improve:

1. PARENT USERS LIST:
   - Show parent name, phone, email, linked children (with avatars)
   - Quick contact buttons: phone icon (tel: link), WhatsApp icon (wa.me link using their phone number)
   - Status indicator (active/inactive account)
   - Search by parent name or child name

2. PARENT USER DETAIL:
   - Show all linked children with quick links to each child's profile
   - Contact info with click-to-call and click-to-WhatsApp
   - Account status toggle
   - Last login date if available

3. WHATSAPP QUICK LINK: For any parent phone number, generate a wa.me link:
   - Format: https://wa.me/[phone without spaces/dashes]
   - Show as a green WhatsApp icon button wherever parent phone appears

4. Also add WhatsApp quick links on child detail pages — in the parents/relatives section, add click-to-WhatsApp buttons next to phone numbers.

5. Apply these WhatsApp links in src/app/(app)/children/[id]/ pages where parent contacts are shown.

IMPORTANT:
- Read existing pages before modifying
- Keep all existing functionality
- Run 'npx tsc --noEmit' at the end

After all changes, commit with message: 'feat: parent management — WhatsApp quick links, contact buttons, better list'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 13 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 14: Print-friendly views
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 14: Print-friendly views — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui, Prisma 7).

PHASE 14: Add print-friendly views for key pages that nurseries need to print.

Read these files to understand what exists:
- src/app/(app)/food/calendar/print/page.tsx (if exists — there's already a print route for food)
- src/app/(app)/daily-reports/ pages
- src/app/(app)/children/[id]/dashboard/page.tsx
- src/app/(app)/accounting/page.tsx

Then:

1. DAILY REPORT PRINT VIEW:
   - Create src/app/(app)/daily-reports/[id]/print/page.tsx
   - A clean, printer-friendly layout showing:
     * Child name, date, class
     * Meals (breakfast, lunch, dessert with portions)
     * Sleep times
     * Health/mood info
     * Teacher remarks
     * Nursery branding (name at top)
   - Add @media print CSS in the component or a print stylesheet
   - Add a 'Print' button on the daily report detail page that links here

2. CHILD PROFILE PRINT:
   - Create src/app/(app)/children/[id]/print/page.tsx
   - Shows child's full info in a printable format:
     * Name, DOB, blood type, allergies
     * Parent/guardian contacts
     * Emergency contacts
     * Medical conditions
     * Vaccination status
   - Useful for emergencies or sharing with doctors

3. PRINT STYLES:
   - Add a @media print section to globals.css that:
     * Hides sidebar, header, footer, mobile nav
     * Makes content full-width
     * Uses black text on white background
     * Hides interactive elements (buttons, links)
     * Shows URLs after links

4. Add 'Print' buttons (Printer icon from lucide-react) to:
   - Daily report detail page
   - Child dashboard page
   - Food calendar page (check if already exists)

IMPORTANT:
- Read existing pages before modifying
- Print pages should be separate routes (not just CSS) so they have clean layouts
- Keep all existing functionality
- Run 'npx tsc --noEmit' at the end

After all changes, commit with message: 'feat: print-friendly views — daily reports, child profiles, print styles'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 14 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 15: Empty states & error boundaries
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 15: Empty states & error handling — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app (React 19, Tailwind v4, shadcn/ui).

PHASE 15: Add beautiful empty states and error boundaries across the app.

1. CREATE A REUSABLE EMPTY STATE COMPONENT at src/components/ui/empty-state.tsx:
   - Props: icon (LucideIcon), title (string), description (string), action? ({label, href} for a CTA button)
   - Visual: Large faded icon, centered title, description, optional action button
   - Use soft colors, generous spacing
   - Example: icon=Users, title='No children yet', description='Add your first child to get started', action={label:'Add Child', href:'/children/new'}

2. Apply empty states to ALL list pages. Read each page first and find where it shows an empty table or 'No data':
   - /children — 'No children found'
   - /daily-reports — 'No reports yet today'
   - /absent-reports — 'No absence reports'
   - /accounting — 'No payments recorded'
   - /employees/staff — 'No staff members'
   - /messages/inbox — 'Your inbox is empty'
   - /medical/* — 'No [type] records'
   - /food — 'No food items'

3. CREATE AN ERROR BOUNDARY at src/app/(app)/error.tsx:
   - Friendly error page: 'Something went wrong'
   - Icon (AlertTriangle)
   - 'Try Again' button that calls reset()
   - 'Go Home' link back to dashboard
   - Use the app's styling

4. CREATE A NOT-FOUND PAGE at src/app/(app)/not-found.tsx:
   - Friendly 404: 'Page not found'
   - Suggestion to go back to dashboard
   - Use app styling

5. Make sure the global error.tsx (src/app/error.tsx) and not-found.tsx (src/app/not-found.tsx) also exist with friendly styling.

IMPORTANT:
- Keep all existing functionality
- Run 'npx tsc --noEmit' at the end

After all changes, commit with message: 'feat: empty states, error boundaries & 404 pages — friendly fallbacks everywhere'
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 15 COMPLETE — $(date)" | tee -a "$LOG_FILE"

# ─────────────────────────────────────────────────────
# PHASE 16: Final consistency pass
# ─────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "=== PHASE 16: Final consistency pass — $(date) ===" | tee -a "$LOG_FILE"

claude --dangerously-skip-permissions -p "
You are working on /Users/karimsaab/Desktop/garderie — a Next.js 16 nursery management app.

PHASE 16: Final consistency and quality pass. This is the LAST phase.

1. Run 'npx tsc --noEmit' and fix ALL type errors. This is critical — the build must pass.

2. Start the dev server briefly to check for runtime errors: 'pnpm exec next dev --port 3333 &' then curl the main pages (dashboard, today, children, daily-reports, accounting) and check for errors. Kill the server after.

3. Read through the git log of tonight's commits to see everything that changed:
   git log --oneline -20

4. Check src/app/globals.css — if any component uses hardcoded colors that should use CSS variables, fix them for consistency.

5. Check ALL loading.tsx files exist for main routes:
   - src/app/(app)/dashboard/loading.tsx
   - src/app/(app)/today/loading.tsx
   - src/app/(app)/children/loading.tsx
   - src/app/(app)/daily-reports/loading.tsx
   - src/app/(app)/absent-reports/loading.tsx
   - src/app/(app)/accounting/loading.tsx
   - src/app/(app)/employees/staff/loading.tsx
   - src/app/(app)/messages/inbox/loading.tsx
   Create any that are missing with appropriate Skeleton-based layouts.

6. Verify the PWA manifest.json is valid JSON and referenced in the root layout.

7. Write a comprehensive summary of ALL changes made tonight to /Users/karimsaab/Desktop/garderie/OVERNIGHT-SUMMARY.md:
   - List each phase with what was done
   - Note any issues or things that couldn't be completed
   - Recommendations for what to do next
   - List all new files created
   - List all commits made

After all fixes, commit with message: 'chore: final consistency pass — type fixes, missing skeletons, cleanup'

Then run 'pnpm exec next build' to verify the full production build passes. If it fails, fix the errors and commit again.
" 2>&1 | tee -a "$LOG_FILE"

echo "PHASE 16 COMPLETE — $(date)" | tee -a "$LOG_FILE"

echo "" | tee -a "$LOG_FILE"
echo "=== ALL 16 PHASES COMPLETE — $(date) ===" | tee -a "$LOG_FILE"
echo "Check OVERNIGHT-SUMMARY.md for details" | tee -a "$LOG_FILE"
echo "Check git log --oneline -20 for all commits" | tee -a "$LOG_FILE"
