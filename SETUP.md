# KiddzOnline (Garderie) — Setup Guide

This file is for Claude (AI assistant) to follow when helping set up this project on a new machine.

---

## Prerequisites

- **Node.js** v20+ (v25 recommended)
- **pnpm** v10+ — install with `npm install -g pnpm` if not present
- **Git** with access to the private repo

---

## 1. Clone the repo

```bash
git clone https://github.com/lelapinsauvage/KDDZ.git garderie
cd garderie
```

The default branch is `main` — this is the correct and up-to-date branch.

---

## 2. Install dependencies

```bash
pnpm install
```

---

## 3. Set up environment variables

Create a `.env` file in the project root with these two variables:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
AUTH_SECRET="<random-secret-string>"
```

### Where to get these values:

- **DATABASE_URL**: This is a Neon Serverless Postgres connection string. Ask Karim for the connection string, or if you have access to the Neon dashboard, find it under the project's connection details. The database is hosted on Neon (`*.neon.tech`).
- **AUTH_SECRET**: Generate one with `openssl rand -base64 32` or ask Karim for the shared value.

---

## 4. Generate Prisma client

The Prisma client is NOT committed to the repo — it must be generated locally:

```bash
pnpm prisma generate
```

This reads `prisma/schema.prisma` and outputs the generated client to `src/generated/prisma/`.

---

## 5. Sync your local database (if needed)

If you're connecting to the **same shared Neon database** as Karim, the schema is already up to date — skip this step.

If you're using a **fresh/separate database**, push the schema:

```bash
pnpm prisma db push
```

This applies all tables, enums, and indexes from `prisma/schema.prisma` to your database without migrations.

---

## 6. Start the dev server

```bash
pnpm dev --port 3333
```

Open **http://localhost:3333** in your browser.

---

## 7. Pulling latest changes

When Karim pushes new code:

```bash
git pull origin main
pnpm install          # in case dependencies changed
pnpm prisma generate  # in case schema changed
pnpm prisma db push   # in case new fields/tables were added (only if using shared DB, Karim may have already pushed the schema)
```

A safe one-liner to run every time you pull:

```bash
git pull origin main && pnpm install && pnpm prisma generate
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind v4, shadcn/ui |
| State | React Hook Form, Zustand (minimal) |
| ORM | Prisma 7 |
| Database | PostgreSQL (Neon Serverless) |
| Auth | Auth.js v5 |
| Package Manager | pnpm |

---

## Project Structure (key directories)

```
src/
  app/              → Next.js App Router pages & layouts
  components/       → React components (organized by feature)
  lib/
    actions/        → Server actions (form submissions, CRUD)
    validations/    → Zod schemas for forms
  generated/prisma/ → Auto-generated Prisma client (do NOT edit)
prisma/
  schema.prisma     → Database schema (single source of truth)
```

---

## Common Issues

### "Cannot find module '@/generated/prisma'"
Run `pnpm prisma generate` — the client needs to be generated locally after every clone or schema change.

### Port 3333 already in use
Kill the existing process: `lsof -ti:3333 | xargs kill -9` then restart.

### Prisma schema drift
If you see warnings about schema drift after pulling, run `pnpm prisma db push` to sync the database.
