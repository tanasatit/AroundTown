# PRP-013: Production Deployment

## Problem
The app is fully built and tested locally but not yet live. The team cannot use it until it is deployed to a public URL. The stack (Next.js + Supabase) maps cleanly to Vercel + Supabase, which is already partially set up (GitHub repo exists at `tanasatit/AroundTown`, Supabase database already connected locally).

## Current State
- **GitHub**: `https://github.com/tanasatit/AroundTown.git` — remote exists
- **Database**: Supabase PostgreSQL — already connected, schema pushed (`prisma db push` done)
- **Local env vars**: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- **Vercel**: Not yet connected to this repo
- **Build**: Passes cleanly (`npm run build`)

## Scope
- **In scope**: GitHub Actions CI workflow, push code to GitHub, connect Vercel, set environment variables, verify production works
- **Out of scope**: Custom domain setup (optional step at end), monitoring/alerts

---

## Requirements

### FR-1: GitHub Actions CI Workflow
A CI workflow runs on every push to `main` and every pull request. It must:
- Install dependencies
- Run `npx tsc --noEmit` (type check)
- Run `npm run build`
- Block merge/deploy if any step fails

Workflow file: `.github/workflows/ci.yml`

### FR-2: Code on GitHub
All current code pushed to `main` branch on `tanasatit/AroundTown`.

### FR-3: Vercel Project
- New Vercel project connected to the GitHub repo
- Framework preset: **Next.js** (auto-detected)
- Build command: `npm run build` (default)
- Output directory: `.next` (default)

### FR-4: Environment Variables in Vercel
All 4 env vars set in Vercel project settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase connection pooling URL (Transaction mode, port 6543) |
| `DIRECT_URL` | Supabase direct connection URL (port 5432) — used by Prisma migrations |
| `NEXTAUTH_URL` | Production URL, e.g. `https://aroundtown.vercel.app` |
| `NEXTAUTH_SECRET` | Same secret as local (or generate a new one) |

> ⚠️ `NEXTAUTH_URL` must be the **actual Vercel URL** — get it after first deploy, then update the variable and redeploy.

### FR-5: Production Build Passes
Vercel deployment completes without errors.

### FR-6: Smoke Test on Production
After deploy, manually verify the critical path works on the live URL.

---

## Pre-Deployment Checklist

### Code
- [ ] `npm run build` passes locally with no errors
- [ ] No `console.log` with sensitive data in committed code
- [ ] `.env` is in `.gitignore` — confirmed ✅

### Supabase
- [ ] Database schema is up to date (`prisma db push` done) ✅
- [ ] Confirm Supabase project is on a plan that supports the connection count Vercel needs (free tier: max 2 direct connections — use **Transaction mode** URL for `DATABASE_URL`)

---

## Deployment Steps

### Step 1: Add GitHub Actions CI Workflow
**File**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
```

Then add the same 4 env vars as **GitHub Secrets**:
- GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
- Add: `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`

> The CI build needs real env vars because Prisma generates types from the DB connection and Next.js validates env at build time.

### Step 2: Push Code to GitHub
```bash
git add -A
git commit -m "feat: complete app — ready for production"
git push origin main
```
Verify the CI workflow passes in GitHub → **Actions** tab before continuing.

### Step 3: Create Vercel Project
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import from GitHub → select `tanasatit/AroundTown`
3. Framework: **Next.js** (auto-detected)
4. **Do NOT deploy yet** — set env vars first (Step 4)

### Step 4: Set Environment Variables
In Vercel project → **Settings → Environment Variables**, add all 4:

```
DATABASE_URL      = <Supabase Transaction mode URL — port 6543>
DIRECT_URL        = <Supabase Direct URL — port 5432>
NEXTAUTH_URL      = https://<your-vercel-url>.vercel.app  (placeholder for now)
NEXTAUTH_SECRET   = <copy from local .env>
```

**Where to find Supabase URLs:**
- Supabase Dashboard → Project → **Settings → Database → Connection string**
- Transaction mode (pooler): use for `DATABASE_URL`
- Direct connection: use for `DIRECT_URL`

### Step 5: Deploy
- Click **Deploy** in Vercel
- Wait for build to complete (~2 min)
- Copy the assigned URL (e.g. `https://around-town-abc123.vercel.app`)

### Step 6: Fix NEXTAUTH_URL
1. Go back to Vercel → Settings → Environment Variables
2. Update `NEXTAUTH_URL` to the actual URL from Step 5
3. **Redeploy** (Vercel → Deployments → Redeploy latest)

### Step 7: Smoke Test (Production)
Open the live URL and verify:
- [ ] `/` redirects to `/login` when not authenticated
- [ ] Login with valid credentials → redirected to dashboard
- [ ] Dashboard loads stats (may be empty if no prod data)
- [ ] Navigate to `/collections/new` → form loads
- [ ] Submit a test collection → saved successfully
- [ ] Test collection appears in `/collections`
- [ ] `/reports` loads without error
- [ ] Logout → redirected to `/login`

### Step 8 (Optional): Custom Domain
In Vercel → Settings → Domains → add your domain and follow DNS instructions.

---

## Files to Create / Modify
None — `prisma/schema.prisma` already has `directUrl = env("DIRECT_URL")` ✅

---

## Potential Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Build fails on Vercel | Missing env var | Check all 4 vars are set in Vercel |
| `PrismaClientInitializationError` | Wrong `DATABASE_URL` | Use Transaction mode URL (port 6543) for `DATABASE_URL` |
| Login redirects to `localhost` | `NEXTAUTH_URL` not updated | Update to production URL + redeploy |
| `NEXTAUTH_SECRET` error | Secret not set | Add `NEXTAUTH_SECRET` to Vercel env vars |
| Supabase connection limit | Too many direct connections | Ensure `DATABASE_URL` uses pooler (port 6543) |

---

## Acceptance Criteria

- [ ] Code pushed to `main` on GitHub
- [ ] Vercel deployment succeeds (green checkmark)
- [ ] All 4 env vars set correctly in Vercel
- [ ] `NEXTAUTH_URL` matches the actual production URL
- [ ] Smoke test passes — login, create collection, view reports, logout
- [ ] No server errors in Vercel Function Logs after smoke test

---

## Estimated Time
**1–2 hours**

---

**Previous PRP**: PRP-012 (E2E Testing) ✅
**Next PRP**: PRP-014 (User Training & Documentation)
