# PRP-012: End-to-End Testing

## Problem
All features are built but have not been tested together as a complete user workflow. Before deploying to production, every user-facing flow must be manually verified to catch bugs, broken calculations, or UX issues that unit checks miss.

## Scope
- **In scope**: Manual testing of all workflows listed below, bug fixes found during testing
- **Out of scope**: Automated test suites (Playwright, Jest), load testing, security penetration testing

## How to Test
Run the dev server locally:
```
npm run dev
```
Open `http://localhost:3000` in a browser. Use a real (or seeded) database connected via `.env`.

---

## Test Environment Setup

Before testing, ensure:
- [ ] Dev server running (`npm run dev`)
- [ ] Database connected and migrated (`npx prisma db push` if needed)
- [ ] At least one user exists (seed or create via Prisma Studio)
- [ ] Browser devtools open — watch Console for errors throughout all tests

---

## Workflow 1: Authentication

### 1.1 Login — Happy Path
- [ ] Navigate to `http://localhost:3000` without a session → redirected to `/login`
- [ ] Enter valid credentials → redirected to `/` (Dashboard)
- [ ] Dashboard shows "SeeYou AroundTown" brand + nav links

### 1.2 Login — Error States
- [ ] Wrong password → error message shown, stays on `/login`
- [ ] Unknown email → error message shown
- [ ] Empty fields → browser/form validation prevents submit

### 1.3 Auth Protection
- [ ] Visit `/collections` without session → redirected to `/login`
- [ ] Visit `/collections/new` without session → redirected to `/login`
- [ ] Visit `/reports` without session → redirected to `/login`

### 1.4 Logout
- [ ] Click "Logout" in header → redirected to `/login`, session cleared
- [ ] After logout, visit `/` → redirected to `/login` (not cached dashboard)

---

## Workflow 2: Navigation

- [ ] Click **Dashboard** nav link → `/`, link highlighted
- [ ] Click **Collections** nav link → `/collections`, link highlighted
- [ ] Click **Reports** nav link → `/reports`, link highlighted
- [ ] On mobile (resize < 640px): hamburger icon shown, inline nav hidden
- [ ] Tap hamburger → mobile menu opens with all 3 links + Logout
- [ ] Tap a link in mobile menu → navigates correctly + menu closes

---

## Workflow 3: New Collection (Core Flow)

### 3.1 Basic Entry
- [ ] Navigate to `/collections/new`
- [ ] Select a collection date (today or earlier)
- [ ] Select a machine location from the dropdown
- [ ] Enter `machineCoins10baht` = `200`
- [ ] Verify right column **Summary** updates in real-time:
  - Machine Total = ฿2,000
  - Postcards Sold = 50
  - Revenue = ฿2,000
  - Cost ≈ ฿688.30 (50 × 13.766)
  - Profit ≈ ฿1,311.70

### 3.2 Exchange Box
- [ ] Enter coin/note counts in Exchange Box
- [ ] Verify Exchange Box Total updates in real-time
- [ ] Enter values totalling exactly ฿12,000 → badge shows **Balanced** (green)
- [ ] Enter values totalling ≠ ฿12,000 → badge shows **Unbalanced** (red)

### 3.3 Inventory
- [ ] Enter `postcardsRemaining` = `80`
- [ ] Click **"Refill postcards now?"** → Refill card appears in right column
- [ ] Enter `postcardsAdded` = `200`
- [ ] Verify Before = 80, Added = +200, After = 280
- [ ] Click **"Cancel refill"** → Refill card disappears, "No refill this round" placeholder shown

### 3.4 Validation Errors
- [ ] Submit with no location → validation error shown
- [ ] Enter `machineCoins10baht` = `201` (not divisible by 4) → error: "must be divisible by 4"
- [ ] Enter `machineCoins10baht` = `-1` → error shown
- [ ] Enter a future date → error: "cannot be in the future"

### 3.5 Save Without Refill
- [ ] Fill valid form (no refill), click **"Save Collection"**
- [ ] Toast: "Saved!" with postcards sold + profit
- [ ] Redirected or "Add Another" option shown
- [ ] Visit `/collections` → new record appears at top of table

### 3.6 Save With Refill
- [ ] Fill valid form, add refill (postcardsAdded > 0), click **"Save Collection & Refill"**
- [ ] Toast shows both collection summary and refill summary (e.g. "Refill: +200 → 280 total")
- [ ] Visit `/collections` → collection record appears

### 3.7 Duplicate Prevention
- [ ] Submit a collection with the same date + round + location as an existing record
- [ ] API returns 409 → toast shows error: "A collection already exists for this date, round, and location"

---

## Workflow 4: Collections History

### 4.1 Table Display
- [ ] Navigate to `/collections`
- [ ] All saved collections appear in table, sorted by date desc
- [ ] Columns visible: Date, Location, Coins, Revenue, Profit, Exchange status, Actions

### 4.2 Filters
- [ ] Filter by **Location** → only that location's records shown
- [ ] Filter by **Week** number → only that week shown
- [ ] Filter by **From** date → only records on/after shown
- [ ] Filter by **To** date → only records on/before shown
- [ ] Combine filters → results correctly intersected
- [ ] Clear filter → all records shown again

### 4.3 Sorting
- [ ] Click **Date** column header → sorts asc/desc
- [ ] Click **Revenue** column header → sorts correctly

### 4.4 View Details
- [ ] Click eye icon on a row → detail modal opens
- [ ] Modal shows all fields: date, location, coin counts, exchange breakdown, calculations, notes
- [ ] Close modal → returns to table

### 4.5 Delete
- [ ] Click delete icon on a row → confirmation dialog appears
- [ ] Confirm delete → row disappears from table (optimistic UI), toast shown
- [ ] Cancel delete → nothing changes

### 4.6 Pagination
- [ ] If > 10 records exist: pagination controls visible
- [ ] Next/Prev page works correctly

---

## Workflow 5: Dashboard

### 5.1 Stats Cards
- [ ] Stats reflect current week's collections (Revenue, Postcards Sold, Profit)
- [ ] Trend shows delta vs last week (green ↑ or red ↓)
- [ ] If no last week data → trend shows "—"
- [ ] Inventory card shows total postcards remaining + per-location breakdown

### 5.2 Charts
- [ ] Revenue & Profit area chart visible with last 8 weeks
- [ ] Postcards Sold bar chart visible
- [ ] Hover tooltip shows formatted values
- [ ] Weeks with no data show 0 (no crash/gap)

### 5.3 Empty State
- [ ] Delete all collections → Dashboard shows "No collections recorded yet" empty state (not broken stats)

---

## Workflow 6: Reports

### 6.1 Tables
- [ ] Navigate to `/reports`
- [ ] **Weekly Summary** table: one row per week, sorted desc, correct sums
- [ ] **By Location** table: one row per location, sorted by profit desc
- [ ] Totals row at bottom of each table matches sum of rows
- [ ] Revenue = gold, Cost = red, Profit = green

### 6.2 Export
- [ ] Click **"Export to Excel"** → file downloads as `seeyou-report-YYYY-MM-DD.xlsx`
- [ ] Open file in Excel / Numbers → 2 sheets: "Weekly Summary" and "By Location"
- [ ] Currency values are numbers (not strings) — Excel can sum them
- [ ] Totals row present on both sheets

### 6.3 Empty State
- [ ] With no collections: "No collections recorded yet" message shown, Export button hidden

---

## Workflow 7: Loading & Error States

### 7.1 Loading Skeletons
- [ ] Temporarily add `await new Promise(r => setTimeout(r, 2000))` to `getDashboardStats()` in `lib/stats.ts`
- [ ] Reload `/` → skeleton cards visible for ~2s, then real data
- [ ] Remove the delay after verifying
- [ ] Repeat for `/collections`, `/collections/new`, `/reports`

### 7.2 Error Boundary
- [ ] Temporarily add `throw new Error("test")` to `getDashboardStats()` in `lib/stats.ts`
- [ ] Reload `/` → error card shown ("Something went wrong") — NOT a Next.js crash page
- [ ] Click "Try Again" → re-fetches, recovers if error removed
- [ ] Click "Go to Dashboard" → navigates to `/`
- [ ] Remove the throw after verifying

---

## Calculation Verification

Cross-check these manually with known inputs:

| Input | Expected Output |
|-------|----------------|
| 200 coins → | 50 postcards, ฿2,000 revenue, ฿688.30 cost, ฿1,311.70 profit |
| 400 coins → | 100 postcards, ฿4,000 revenue, ฿1,376.60 cost, ฿2,623.40 profit |
| 0 coins → | 0 postcards, ฿0 revenue, ฿0 cost, ฿0 profit |

Formula: `postcardsSold = coins ÷ 4`, `revenue = postcardsSold × 40`, `cost = postcardsSold × costPerPostcard`

---

## Bug Fix Protocol

When a bug is found during testing:
1. Note it in the **Bug Log** section below
2. Fix immediately before continuing to the next workflow
3. Re-test the affected workflow after fixing
4. Build must pass (`npm run build`) before marking PRP complete

---

## Bug Log

| # | Workflow | Description | Status |
|---|----------|-------------|--------|
| — | — | None found yet | — |

---

## Acceptance Criteria

- [ ] All 7 workflows pass without bugs
- [ ] No console errors in browser devtools during normal use
- [ ] Calculations match the formula table above
- [ ] `npm run build` passes cleanly
- [ ] Bug Log: all found bugs fixed

---

## Estimated Time
**3 hours** (testing) + bug fix time

---

**Previous PRP**: PRP-011 (Responsive Design — skipped) ✅
**Next PRP**: PRP-013 (Production Deployment)
