# KiddzOnline — Infrastructure, Costs & Production Roadmap

> Everything needed to go from "works on my machine" to "500 nurseries in production."

---

## Table of Contents

1. [Tech Stack Decisions](#1-tech-stack-decisions)
2. [Data Volume Estimates](#2-data-volume-estimates)
3. [Infrastructure Services](#3-infrastructure-services)
4. [Cost Breakdown — 500 Nurseries](#4-cost-breakdown)
5. [Hosting Options](#5-hosting-options)
6. [Revenue vs Cost](#6-revenue-vs-cost)
7. [What's Not Built Yet](#7-whats-not-built-yet)
8. [Production Roadmap](#8-production-roadmap)
9. [Scaling Considerations](#9-scaling-considerations)

---

## 1. Tech Stack Decisions

### Database Interface: Prisma (keep it)

Already deeply integrated — 59 models, 28 action files, generated TypeScript types everywhere. Prisma is the right tool for this project:

- **Parameterized queries** — SQL injection protection built in. User input never touches raw SQL.
- **Type safety** — TypeScript types generated from schema. Compiler catches wrong field names, missing relations, type mismatches.
- **Migration support** — `prisma migrate` creates versioned migration files for safe production deploys.
- **Neon-native** — Prisma's `@prisma/adapter-pg` works directly with Neon's connection pooler.
- **Multi-tenancy compatible** — The `requireOrg()` enforcement layer (see DATABASE.md) sits on top of normal Prisma queries.

No reason to switch to Drizzle, Kysely, or raw SQL. The codebase is too deep into Prisma, and Prisma does everything we need.

### Database: Neon PostgreSQL (keep it)

Already in use. Neon provides:
- Serverless PostgreSQL (scales to zero when not in use)
- Autoscaling compute (handles traffic spikes)
- Branching (create database copies for testing/development)
- Point-in-time recovery (up to 30 days on paid plans)
- Row-Level Security support (needed for tenant isolation)
- Connection pooling via PgBouncer (built in)

### Framework: Next.js (keep it)

Already in use (Next.js 16, App Router, React 19). Provides:
- Server-side rendering for fast first loads
- Server Actions for secure data mutations (CSRF protection built in)
- API routes for parent portal
- Middleware for auth at the edge
- Static optimization for public pages
- `output: 'standalone'` for self-hosting flexibility

---

## 2. Data Volume Estimates

### Per nursery (average)

| Data type | Records/year | Avg row size | Annual size |
|-----------|-------------|-------------|-------------|
| Children | 150 (total, not per year) | 2 KB | 300 KB |
| Staff | 20 | 2 KB | 40 KB |
| Daily reports | 150 kids × 200 days | 500 B | 15 MB |
| Attendance | 150 kids × 200 days | 200 B | 6 MB |
| Medical records | ~500 | 500 B | 250 KB |
| Payments | ~1,800 (150 × 12) | 300 B | 540 KB |
| Messages | ~2,000 | 500 B | 1 MB |
| Settings, events, etc. | ~500 | 300 B | 150 KB |
| **Total per nursery** | | | **~24 MB/year** |

### At scale (500 nurseries)

| Metric | Year 1 | Year 3 | Year 5 |
|--------|--------|--------|--------|
| Total nurseries | 500 | 500 | 500 |
| Total rows | ~35M | ~100M | ~170M |
| Data size | ~12 GB | ~35 GB | ~60 GB |
| With indexes (~50% overhead) | ~18 GB | ~53 GB | ~90 GB |
| Total storage needed | **~20 GB** | **~55 GB** | **~95 GB** |

These are conservative estimates. PostgreSQL handles this volume trivially — it's designed for billions of rows. At 500 nurseries we're nowhere near any limits.

---

## 3. Infrastructure Services

### Required services

| Service | Purpose | Provider | Why this one |
|---------|---------|----------|-------------|
| **Database** | PostgreSQL | Neon | Already in use. Serverless, autoscaling, branching, PITR. |
| **Hosting** | Next.js app server | Vercel or VPS | See hosting comparison below |
| **File storage** | Photos, documents, contracts | Cloudflare R2 | Cheapest S3-compatible storage. No egress fees. |
| **Email** | Password resets, notifications, invites | Resend | Modern API, good free tier (3K emails/month), scales well. |
| **Push notifications** | Mobile/PWA alerts | Firebase (FCM) | Industry standard. Free. Works with PWA (Serwist already set up). |
| **Background jobs** | Cron: notifications, overdue checks, birthdays | Vercel Cron or Inngest | Depends on hosting choice. Vercel Cron is free on Pro. |
| **CDN + DNS** | Static assets, SSL, DDoS protection | Cloudflare | Free tier is generous. Global CDN. SSL auto-provisioned. |
| **Error monitoring** | Crash tracking, performance | Sentry | Best-in-class. Free tier: 5K events/month. |
| **Rate limiting** | Brute-force prevention | Upstash Redis | Serverless Redis. Free tier: 10K requests/day. |

### Optional services (add later)

| Service | Purpose | Provider | When |
|---------|---------|----------|------|
| **Analytics** | Usage tracking, engagement metrics | PostHog | After launch — understand how nurseries use the app |
| **Payments** | Subscription billing | Stripe | When monetizing — automate nursery billing |
| **SMS** | SMS notifications to parents | Twilio or local provider | After parent portal launch |
| **Uptime monitoring** | Alert if site goes down | BetterStack or UptimeRobot | At launch — free tier sufficient |

---

## 4. Cost Breakdown

### Neon database pricing

| Plan | Storage | Compute | Price | When to use |
|------|---------|---------|-------|-------------|
| Free | 0.5 GB | 191 hours/month | $0 | Development only |
| Launch | 10 GB | 300 hours/month | $19/mo | 0-100 nurseries |
| Scale | 50 GB | 750 hours/month, read replicas | $69/mo | 100-500 nurseries |
| Business | 500 GB | Unlimited compute | $700/mo | 500+ nurseries, compliance needs |

**For 500 nurseries:** Scale plan ($69/mo) covers year 1-2. Move to Business when approaching 50 GB.

### Monthly cost at 500 nurseries

| Service | Provider | Plan | Monthly |
|---------|----------|------|---------|
| Database | Neon | Scale | **$69** |
| Hosting | Vercel | Pro | **$20** |
| Email | Resend | Pro (50K emails/mo) | **$20** |
| File storage | Cloudflare R2 | Pay-as-you-go | **$5-15** |
| Push notifications | Firebase | Free | **$0** |
| Background jobs | Vercel Cron | Included in Pro | **$0** |
| CDN + DNS | Cloudflare | Free | **$0** |
| Error monitoring | Sentry | Team (50K events) | **$26** |
| Rate limiting | Upstash Redis | Free/Pay-as-you-go | **$0-10** |
| Domain | Any registrar | .com | **$1** |
| | | **TOTAL** | **$141-161/mo** |

### Cost at different scales

| Nurseries | Users | Monthly cost | Notes |
|-----------|-------|-------------|-------|
| 1-10 | ~200 | ~$20 | Free/Launch tiers everywhere |
| 10-50 | ~1,000 | ~$50 | Launch plan + Vercel free |
| 50-100 | ~2,000 | ~$90 | Scale plan needed |
| 100-500 | ~10,000 | ~$150 | Scale plan + Pro tiers |
| 500-1000 | ~20,000 | ~$800 | Business DB plan |

---

## 5. Hosting Options

### Option A: Vercel Pro ($20/month)

**Best for:** Getting started fast, zero devops.

```
Developer pushes to GitHub
  → Vercel auto-deploys in ~60 seconds
  → SSL, CDN, serverless functions all handled
  → Zero server management
```

**Pros:**
- Zero infrastructure management
- Automatic deploys from git
- Built-in CDN, SSL, preview deployments
- Cron jobs included (up to 2/day on free, unlimited on Pro)
- Edge middleware (auth runs at CDN edge — fast globally)

**Cons:**
- Can get expensive at very high traffic (serverless billing)
- Cold starts on serverless functions (~200-500ms first request)
- Vendor lock-in (though Next.js standalone mode provides an exit)

**Traffic capacity:**
- 10,000 users × 20 requests/day = 200K requests/day
- Vercel Pro handles this comfortably
- Bandwidth: ~50 GB/month at this scale (within 1 TB included)

### Option B: VPS / Railway / Fly.io ($20-40/month)

**Best for:** Predictable costs at scale, full control.

```
Developer pushes to GitHub
  → CI/CD pipeline builds Docker image
  → Deploys to VPS as a Node.js server
  → Runs 24/7 (not serverless)
```

**Providers and pricing:**

| Provider | Spec | Price | Notes |
|----------|------|-------|-------|
| Railway | 8 GB RAM, shared CPU | $20/mo | Easiest VPS. Git deploy. |
| Fly.io | 4 GB RAM, 2 shared CPU | $15/mo | Good for multi-region. |
| Hetzner | 8 GB RAM, 4 vCPU, dedicated | $7/mo | Cheapest. EU servers. Manual setup. |
| DigitalOcean | 8 GB RAM, 4 vCPU | $48/mo | Managed App Platform or droplet. |

**Pros:**
- Predictable monthly cost (no per-request billing)
- No cold starts (server is always running)
- Full control over the environment
- Cheaper at high scale

**Cons:**
- Need to set up Docker, CI/CD, SSL, process management
- Handle your own scaling (though a single 8 GB server handles 10K users easily)
- No built-in preview deployments

### Recommendation

**Start with Vercel Pro.** It removes all devops headaches so you can focus on the product. If monthly costs exceed ~$200-300 on Vercel, migrate to Railway or Fly.io. Next.js's `output: 'standalone'` mode makes migration straightforward.

---

## 6. Revenue vs Cost

```
Monthly infrastructure cost:    ~$150

Monthly revenue scenarios:

  500 nurseries × $20/mo  =  $10,000/mo  (98.5% margin)
  500 nurseries × $30/mo  =  $15,000/mo  (99.0% margin)
  500 nurseries × $50/mo  =  $25,000/mo  (99.4% margin)

  Even at just 50 nurseries × $30/mo = $1,500/mo (93% margin)
```

SaaS infrastructure costs are essentially a rounding error. The real costs are:
- **Your time** building and maintaining the product
- **Sales and marketing** to acquire nurseries
- **Support** helping nurseries onboard and use the system

For Lebanese market pricing context: nurseries pay staff $500-1500/month. A $30-50/month software subscription that saves hours of admin work daily is an easy sell.

---

## 7. What's Not Built Yet

### Tier 1 — Blocking for production launch

| # | Feature | What's missing | Effort | Dependencies |
|---|---------|---------------|--------|-------------|
| 1 | **Multi-tenancy** | Org scoping, enforcement layer, RLS | 3 days | See DATABASE.md |
| 2 | **File uploads** | Every attachment section shows "Coming soon". Need R2 integration, upload API, file viewer. | 2-3 days | Cloudflare R2 account |
| 3 | **Email service** | No emails sent — password resets, invitations, notifications all need a transport. | 1 day | Resend account |
| 4 | **Background jobs** | Notification rules configured but nothing fires. Need cron to check: birthdays, overdue payments, missing reports, insurance/contract expiry, vaccination due dates. | 2-3 days | Email service (#3) |
| 5 | **DB migrations** | Currently `prisma db push` (dev only). Production needs versioned migration files. | 1 day | None |
| 6 | **Rate limiting** | No brute-force protection on login. | 0.5 day | Upstash account |
| 7 | **Error monitoring** | No crash tracking. If something breaks in production, nobody knows. | 0.5 day | Sentry account |
| 8 | **Onboarding flow** | No sign-up page. No setup wizard. No way for nurseries to self-serve. | 2 days | Multi-tenancy (#1) |

**Tier 1 total: ~12-14 days**

### Tier 2 — Important, needed soon after launch

| # | Feature | What's missing | Effort |
|---|---------|---------------|--------|
| 9 | **Role-based access control** | Pages don't enforce roles. A teacher could visit admin pages. | 2 days |
| 10 | **Mobile responsiveness** | Desktop-first. Nursery staff use phones/tablets daily. | 2-3 days |
| 11 | **Parent portal UI** | 13 API routes exist, no parent-facing pages. Parents are a key selling point. | 5-7 days |
| 12 | **Audit logging** | No record of who changed what. Needed for compliance and disputes. | 1-2 days |
| 13 | **Pagination at scale** | Some actions fetch all records. Fine for 1 nursery, breaks at 500. | 1-2 days |
| 14 | **Data export** | Nurseries should be able to download their own data (compliance). | 1 day |

**Tier 2 total: ~12-17 days**

### Tier 3 — Nice to have, build over time

| # | Feature | What's missing | Effort |
|---|---------|---------------|--------|
| 15 | Full i18n (Arabic/French/English) | Only hardcoded Arabic compliance labels. No translation framework. | 3-5 days |
| 16 | Global search | Command palette exists (cmdk) but not wired to real search. | 1-2 days |
| 17 | Platform analytics dashboard | Monitor nursery usage, churn, engagement. For the platform owner. | 3-5 days |
| 18 | Stripe billing | Automate subscription payments from nurseries. | 2-3 days |
| 19 | Custom subdomains | nurseryname.kiddzoline.com per tenant. | 1-2 days |
| 20 | Legacy data import | Import from Excel/paper for onboarding nurseries. | 2-3 days |
| 21 | Testing | Zero test files. At minimum: auth, tenant isolation, payments. | 3-5 days |
| 22 | SMS notifications | For parent alerts (pickup reminders, emergencies). | 1-2 days |

**Tier 3 total: ~16-27 days**

---

## 8. Production Roadmap

### Week 1 — Foundation

```
Day 1-3:  Multi-tenancy (schema + enforcement + auth)
            → DATABASE.md Phase 1-3
Day 4:    DB migrations setup (prisma migrate)
Day 5:    Error monitoring (Sentry) + rate limiting (Upstash)
```

### Week 2 — Missing Infrastructure

```
Day 1-2:  File uploads (Cloudflare R2 integration)
            → Upload API, file viewer, wire into all "Coming soon" sections
Day 3:    Email service (Resend)
            → Password reset, staff invitation emails
Day 4-5:  Background jobs / cron
            → Notification engine: evaluate rules, send email/push
```

### Week 3 — Security & UX

```
Day 1-2:  Role-based access control
            → Middleware checks, page-level guards
Day 3:    Onboarding flow
            → Sign-up page, setup wizard
Day 4-5:  Mobile responsiveness pass
            → Test all pages on 375px, fix layouts
```

### Week 4 — Hardening

```
Day 1:    RLS policies (DATABASE.md Phase 4)
Day 2:    Tenant isolation testing (create 2 test orgs, try to break it)
Day 3:    Pagination fixes for high-data queries
Day 4:    Audit logging setup
Day 5:    Final QA, deploy to production
```

### Post-launch (Weeks 5-8)

```
Week 5-6: Parent portal UI (5-7 days)
Week 7:   Full testing suite
Week 8:   i18n + polish
```

---

## 9. Scaling Considerations

### What happens as we grow

| Nurseries | What changes | Action needed |
|-----------|-------------|--------------|
| **1-50** | Nothing. Free/Launch tiers handle everything. | None |
| **50-200** | Database needs more storage. | Upgrade Neon to Scale ($69/mo). |
| **200-500** | More concurrent users. Slightly slower queries. | Add database indexes on `(organizationId, createdAt)`. Consider read replica for dashboard queries. |
| **500-1000** | Database storage exceeds 50 GB. | Upgrade Neon to Business ($700/mo). Add connection pooling. |
| **1000+** | Application server under load. | Move to VPS cluster or add Vercel Enterprise. Consider regional deployments. |

### Database indexes to add at scale

```sql
-- Composite indexes for tenant-scoped queries
CREATE INDEX idx_children_org_active ON children (branch_id, is_active);
CREATE INDEX idx_daily_reports_date ON daily_reports (report_date, child_id);
CREATE INDEX idx_payments_status ON payments (status, child_id);
CREATE INDEX idx_users_org ON users (organization_id, is_active);

-- These prevent full table scans when filtering by org + time
```

### When to consider separating services

At 1000+ nurseries, you might split:
- **Heavy reports** (PDF generation, Excel exports) → separate worker service
- **Background jobs** → dedicated queue worker (not cron)
- **File processing** (image resize, doc scanning) → serverless functions
- **Real-time features** (chat, live notifications) → separate WebSocket server

This is years away. Don't premature-optimize. The current monolith architecture handles 500 nurseries without breaking a sweat.

---

## Quick Reference

### Accounts to create before launch

| Service | URL | Purpose | Free tier? |
|---------|-----|---------|-----------|
| Neon | neon.tech | PostgreSQL database | Yes (0.5 GB) |
| Vercel | vercel.com | Hosting | Yes (hobby) |
| Cloudflare | cloudflare.com | CDN, DNS, R2 storage | Yes |
| Resend | resend.com | Email delivery | Yes (3K/month) |
| Firebase | firebase.google.com | Push notifications | Yes |
| Sentry | sentry.io | Error monitoring | Yes (5K events) |
| Upstash | upstash.com | Redis (rate limiting) | Yes (10K/day) |
| GitHub | github.com | Code repository | Yes |

### Environment variables needed

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require

# Auth
AUTH_SECRET=random-32-char-secret
AUTH_URL=https://kiddzoline.com

# File Storage
R2_ACCOUNT_ID=cloudflare-account-id
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=kiddzoline-files
R2_PUBLIC_URL=https://files.kiddzoline.com

# Email
RESEND_API_KEY=re_...

# Push Notifications
FIREBASE_PROJECT_ID=kiddzoline
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Error Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Rate Limiting
UPSTASH_REDIS_URL=https://...upstash.io
UPSTASH_REDIS_TOKEN=...
```

### Deploy checklist

```
□ All env vars set in production
□ Neon database on Scale plan
□ prisma migrate deploy (not db push)
□ Sentry configured and tested
□ Rate limiting on /api/auth routes
□ RLS policies enabled
□ Cloudflare DNS pointing to Vercel/VPS
□ SSL certificate active
□ Error monitoring verified (trigger test error)
□ Backup strategy confirmed (Neon PITR enabled)
□ First Organization + Admin User seeded
□ Onboarding flow tested end-to-end
```
