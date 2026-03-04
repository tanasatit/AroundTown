# PRP-003: Dashboard Stats Cards

## Problem
Users need a homepage that shows at-a-glance business performance for the current week. Right now `/` shows the Next.js default placeholder. We need to replace it with a real dashboard.

## Scope
- **In scope**: Dashboard homepage, stats API endpoint, 4 stat cards with trends, loading skeletons
- **Out of scope**: Charts (PRP-007), collections history table (PRP-004), navigation sidebar (PRP-009)

---

## Requirements

### Functional Requirements

#### FR-1: Dashboard Page
- Replace `app/page.tsx` (Next.js placeholder) with a proper redirect
- Create dashboard at `app/(dashboard)/page.tsx` → URL: `/`
- Protected route via existing `(dashboard)` layout auth check
- Show 4 stat cards + quick action button

#### FR-2: Stat Cards
Four cards required:

| Card | Value | Trend |
|------|-------|-------|
| Revenue | Sum of revenue this week | vs last week (฿ delta + %) |
| Postcards Sold | Sum of postcardsSold this week | vs last week (count delta + %) |
| Profit | Sum of profit this week | vs last week (฿ delta + %) |
| Inventory | Combined postcardsRemaining (latest collection per location) | none |

#### FR-3: "This Week" Definition
- Use `weekNumber` field to identify current week
- Current week = `getCurrentWeekNumber()` (same function used in the form)
- Last week = `currentWeek - 1`
- No year scoping for now (simple system, < 1 year of data)

#### FR-4: Inventory Calculation
- No standalone inventory table exists yet (PRP-005/006 not done)
- Inventory = `postcardsRemaining` from the **most recent collection per location**
- Show total across all locations + breakdown by location

#### FR-5: Trend Indicators
- Show delta (this week - last week)
- Show percentage change
- Green arrow up = positive, Red arrow down = negative
- If last week had no data, show "—" instead of a percentage

#### FR-6: Stats API Endpoint
- `GET /api/stats` — returns all data needed for the dashboard
- Requires auth
- Single request (not multiple round trips)

#### FR-7: Loading State
- Show skeleton cards while fetching
- Use shadcn/ui `Skeleton` component

#### FR-8: Empty State
- If no collections exist at all, show a friendly message with a "Record First Collection" button

### Non-Functional Requirements

#### NFR-1: Performance
- Stats query must complete < 500ms
- Use Prisma `groupBy` or aggregation for efficient sums
- No N+1 queries

#### NFR-2: UX
- Dashboard must be the first thing the user sees after login
- Quick action: "New Collection" button prominently placed

---

## API Specification

### GET /api/stats

**Success Response (200)**:
```json
{
  "thisWeek": {
    "weekNumber": 9,
    "revenue": 12000,
    "postcardsSold": 300,
    "profit": 8869.80,
    "collections": 4
  },
  "lastWeek": {
    "weekNumber": 8,
    "revenue": 9600,
    "postcardsSold": 240,
    "profit": 7095.84,
    "collections": 3
  },
  "trends": {
    "revenue": { "delta": 2400, "percent": 25.0 },
    "postcardsSold": { "delta": 60, "percent": 25.0 },
    "profit": { "delta": 1773.96, "percent": 25.0 }
  },
  "inventory": {
    "total": 450,
    "byLocation": [
      { "location": "Rare Aroon - Ground Floor", "remaining": 250 },
      { "location": "Central World - 3rd Floor", "remaining": 200 }
    ]
  }
}
```

**Error Responses**:
- 401: Unauthorized
- 500: Server error

---

## UI Design

### Layout
```
+--------------------------------------------------+
|  SeeYou AroundTown              [user] [logout]  |
+--------------------------------------------------+
|                                                  |
|  Dashboard              [+ New Collection]       |
|  Week 9                                          |
|                                                  |
|  +----------+  +----------+  +----------+  +----------+
|  | Revenue  |  | Postcards|  | Profit   |  |Inventory |
|  | ฿12,000  |  | 300      |  | ฿8,869   |  | 450      |
|  | ↑25% vs  |  | ↑25% vs  |  | ↑25% vs  |  | 250 Rare |
|  | last week|  | last week|  | last week|  | 200 CW   |
|  +----------+  +----------+  +----------+  +----------+
|                                                  |
+--------------------------------------------------+
```

### Stat Card Component
```
+---------------------------+
| Revenue          [icon]   |
|                           |
| ฿12,000                   |
|                           |
| ↑ ฿2,400 (25%)            |
| vs last week              |
+---------------------------+
```

- Dark card background (`bg-card`)
- Gold color for revenue/profit values (`text-thai-gold`)
- Green for positive trends, red for negative
- Muted text for label and trend line

---

## Implementation Plan

### Step 1: Stats API
**File**: `app/api/stats/route.ts`

Logic:
1. Get current week number
2. Query collections for this week (aggregate revenue, postcardsSold, profit, count)
3. Query collections for last week (same aggregation)
4. Calculate trend deltas and percentages
5. Query latest collection per location for inventory
6. Return combined response

```typescript
// Pseudocode for aggregation
const thisWeekCollections = await prisma.collection.findMany({
  where: { weekNumber: currentWeek },
});
// Calculate sums using calculateCollectionMetrics per row, then sum
```

> Note: Prisma doesn't natively sum Decimal calculations (postcardsSold is derived),
> so fetch rows and reduce in JS using `calculateCollectionMetrics`.

### Step 2: Replace Root Page
**File**: `app/page.tsx`

Replace the Next.js placeholder with a redirect to ensure the `(dashboard)` layout handles the root URL properly. Since `app/(dashboard)/page.tsx` and `app/page.tsx` both resolve to `/`, we must remove `app/page.tsx` and use only `app/(dashboard)/page.tsx`.

### Step 3: Dashboard Page
**File**: `app/(dashboard)/page.tsx`

- Server component — fetch stats from `/api/stats` using server-side fetch
- Pass data to `<StatsCards>` client component
- Wrap in `<Suspense>` with `<StatsCardsSkeleton>` fallback

### Step 4: StatsCards Component
**File**: `components/dashboard/stats-cards.tsx`

- Receives stats data as props
- Renders 4 `<StatCard>` components
- Handles empty state

### Step 5: StatCard Component
**File**: `components/dashboard/stat-card.tsx`

- shadcn `Card` with dark theme
- Props: `title`, `value`, `formatted`, `trend`, `icon`, `children` (for inventory breakdown)

### Step 6: Skeleton Loader
**File**: `components/dashboard/stats-cards-skeleton.tsx`

- 4 skeleton cards matching the real card dimensions
- Use shadcn `Skeleton`

---

## Files to Create

### New Files
1. `app/api/stats/route.ts` — Stats API endpoint
2. `app/(dashboard)/page.tsx` — Dashboard page (replaces root)
3. `components/dashboard/stats-cards.tsx` — Stats cards grid
4. `components/dashboard/stat-card.tsx` — Individual stat card
5. `components/dashboard/stats-cards-skeleton.tsx` — Loading skeleton

### Modified Files
1. `app/page.tsx` — Delete (replaced by `app/(dashboard)/page.tsx`)

---

## Acceptance Criteria

- [ ] `/` shows dashboard (not Next.js placeholder) after login
- [ ] `/` redirects to `/login` if not authenticated
- [ ] 4 stat cards visible: Revenue, Postcards Sold, Profit, Inventory
- [ ] Values reflect current week's collections
- [ ] Trend shows delta and % vs last week
- [ ] Trend is green (positive) or red (negative)
- [ ] If last week has no data, trend shows "—"
- [ ] Inventory shows total + per-location breakdown
- [ ] Skeleton cards show while loading
- [ ] Empty state shows if no collections exist
- [ ] "New Collection" button links to `/collections/new`
- [ ] No TypeScript errors
- [ ] Build passes

---

## Testing Checklist

### Happy Path
- [ ] Login → redirected to `/` → dashboard shows
- [ ] Stats reflect collections in database
- [ ] Trend arrows correct (up for increase, down for decrease)

### Edge Cases
- [ ] No collections at all → empty state shown
- [ ] Collections this week but none last week → trend shows "—"
- [ ] Collections last week but none this week → values show 0, trends show -100%
- [ ] Single location → inventory breakdown shows one row

### Auth
- [ ] Access `/` without session → redirect to `/login`

---

## Dependencies
- ✅ PRP-001 (Collection API) — data exists in DB
- ✅ PRP-002 (Collection Form) — can create test data
- ✅ `lib/calculations.ts` — reuse `calculateCollectionMetrics` and `getCurrentWeekNumber`
- shadcn/ui `Skeleton` component (may need to install)

---

## Questions Locked Before Implementation

1. **"This week" definition**: Use `weekNumber` field ✓
2. **Inventory source**: Most recent collection per location's `postcardsRemaining` ✓
3. **Trend for no-data case**: Show "—" instead of crashing ✓
4. **API approach**: Single `GET /api/stats` endpoint ✓
5. **Data fetching**: Server component with direct DB access (not client fetch) ✓
6. **Root page conflict**: Delete `app/page.tsx`, use `app/(dashboard)/page.tsx` ✓

---

## Estimated Time
**3 hours**

---

**Previous PRP**: PRP-002 (Collection Entry Form) ✅
**Next PRP**: PRP-004 (Collections History Table)
