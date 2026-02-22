# Security Audit Notes

Last audited: 2026-02-22
Scope: Full OWASP Top 10 review of the Garderie application

---

## 1. SQL Injection

**Status: PASS**

- All database queries use Prisma ORM with parameterized queries
- 2 instances of `$queryRaw` found in `src/app/(app)/dashboard/page.tsx` (lines 111-127) — both use Prisma's tagged template literals which auto-parameterize values
- No use of `$queryRawUnsafe` or `$executeRawUnsafe` anywhere
- No string concatenation in any SQL context

## 2. Cross-Site Scripting (XSS)

**Status: PASS**

- 1 instance of `dangerouslySetInnerHTML` in `src/components/ui/chart.tsx` — generates CSS only from hardcoded theme config, no user input; safe
- All user-facing data rendered via React JSX (auto-escaped)
- No `innerHTML` assignments, no `eval()`, no `new Function()`
- No `javascript:` protocol in links

**Fixed:** Added security headers in `next.config.ts`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

## 3. Authentication

**Status: PASS**

- Auth.js v5 with JWT session strategy protects all `(app)` routes
- Middleware (`src/middleware.ts`) runs on all routes except static assets
- `auth.config.ts` defines public routes: `/login`, `/forgot`, `/api/auth/*`, `/api/parent/*`
- Parent portal uses separate JWT auth (HS256, 30-day expiry) via `authenticateParent()`
- All 12 parent API routes validate JWT tokens before processing
- All parent data-access routes verify parent-child relationships via `verifyChildAccess()`
- All PDF API routes check `auth()` session

**Fixed:** Removed hardcoded JWT secret fallback (`"parent-portal-secret-change-me"`) from `src/lib/parent-auth.ts`. Now throws an error if `PARENT_JWT_SECRET` or `AUTH_SECRET` is not configured.

## 4. Authorization

**Status: PASS**

- All server action mutations (create/update/delete) verify `auth()` session
- Read-only server actions are protected by NextAuth middleware (defense-in-depth via middleware layer)
- Parent API endpoints consistently check `verifyChildAccess(parentUser, childId)` for child-specific data
- Parent message endpoint verifies `parentUser.childId === usites` before sending

## 5. CSRF

**Status: PASS**

- All data mutations use Next.js server actions which have built-in CSRF protection (origin header validation)
- Parent API routes use Bearer JWT tokens (not cookies), making them inherently CSRF-resistant
- No cookie-based custom API routes that would need CSRF tokens
- No open redirect vulnerabilities found — all redirects use hardcoded paths

## 6. File Upload

**Status: N/A (not yet implemented)**

- File upload is planned but not yet built — placeholder UI exists in employee and child forms
- When implemented, must validate: file types (whitelist MIME types), file sizes (enforce limits), filenames (prevent path traversal), storage location (outside web root)

## 7. Rate Limiting

**Status: PASS**

- `POST /api/parent/login` — 10 attempts per minute per IP
- `POST /api/parent/messages` — 20 requests per minute per IP (added in this audit)
- `POST /api/parent/push-token` — 30 requests per minute per IP (added in this audit)
- Implementation uses in-memory store (`src/lib/parent-auth.ts`)
- IP extracted from `x-forwarded-for` header (correct for reverse proxy deployments)

**Remaining concern:** In-memory rate limiting resets on server restart. For production with multiple instances, consider Redis-based rate limiting.

## 8. Sensitive Data

**Status: PASS (after fixes)**

- `.gitignore` includes `.env*` and `*.pem`
- No hardcoded secrets in source code (fixed: removed JWT fallback)
- No sensitive data in `console.log` statements (error messages only, no passwords/tokens)
- No `NEXT_PUBLIC_*` variables exposing secrets

**Fixed:** `src/lib/actions/parent-users.ts` — all Prisma queries now use explicit `select` to exclude `passwordHash` and `token` fields from responses. Affected functions: `getParentUsers()`, `getParentUser()`, `createParentUser()`, `updateParentUser()`, `toggleParentUserStatus()`.

**Fixed:** `src/lib/actions/parent-users.ts` — added minimum password length validation (6 characters) to `createParentUser()` and `resetParentPassword()`.

## 9. Input Validation

**Status: PARTIAL**

Validated with Zod schemas:
- Child forms (`src/lib/validations/child.ts`)
- Daily reports (`src/lib/validations/daily-report.ts`)
- Absence reports (`src/lib/validations/absence-report.ts`)
- Parent login (`src/app/api/parent/login/route.ts`)
- Parent messages (`src/app/api/parent/messages/route.ts`)
- Push tokens (`src/app/api/parent/push-token/route.ts`)

**Remaining concern:** Several server actions accept TypeScript interfaces without Zod validation:
- `src/lib/actions/employees.ts` — accepts raw `EmployeeData`
- `src/lib/actions/payments.ts` — accepts raw `CreatePaymentData`
- `src/lib/actions/medical.ts` — accepts raw `CreateMedicalFormData`
- `src/lib/actions/messages.ts` — accepts raw `SendMessageData`
- `src/lib/actions/assessments.ts` — accepts raw `CreateAssessmentData`
- `src/lib/actions/food.ts` — accepts raw `CreateFoodData`

These are mitigated by: (a) middleware authentication required, (b) Prisma ORM type safety, (c) client-side React Hook Form + Zod validation. However, server-side Zod schemas should be added for defense-in-depth.

**Remaining concern:** Some Zod schemas lack tight constraints (no `.max()` on text fields, temperature field in daily reports not bounds-checked). These should be tightened.

## 10. Dependency Security

**Status: KNOWN VULNERABILITIES**

`pnpm audit` results (2026-02-22):

| Severity | Package | Issue | Notes |
|----------|---------|-------|-------|
| HIGH | `xlsx` | Prototype Pollution + ReDoS | No patched version available; used for Excel export only (admin-only, no untrusted input) |
| HIGH | `minimatch` | ReDoS | Transitive via `eslint` — dev-only dependency, not in production bundle |
| MODERATE | `lodash` | Prototype Pollution in `_.unset`/`_.omit` | Transitive via `prisma` dev tooling — not in production bundle |
| MODERATE | `hono` (x4) | XSS, cache, IP spoofing, key read | Transitive via `shadcn` CLI — dev-only tool, not in production bundle |
| LOW | `hono` | Timing comparison | Transitive via `shadcn` CLI — dev-only tool |

**Assessment:** No production-runtime vulnerabilities. The `xlsx` package is the only runtime concern but is used exclusively for admin-initiated Excel exports with trusted data.

---

## Summary of Fixes Applied

1. **`src/lib/parent-auth.ts`** — Removed hardcoded JWT secret fallback; now requires `PARENT_JWT_SECRET` or `AUTH_SECRET` env var
2. **`src/lib/actions/parent-users.ts`** — Excluded `passwordHash`/`token` from all query responses using Prisma `select`
3. **`src/lib/actions/parent-users.ts`** — Added minimum password length validation (6 chars) for create and reset
4. **`src/app/api/parent/messages/route.ts`** — Added rate limiting (20/min/IP)
5. **`src/app/api/parent/push-token/route.ts`** — Added rate limiting (30/min/IP)
6. **`next.config.ts`** — Added security response headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS)

## Remaining Recommendations

1. **Add Zod server-side validation** to all remaining server actions (employees, payments, medical, messages, assessments, food)
2. **Tighten Zod constraints** — add `.max()` to string fields, bounds-check numeric fields
3. **Production rate limiting** — replace in-memory store with Redis for multi-instance deployments
4. **File upload security** — implement proper validation when file uploads are built (Phase TBD)
5. **Consider Content-Security-Policy** — add CSP header once all inline styles/scripts are accounted for
6. **Monitor `xlsx` package** — consider replacing with a maintained alternative if a patched version is not released
