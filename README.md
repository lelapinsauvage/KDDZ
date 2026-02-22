# Garderie (KiddzOnline)

A daycare management system built with Next.js. Manage children, staff, daily reports, medical records, payments, messaging, and more.

## Prerequisites

Make sure you have these installed on your machine before starting:

| Tool | Version | How to install |
|------|---------|----------------|
| **Node.js** | v20 or higher | [https://nodejs.org](https://nodejs.org) (download the LTS version) |
| **pnpm** | v9 or higher | Run `npm install -g pnpm` after installing Node.js |
| **PostgreSQL** | v15 or higher | [https://www.postgresql.org/download](https://www.postgresql.org/download) or use [Neon](https://neon.tech) (free hosted Postgres) |

To verify your installations, open a terminal and run:

```bash
node -v    # should print v20.x.x or higher
pnpm -v    # should print 9.x.x or higher
```

## Step 1: Clone the repository

```bash
git clone https://github.com/lelapinsauvage/KDDZ.git
cd KDDZ
```

## Step 2: Install dependencies

```bash
pnpm install
```

This will download all the packages the project needs. It may take a minute or two.

## Step 3: Set up the database

You need a PostgreSQL database. You have two options:

### Option A: Use Neon (easiest, no local install needed)

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it looks like `postgresql://user:password@host/dbname?sslmode=require`)

### Option B: Use local PostgreSQL

1. Make sure PostgreSQL is running on your machine
2. Create a new database:
   ```bash
   createdb garderie
   ```
3. Your connection string will be: `postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/garderie`

## Step 4: Create the environment file

In the root of the project (the `KDDZ` folder), create a file called `.env.local`:

```bash
cp .env.local.example .env.local  # if example exists, otherwise create manually
```

Open `.env.local` in any text editor and add these lines:

```env
DATABASE_URL="postgresql://YOUR_USERNAME:YOUR_PASSWORD@YOUR_HOST/YOUR_DATABASE?sslmode=require"
AUTH_SECRET="any-random-string-here-make-it-long"
```

Replace the `DATABASE_URL` value with your actual connection string from Step 3.

For `AUTH_SECRET`, you can generate a random one by running:

```bash
openssl rand -base64 32
```

## Step 5: Set up the database tables

This creates all the tables in your database:

```bash
pnpm prisma migrate deploy
```

If this is a fresh database and there are no migrations yet, run instead:

```bash
pnpm prisma db push
```

## Step 6: Generate the Prisma client

```bash
pnpm prisma generate
```

## Step 7: Seed the database with test data

This fills the database with sample data (children, classes, staff, reports, etc.) so you can explore the app:

```bash
pnpm prisma db seed
```

## Step 8: Start the app

```bash
pnpm dev --port 3333
```

Open your browser and go to: **[http://localhost:3333](http://localhost:3333)**

## Step 9: Log in

Use these credentials to log in:

| Email | Password | Role |
|-------|----------|------|
| `admin@garderie.com` | `password123` | Admin |
| `teacher@garderie.com` | `password123` | Teacher |

## Quick reference: All commands

```bash
# Install everything
pnpm install

# Set up database
pnpm prisma db push
pnpm prisma generate
pnpm prisma db seed

# Run the app
pnpm dev --port 3333

# Other useful commands
pnpm build          # Build for production
pnpm start          # Start production server
pnpm lint           # Check code for errors
pnpm prisma studio  # Open database viewer in browser
```

## Troubleshooting

### "Cannot connect to database"
- Double-check your `DATABASE_URL` in `.env.local`
- Make sure PostgreSQL is running (if local)
- Make sure you copied the full connection string including `?sslmode=require` (if using Neon)

### "Module not found" errors
- Run `pnpm install` again
- Run `pnpm prisma generate` again

### Port 3333 is already in use
- Either stop whatever is using port 3333, or use a different port:
  ```bash
  pnpm dev --port 3000
  ```

### Seed fails with "unique constraint" error
- The seed script cleans the database before inserting. If it still fails, reset the database:
  ```bash
  pnpm prisma db push --force-reset
  pnpm prisma db seed
  ```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL with Prisma 7 ORM
- **Auth:** Auth.js v5
- **Charts:** Recharts
- **Tables:** TanStack Table v8
- **PDF:** @react-pdf/renderer
