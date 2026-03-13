# PRP-016: Testing, CI/CD & Performance

## Problem

The project ships with zero automated tests, a minimal CI pipeline (type-check + build only), and noticeable slowness on both localhost and Vercel production. This PRP covers what to add and why.

---

## Part 1 — Testing Strategy

### Current State
- PRP-012 was **manual testing only** (browser walkthrough)
- No test files, no test runner configured
- CI does: `tsc --noEmit` + `npm run build` — nothing more

### Decision: What to Test (and What to Skip)

| Layer | Decision | Reason |
|-------|----------|--------|
| Business logic (calc functions) | **Test** (Vitest unit tests) | Pure functions, high business value, zero setup |
| API routes | **Test** (Vitest + fetch mocking) | Catches regression in save/calculate logic |
| React components | **Skip for now** | App is feature-frozen; ROI is low |
| E2E (Playwright) | **Skip for now** | Heavy setup, project is personal/single-user |

> **Rule**: Test the math, not the UI. The core risk is a wrong calculation silently shipping.

### What to Test

#### 1. Business Calculation Logic
File: `lib/calculations.ts` (create if not extracted yet, or test inline)

Functions to cover:
- `postcardsSold = coins ÷ 4`
- `revenue = postcardsSold × 40`
- `cost = postcardsSold × costPerPostcard (13.766)`
- `profit = revenue - cost`
- Exchange box balance check (sum === 12,000)
- Edge cases: 0 coins, non-divisible by 4

#### 2. API Route Logic
- `POST /api/collections` — valid payload saves, duplicate returns 409
- `GET /api/stats` — returns correct aggregates
- `POST /api/collections` with invalid data — returns 400

### Test Setup

**Runner**: Vitest (lighter than Jest, native ESM, works with Next.js 15)

Install:
```bash
npm install -D vitest @vitejs/plugin-react
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
})
```

`package.json` scripts to add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

### Test Files to Create

```
/tests
  /unit
    calculations.test.ts     ← pure math functions
    exchange-balance.test.ts ← exchange box validation
  /api
    collections.test.ts      ← API route logic (no DB, mock Prisma)
```

---

## Part 2 — CI/CD Improvements

### Current CI (ci.yml)
```
checkout → setup-node → npm ci → tsc --noEmit → npm run build
```

Problems:
- No lint step
- No tests (there are none yet — chicken-and-egg)
- Build requires real `DATABASE_URL` (Prisma generate needs it)
- No separate jobs, one failure stops everything

### Target CI Pipeline

```
┌─────────────────────────────────────────────┐
│  On push/PR to main                         │
├──────────────┬──────────────┬───────────────┤
│  lint        │  typecheck   │  test         │
│  (eslint)    │  (tsc)       │  (vitest)     │
└──────┬───────┴──────┬───────┴───────┬───────┘
       └──────────────▼───────────────┘
                   build
              (only if all pass)
```

### Updated ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test

  build:
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

**Key changes:**
- Parallel jobs (lint/typecheck/test run simultaneously)
- Build only runs when all 3 pass
- Tests run in CI without a real DB (mock Prisma)

---

## Part 3 — Performance Analysis & Fixes

### Diagnosis: Why Is It Slow?

#### Root Causes

| # | Cause | Impact | Where |
|---|-------|--------|-------|
| 1 | **Prisma cold connections on Vercel** | +500–2000ms | Every serverless API call |
| 2 | **No query result caching** | Repeated identical DB hits | Dashboard stats, reports |
| 3 | **Stats computed fresh on every page load** | Blocking render | Dashboard |
| 4 | **Recharts bundle is large** | +~400kb JS | First load |
| 5 | **No `revalidate` on route segments** | No Next.js page cache | All pages |
| 6 | **No DB indexes on common queries** | Slow aggregations | History table, reports |

#### How to Confirm Slowness

```bash
# Check bundle sizes
npm run build
# Look for "First Load JS" in output — anything >200kb per route is a flag

# Locally: measure DB query time
# Add this temporarily to any lib function:
console.time('query')
const result = await prisma.collection.findMany(...)
console.timeEnd('query')
```

---

### Fix 1 — Prisma Connection Pooling (Biggest Win)

**Problem**: Vercel runs serverless functions. Each cold start opens a new Prisma connection to Supabase PostgreSQL. With many concurrent requests, connection limits are hit. Supabase has pgbouncer on port `6543`.

**Fix**: Use the correct Supabase URLs in `.env`

```env
# .env (already partially set up)
DATABASE_URL="postgresql://...@db.xxxx.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@db.xxxx.supabase.co:5432/postgres"
```

`prisma/schema.prisma` — verify this is set:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // pgbouncer (port 6543) — for queries
  directUrl = env("DIRECT_URL")        // direct (port 5432) — for migrations
}
```

Add `?pgbouncer=true&connection_limit=1` to DATABASE_URL if not present.

**Also add** to `lib/prisma.ts` (create if not exists):
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```
This prevents creating a new client on every hot-reload in dev.

---

### Fix 2 — Cache Dashboard Stats (Next.js `unstable_cache`)

**Problem**: Dashboard stats recalculate from DB on every page visit.

**Fix**: Wrap expensive DB calls with Next.js cache that revalidates after a collection is saved.

In `lib/stats.ts` (or wherever `getDashboardStats` lives):
```ts
import { unstable_cache } from 'next/cache'

export const getDashboardStats = unstable_cache(
  async () => {
    // existing DB queries here
  },
  ['dashboard-stats'],
  {
    revalidate: 300,  // revalidate every 5 min
    tags: ['collections'],  // also revalidated on demand
  }
)
```

Then in `app/api/collections/route.ts` (POST handler), after a successful save:
```ts
import { revalidateTag } from 'next/cache'

revalidateTag('collections')  // clears cached stats immediately
```

---

### Fix 3 — Add `revalidate` to Route Segments

In each page that reads from DB, add at the top:

```ts
// app/(dashboard)/page.tsx
export const revalidate = 300  // 5 minutes

// app/(dashboard)/collections/page.tsx
export const revalidate = 60   // 1 minute (history changes more often)

// app/(dashboard)/reports/page.tsx
export const revalidate = 300  // 5 minutes
```

This tells Next.js to cache the full page render and only revalidate on schedule or tag invalidation.

---

### Fix 4 — Lazy Load Recharts

**Problem**: Recharts (~400kb) is loaded on every page including collections and reports, even when not rendered.

**Fix**: Dynamic import with `ssr: false` on chart components.

```ts
// In the dashboard page component
import dynamic from 'next/dynamic'

const RevenueChart = dynamic(() => import('@/components/charts/revenue-chart'), {
  ssr: false,
  loading: () => <div className="h-48 animate-pulse bg-muted rounded" />,
})
```

This defers Recharts loading until the chart is actually rendered in the browser.

---

### Fix 5 — Verify DB Indexes

The current schema has indexes, but verify they cover the most common query patterns.

In `prisma/schema.prisma`, confirm:
```prisma
model Collection {
  @@index([collectionDate])
  @@index([weekNumber])
  @@index([machineLocation])
  // Add composite for common filters:
  @@index([collectionDate, machineLocation])
}
```

Run migration if indexes are missing:
```bash
npx prisma migrate dev --name add-composite-indexes
```

---

### Fix 6 — Next.js Config Optimizations

Update `next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', '@radix-ui/react-icons'],
  },
  // Enable compression
  compress: true,
}

export default nextConfig
```

`optimizePackageImports` tree-shakes icon libraries — lucide-react alone can be 200kb+ without this.

---

## Implementation Order

1. **Fix 1** (pgbouncer + Prisma singleton) — do this first, biggest Vercel speedup
2. **Fix 6** (next.config.ts) — 5 min change, immediate bundle win
3. **Fix 4** (lazy load charts) — dev experience + first-load speed
4. **Fix 2 + 3** (caching) — reduces DB hits, requires testing after
5. **Fix 5** (indexes) — check if missing, add migration
6. **Tests** — write unit tests for calculations
7. **CI** — update ci.yml with parallel jobs + test step

---

## Acceptance Criteria

### Performance
- [ ] `npm run build` shows First Load JS < 200kb for dashboard route
- [ ] Vercel function cold start under 1s (measure via Vercel dashboard → Functions tab)
- [ ] Dashboard page loads in < 1.5s on production (Chrome DevTools → Network → DOMContentLoaded)
- [ ] `?pgbouncer=true` in DATABASE_URL confirmed

### Testing
- [ ] `npm test` passes with at least 10 unit tests covering calculation logic
- [ ] Tests run without a real database (Prisma mocked)

### CI/CD
- [ ] CI runs lint, typecheck, and test in parallel
- [ ] Build step only runs after all 3 pass
- [ ] No hardcoded secrets in ci.yml (all via GitHub secrets)

---

## Files to Create / Modify

| File | Action |
|------|--------|
| `vitest.config.ts` | Create |
| `tests/unit/calculations.test.ts` | Create |
| `tests/unit/exchange-balance.test.ts` | Create |
| `lib/prisma.ts` | Create or update (singleton pattern) |
| `lib/stats.ts` | Update (add `unstable_cache`) |
| `app/(dashboard)/page.tsx` | Update (add `revalidate`) |
| `app/(dashboard)/collections/page.tsx` | Update (add `revalidate`) |
| `app/(dashboard)/reports/page.tsx` | Update (add `revalidate`) |
| `app/api/collections/route.ts` | Update (add `revalidateTag`) |
| `next.config.ts` | Update (optimizePackageImports, compress) |
| `.github/workflows/ci.yml` | Update (parallel jobs + test) |
| `package.json` | Update (add test scripts) |

---

**Previous PRP**: PRP-015 (Machine Management) ✅
**Status**: Draft — ready for review