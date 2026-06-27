# 8th Ledger OS

8th Ledger OS is a Next.js and Prisma application for pooled real-world asset ownership. It models the full lifecycle of an asset-backed ownership platform: users fund pools, receive PAC ownership records, govern assets through halls, track revenue, handle marketplace activity, run KYC-gated wallet flows, and maintain audit/accounting records.

The current app is a single Next.js application: the frontend and backend API routes are served by the same `web` service. PostgreSQL is the production database target, and a separate worker service is scaffolded for scheduled jobs.

## Features

- User authentication with ledger IDs, password hashing, session cookies, and TOTP support.
- KYC tiers for identity-gated actions and withdrawal limits.
- Wallet deposits, withdrawals, and internal balance tracking.
- Asset pools for real-world asset funding campaigns.
- PAC ownership records generated from pool ownership.
- Halls for asset governance, proposals, voting, members, treasury, operations, and documents.
- Marketplace flows for ownership listings and inventory sales.
- Dividend and revenue-distribution logic.
- Dormancy protocol and scheduled dormancy checks.
- Forge/IHCP operational modules for staffing, payroll, and internal hall contributions.
- SRI/AHGI scoring and dynamic valuation support.
- Audit trail and immutable ledger-entry scaffolding for money movement.

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Prisma 5
- PostgreSQL 16
- Tailwind CSS
- SWR
- Zod
- Docker Compose

## Project Structure

```txt
app/                  Next.js pages, layouts, and API routes
components/           UI and domain components
components/ui/        Shared UI primitives
hooks/                Client-side data and state hooks
lib/                  Shared domain helpers and low-level utilities
server/accounting/    Ledger-entry and accounting primitives
server/http/          API response and pagination helpers
server/jobs/          Worker and scheduled-job entry points
server/services/      Server-side business services
prisma/               Prisma schema, migrations, and seed scripts
docker/               Docker support documentation
public/               Static public assets
```

## Prerequisites

- Node.js 20+
- npm
- Docker and Docker Compose

## Environment Variables

All secrets must be supplied through environment variables. Do not write real credentials directly in `compose.yml`, source files, or committed documentation.

Create a local environment file:

```bash
cp .env.example .env
```

Then replace every placeholder with real local values.

Required variables:

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER` | PostgreSQL username used by Docker |
| `POSTGRES_PASSWORD` | PostgreSQL password used by Docker |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_PORT` | Host port mapped to Postgres, usually `5432` |
| `DATABASE_URL` | Prisma connection URL for host-run commands |
| `SESSION_SECRET` | Cookie/JWT signing secret |
| `TOTP_ENCRYPTION_KEY` | TOTP/temp-token signing secret |
| `CRON_SECRET` | Bearer token for worker-triggered cron endpoints |
| `NEXT_PUBLIC_APP_URL` | Public web app URL |
| `WORKER_APP_URL` | Internal URL used by worker, usually `http://web:3000` in Docker |

Optional payment variables:

| Variable | Purpose |
| --- | --- |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `PAYSTACK_SECRET_KEY` | Paystack secret key |
| `PAYSTACK_WEBHOOK_IPS` | Optional webhook IP allowlist |

## Docker Setup

Start the full local stack:

```bash
docker compose -f compose.yml up --build
```

Services:

- `postgres`: PostgreSQL 16 with a persistent Docker volume.
- `web`: Next.js app and API routes.
- `worker`: scheduled job runner.

`compose.yml` reads Postgres credentials and application secrets from `.env`. It intentionally does not contain plaintext database passwords.

Stop services:

```bash
docker compose -f compose.yml down
```

Remove the local database volume:

```bash
docker compose -f compose.yml down -v
```

## Local Development Without Docker

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npm run db:generate
```

Run migrations:

```bash
npm run db:migrate
```

Start development server:

```bash
npm run dev
```

## Database

The Prisma datasource is PostgreSQL.

Useful commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:deploy
npm run db:studio
npm run db:seed
```

Production seed:

```bash
npm run db:seed
```

The production seed initializes required protocol settings only.

Development fixtures:

```bash
npm run db:seed:dev
```

Do not run development fixture seeds in production.

Migration notes:

- Active migrations start at `prisma/migrations/00000000000000_postgres_baseline/`.
- Prior SQLite migration history is archived in `prisma/migrations_sqlite_archive/`.

## Worker Jobs

The worker entry point is:

```txt
server/jobs/worker.ts
```

Current scheduled job scaffold:

- Dormancy check through `/api/dormancy/check` using `CRON_SECRET`.

Future jobs should be added as small named jobs and should call server services or cron-protected API routes. Candidate jobs include valuation recalculation, dividend schedules, audit integrity checks, marketplace escrow releases, and notification generation.

Run worker locally:

```bash
npm run worker
```

## Scripts

```bash
npm run dev          # Start Next.js in development
npm run build        # Build the app
npm run start        # Start production server
npm run lint         # Run Next lint
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Create/apply development migrations
npm run db:deploy    # Apply production migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Production-safe seed
npm run db:seed:dev  # Development fixture seed
npm run worker       # Run scheduled worker
```

## Architecture Guidelines

API routes should stay thin:

1. Authenticate and authorize.
2. Parse and validate input.
3. Call a server service.
4. Return a normalized response.

Business rules should live in `server/services` or domain-specific modules, not directly in pages. Database writes should be transactional where money, ownership, or governance state changes.

Money movement should use shared accounting utilities and write immutable `ledger_entries`. Avoid direct wallet balance mutations in route handlers.

## Security Notes

- Never commit real `.env` values.
- Keep all secrets in environment variables.
- Rotate any secret that has ever been exposed in source control or chat.
- Do not reintroduce hardcoded demo credentials.
- Keep dev fixture data isolated behind `npm run db:seed:dev`.
- Protect cron endpoints with `CRON_SECRET`.
- Use strong random values for `SESSION_SECRET`, `TOTP_ENCRYPTION_KEY`, `CRON_SECRET`, and `POSTGRES_PASSWORD`.

Generate local secrets with:

```bash
openssl rand -base64 48
```

## Current Status

The project has been moved toward a production structure, but some legacy pages still contain mock display data and lint/type issues. Before a production deployment, finish replacing page-level mock data with API-backed data and make `npm run build` pass cleanly.

