# KiddzOnline — Product Overview

A nursery/daycare management system built for Lebanese nurseries. Replaces a legacy PHP monolith (2014-era) with a modern web app.

**Core philosophy:** The manager opens the app once a day, sees a green/red status board, handles exceptions, closes it. Teachers do the daily work. The system fills itself from what staff do — the manager almost never fills a form.

---

## Who Uses It

| Role | What they do |
|------|-------------|
| **Manager / Admin** | Morning briefing dashboard, approve absences, monitor finances, compliance docs, staff management |
| **Teacher** | Daily reports per child (meals, sleep, fever, milk), attendance, batch reports |
| **Nurse / Doctor** | Medical records, conditions, visits, vaccinations, accident reports |
| **Parent** *(not built yet)* | View child's daily reports, communicate with staff, receive push notifications |

---

## Feature Map

### Children Management
| Feature | Status | Notes |
|---------|--------|-------|
| Child enrollment form (8 sections) | Done | Info, addresses, parents, siblings, authorized persons, general, financial, attachments |
| Dynamic lists (addresses, siblings, relatives) | Done | React Hook Form useFieldArray |
| Financial info with live calculation | Done | Subtotal, discount, TVA, net total |
| Save as draft | Done | Relaxed validation for incomplete enrollments |
| Child detail dashboard | Done | Info card, 8 stat cards, attendance pie chart, 4 paginated tables |
| Quick actions (call, accident, report, absence) | Done | Links from child dashboard |
| Print view / PDF export | Done | @react-pdf/renderer |
| Child attachments (photos, docs) | Placeholder | "Coming soon" — needs file storage (S3/R2) |
| Class assignment filtered by branch | Not done | Dropdown currently shows all classes across all branches |

### Daily Operations
| Feature | Status | Notes |
|---------|--------|-------|
| Daily reports (meals, sleep, fever, milk) | Done | Create, edit, view, print |
| Batch daily reports | Done | Teachers can fill reports for entire class at once |
| Absence reports | Done | Create with reason, approve/reject workflow |
| Attendance tracking | Done | Present/Absent/Draft/No Report breakdown |
| Food item management | Done | CRUD with category filters (breakfast, lunch, dessert, snack) |
| Food calendar | Done | Monthly grid, click-to-edit, today highlighting, print view |

### Staff / Employees
| Feature | Status | Notes |
|---------|--------|-------|
| 4 employee types (teacher, nurse, doctor, manager) | Done | Shared form with type-specific sections |
| 13-section employee form | Done | Username, info, address, languages, 3 experience types, 4 doc types |
| Dynamic lists (languages, experiences, documents) | Done | Full add/remove |
| Employee mapper (DB → form) | Done | Shared `map-employee-to-form.ts` for all 4 types |
| Staff listing with filters | Done | Branch filter, search, active/inactive |
| Employee attendance calendar | Done | Event-based (sick, absent, day off, warning) |
| File uploads for documents | Placeholder | Contract, medical test, certificate, attachment sections show "Coming soon" |

### Medical
| Feature | Status | Notes |
|---------|--------|-------|
| 5 medical form types | Done | General, conditions, visits, vaccinations, accidents |
| Medical timeline per child | Done | Chronological view |
| Vaccination tracking | Done | With schedules and dates |

### Finance
| Feature | Status | Notes |
|---------|--------|-------|
| Payments | Done | CRUD with method (cash, check, transfer, card) and status (paid, pending, overdue) |
| Accounting entries per child | Done | Fee, discount, payment, adjustment types |
| Quick payment dialog | Done | From dashboard action center |
| Overdue payment tracking | Done | Feeds into dashboard finance pillar |

### Branches & Classes
| Feature | Status | Notes |
|---------|--------|-------|
| Branch management | Done | CRUD with sub-nav (dashboard, classes, compliance) |
| Class management | Done | Card grid with avatars, stats, add/edit/delete dialogs, active toggle |
| Government compliance form | Done | 9 sections with Arabic subtitles, 12 required document types |
| Compliance document uploads | Placeholder | Needs file storage |

### Communication
| Feature | Status | Notes |
|---------|--------|-------|
| Messages (inbox, sent, compose) | Done | Thread-based, direct or class-wide |
| WhatsApp links for parents | Done | Quick dial from child dashboard |
| Call logging (incoming, outgoing, missed) | Done | Per-child tracking |

### Notifications & Alarms
| Feature | Status | Notes |
|---------|--------|-------|
| 10 notification types | Done | Birthday, missing reports, assessment due, medicine, insurance, contract, vaccination, holiday, payment |
| Notification settings page | Done | Per-branch toggles, days-before config, template editors with shortcodes |
| Header bell dropdown | Done | Grouped notifications, colored borders, mark-all-read |
| Alarm settings | Done | Threshold configuration per branch |
| **Notification sending** | **Not built** | Settings save but no cron/background job sends anything yet |
| Push notifications (FCM/APNs) | Not built | PushToken model exists, no integration |
| Email transport | Not built | No email service configured |

### Assessments
| Feature | Status | Notes |
|---------|--------|-------|
| Assessment forms (7 types) | Done | Create, edit, view per child |
| Assessment dates scheduling | Done | Calendar-based scheduling |

### Holiday Calendar
| Feature | Status | Notes |
|---------|--------|-------|
| Holiday management | Done | Multi-day bars, calendar/list toggle, edit dialog |
| Event types and recurrence | Done | One-time or repeated, branch-scoped |
| Notification config per holiday | Done | Days-before alerts |

### Dashboard
| Feature | Status | Notes |
|---------|--------|-------|
| Morning briefing (manager) | Done | 5 status pillars (attendance, reports, staff, finance, health) |
| Action center | Done | Flat prioritized list with inline absence approve/reject |
| Insights panel | Done | Week-over-week trends, chronic absences, illness clusters |
| Today's menu widget | Done | From food calendar |
| Weekly attendance chart | Done | Recharts sparkline, last 5 working days |
| Teacher "Today" view | Done | Redirects teachers to their daily workflow |

### Settings
| Feature | Status | Notes |
|---------|--------|-------|
| Nursery settings | Done | Branch configuration |
| Parent user management | Done | CRUD for parent accounts |
| School year management | Done | Active year, date ranges |
| Region/Zone/Area admin | Done | Lebanese administrative divisions |
| Data export | Done | Excel export via xlsx |

### Parent Portal
| Feature | Status | Notes |
|---------|--------|-------|
| API endpoints | Partial | 13 API routes exist (absence, alarms, calendar, daily, finance, login, messages, notifications, push-token) |
| Parent-facing UI | **Not built** | No parent pages, only API |
| Parent authentication | Partial | `parent-auth.ts` + JWT via jose, separate from staff auth |

---

## What's Not Built Yet

**Blocking for production:**
1. **File uploads** — Every document/attachment section is placeholder. Need S3, Cloudflare R2, or similar.
2. **Notification sending** — Settings page works, but nothing fires. Need cron job to evaluate rules + push/email transport.
3. **Proper DB migrations** — All schema changes via `prisma db push` (dev only). Need migration files for production deploys.
4. **Parent portal UI** — API exists but no parent-facing pages.

**Important but not blocking:**
5. **Testing** — Zero test files. No unit, integration, or E2E tests.
6. **Mobile responsiveness** — Pages designed desktop-first. Need responsive review.
7. **Full i18n** — Only Arabic compliance labels hardcoded. No translation framework.
8. **Role-based access control** — Auth exists but new pages don't enforce role checks.
9. **Pagination at scale** — Some server actions fetch all records. Need cursor/offset for large datasets.
10. **Global search** — Command palette exists (cmdk) but not wired to real search.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (Radix) |
| Database | PostgreSQL + Prisma 7 |
| Auth | Auth.js v5 (staff), JWT via jose (parents) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| PDF | @react-pdf/renderer |
| Excel | xlsx |
| PWA | Serwist (service worker + manifest) |
| Icons | Lucide React |
| Toasts | Sonner |
| Command palette | cmdk |
| Package manager | pnpm |

---

## Codebase Stats

| Metric | Count |
|--------|-------|
| Route pages | 75 |
| Server action files | 28 |
| React components | 94 |
| Prisma models | 59 |
| Database enums | 31 |
| Parent API endpoints | 13 |
| PDF endpoints | 4 |
| Test files | 0 |

---

## Branch Strategy

- **`main`** — Metronic dark-blue theme (classic). User works here for feature development.
- **`ux-improvements`** — Modern playful theme (gradients, rounded cards, colored avatars). Claude ports and restyles features from main.

Don't cherry-pick between branches — restyle when porting.

---

## Dev Setup

```bash
cd /Users/karimsaab/Desktop/garderie
pnpm install
pnpm exec next dev --port 3333
```

Database: Neon PostgreSQL (connection string in `.env`).
Schema changes: `npx prisma db push` (dev), proper migrations needed for prod.
